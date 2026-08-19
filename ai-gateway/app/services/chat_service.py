import logging
import os
from app.schemas.chat import ChatRequest, ChatResponse, LessonInitRequest
from app.providers.groq_provider import GroqProvider
from app.core.exceptions import LLMProviderException
from app.utils.sanitizer import sanitize_ai_response

logger = logging.getLogger("app.services.chat_service")

DEFAULT_CHAT_FALLBACK = "I understand! Could you share a bit more about that so we can continue practicing?"

DEFAULT_INIT_FALLBACK = "Welcome to your English lesson today! I am excited to practice speaking with you. What would you like to talk about?"

class ChatService:
    """Business logic service for managing AI Mentor chat completions and lesson initialization.
    Excludes any FastAPI web layer concerns.
    """
    
    def __init__(self):
        # Eagerly instantiate the Groq provider
        self.provider = GroqProvider()
        
        # Calculate prompt dir path relative to this file
        current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.prompt_dir = os.path.join(current_dir, "prompts")
        logger.info(f"ChatService initialized. Prompt directory: {self.prompt_dir}")

    def _load_prompt_file(self, filename: str) -> str:
        """Reads prompt instructions from the specified file under prompts/ dir.
        Throws a FileNotFoundError if the file is missing.
        """
        path = os.path.join(self.prompt_dir, filename)
        if not os.path.exists(path):
            raise FileNotFoundError(f"Critical: Prompt file {filename} is missing at {path}")
            
        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if not content:
                    raise ValueError(f"Critical: Prompt file at {path} is empty")
                return content
        except Exception as e:
            logger.critical(f"Failed to read prompt file {filename}: {str(e)}")
            raise

    def _format_context_blocks(
        self,
        learner_profile: dict | None,
        lesson_context: dict | None,
        learning_memory: dict | None,
        baseline: dict | None = None,
        study_plan: dict | None = None,
        progress: dict | None = None,
    ) -> list[str]:
        """Utility to format all available learner context blocks for system prompts."""
        blocks = []

        # 1. Learner Profile
        if learner_profile:
            p = learner_profile
            goals_list = "\n".join([f"- {g}" for g in p.get("goals", [])]) if isinstance(p.get("goals"), list) else ""
            interests_list = "\n".join([f"- {i}" for i in p.get("interests", [])]) if isinstance(p.get("interests"), list) else ""
            profile_str = f"""
### LEARNER PROFILE:
- **Native Language**: {p.get('nativeLanguage', 'Malayalam')}
- **Age Group**: {p.get('ageGroup', 'Unknown')}
- **Occupation**: {p.get('occupation', 'Unknown')}
- **English Level**: {p.get('englishLevel', 'Intermediate')}
- **Learning Goals**:
{goals_list if goals_list else '- None'}
- **Interests**:
{interests_list if interests_list else '- None'}
- **Daily Learning Goal**: {p.get('dailyGoal', p.get('dailyLearningGoal', 15))} minutes
"""
            blocks.append(profile_str.strip())

        # 2. Baseline Assessment
        if baseline:
            b = baseline
            base_str = f"""
### BASELINE ASSESSMENT RESULTS:
- **Overall Level**: {b.get('actualLevel', b.get('level', 'Beginner'))}
- **Grammar Score**: {b.get('grammar', b.get('actualGrammar', 50))}%
- **Vocabulary Score**: {b.get('vocabulary', b.get('actualVocabulary', 50))}%
- **Speaking Score**: {b.get('speaking', b.get('actualSpeaking', 50))}%
- **Listening Score**: {b.get('listening', b.get('actualListening', 50))}%
- **Pronunciation Score**: {b.get('pronunciation', b.get('actualPronunciation', 50))}%
- **Strengths**: {b.get('actualStrengths', b.get('strengths', 'Eager to learn'))}
- **Weaknesses**: {b.get('actualWeaknesses', b.get('weaknesses', 'Grammar accuracy'))}
"""
            blocks.append(base_str.strip())

        # 3. Lesson Context / Study Plan
        if lesson_context or study_plan:
            lc = lesson_context or {}
            sp = study_plan or {}
            objectives_data = lc.get('objectives', sp.get('objectives', 'Practice speaking and listening'))
            objectives_str = objectives_data if isinstance(objectives_data, str) else ", ".join(objectives_data) if isinstance(objectives_data, list) else str(objectives_data)
            lesson_str = f"""
### ACTIVE STUDY PLAN LESSON CONTEXT:
- **Study Plan**: {sp.get('title', 'Adaptive English Curriculum')}
- **Week**: {lc.get('weekNumber', sp.get('currentWeek', 1))} | **Day**: {lc.get('dayNumber', sp.get('currentDay', 1))}
- **Lesson Title**: {lc.get('title', lc.get('lessonTitle', 'English Practice'))}
- **Lesson Type**: {lc.get('lessonType', 'Conversation')}
- **Lesson Content**: {lc.get('lessonContent', lc.get('description', 'Practice core communication.'))}
- **Estimated Duration**: {lc.get('estimatedMinutes', 15)} minutes
- **Objectives**: {objectives_str}
"""
            blocks.append(lesson_str.strip())

        # 4. Progress
        if progress:
            pr = progress
            prog_str = f"""
### CURRENT LEARNER PROGRESS:
- **Lessons Completed**: {pr.get('lessonsCompleted', 0)}
- **Conversations Completed**: {pr.get('conversationsCompleted', 0)}
- **Streak**: {pr.get('streak', 0)} days
- **Overall Completion**: {pr.get('overallProgress', pr.get('completionPercentage', 0))}%
- **Current Level**: {pr.get('currentLevel', 'BEGINNER')}
"""
            blocks.append(prog_str.strip())

        # 5. Learning Memory
        if learning_memory:
            lm = learning_memory
            weak_topics_str = "\n".join([f"- {t}" for t in lm.get("weakGrammarTopics", lm.get("weakTopics", []))]) if isinstance(lm.get("weakGrammarTopics", lm.get("weakTopics")), list) else ""
            
            vocab_list = lm.get("vocabulary", lm.get("recentVocab", []))
            vocab_str = ""
            if isinstance(vocab_list, list):
                vocab_str = "\n".join([
                    f"- {v['word']} ({v['status']})" if isinstance(v, dict) and 'status' in v
                    else f"- {v['word']}" if isinstance(v, dict)
                    else f"- {v}"
                    for v in vocab_list
                ])
                
            mistakes_list = lm.get("previousMistakes", lm.get("grammarMistakes", []))
            mistakes_str = ""
            if isinstance(mistakes_list, list):
                mistakes_str = "\n".join([
                    f"- Learned: '{m.get('original', m.get('sentence', ''))}' -> Correct: '{m.get('corrected', m.get('correctSentence', ''))}' ({m.get('explanation', '')})"
                    if isinstance(m, dict) and (m.get('original') or m.get('sentence'))
                    else f"- Correct: '{m.get('corrected', m.get('correctSentence', ''))}' ({m.get('explanation', '')})"
                    if isinstance(m, dict)
                    else f"- {m}"
                    for m in mistakes_list
                ])
                
            masteries_list = lm.get("objectiveMasteries", [])
            masteries_str = ""
            if isinstance(masteries_list, list) and masteries_list:
                masteries_str = "\n".join([
                    f"- Objective: '{om.get('objective', '')}' | Mastery: {om.get('masteryScore', 0)}% ({om.get('attemptsCount', 0)} attempts)"
                    for om in masteries_list if isinstance(om, dict)
                ])

            memory_str = f"""
### LEARNING MEMORY & ANALYTICS:
- **Weak Grammar Topics**:
{weak_topics_str if weak_topics_str else '- None recorded yet'}
- **Vocabulary currently learning/mastered**:
{vocab_str if vocab_str else '- None recorded yet'}
- **Previous Mistakes**:
{mistakes_str if mistakes_str else '- None recorded yet'}
- **Objective Mastery History**:
{masteries_str if masteries_str else '- No prior objective records'}
- **Recent Session Summary**: {lm.get('recentSessionSummary', lm.get('prevSummary', 'No recent sessions'))}
"""
            blocks.append(memory_str.strip())

        return blocks

    def _extract_and_sanitize(self, raw_reply: str, request: any) -> tuple[str, bool, list[str]]:
        lesson_complete = False
        completed_objectives = []

        reply_text = raw_reply or ""
        if "[LESSON_COMPLETE" in reply_text:
            parts = reply_text.split("[LESSON_COMPLETE")
            clean_reply = parts[0].strip()
            marker_raw = parts[1].rstrip("]").strip(" :")
            lesson_complete = True
            if marker_raw:
                completed_objectives = [o.strip() for o in marker_raw.split("|") if o.strip()]
            elif hasattr(request, "lessonContext") and request.lessonContext and "objectives" in request.lessonContext:
                objs = request.lessonContext.get("objectives", [])
                completed_objectives = objs if isinstance(objs, list) else [str(objs)]
            reply_text = clean_reply

        reply_text = sanitize_ai_response(reply_text)
        return reply_text, lesson_complete, completed_objectives

    async def process_chat(self, request: ChatRequest, user_id: str = None, request_id: str = None) -> ChatResponse:
        """Coordinates system prompt loading, messages formatting, and querying the provider."""
        base_prompt = self._load_prompt_file("chat_system.txt")
        mentor_behavior = self._load_prompt_file("mentor_behavior.txt")
        correction_guidelines = self._load_prompt_file("correction_guidelines.txt")
        
        system_prompt_parts = [
            base_prompt,
            mentor_behavior,
            correction_guidelines
        ]

        if request.lessonContext:
            lesson_behavior = self._load_prompt_file("lesson_behavior.txt")
            system_prompt_parts.append(lesson_behavior)

        # Context formatting
        context_blocks = self._format_context_blocks(
            learner_profile=request.learnerProfile,
            lesson_context=request.lessonContext,
            learning_memory=request.learningMemory,
            baseline=request.baseline,
            study_plan=request.studyPlan,
            progress=request.progress
        )
        system_prompt_parts.extend(context_blocks)

        system_prompt = "\n\n".join(system_prompt_parts)
        
        messages = []
        if request.history:
            for msg in request.history:
                role = "assistant" if msg.role.lower() == "assistant" else "user"
                messages.append({"role": role, "content": msg.content})

        if not messages or messages[-1]["content"] != request.message:
            messages.append({"role": "user", "content": request.message})
        
        logger.debug(f"Processing chat session={request.sessionId} | reqId={request_id} | language={request.language}")
        
        # 1. Primary completion request with max_tokens=1024
        raw_reply = await self.provider.complete(
            system_prompt=system_prompt,
            messages=messages,
            temperature=0.7,
            max_tokens=1024
        )

        reply_text, lesson_complete, completed_objectives = self._extract_and_sanitize(raw_reply, request)
        has_think = "<think>" in raw_reply.lower()
        has_closing_think = "</think>" in raw_reply.lower()
        is_valid = bool(reply_text and reply_text.strip())

        logger.info(
            f"[AI_RESPONSE_VALIDATION] requestId={request_id} sessionId={request.sessionId} "
            f"rawLength={len(raw_reply)} sanitizedLength={len(reply_text)} "
            f"hasThinkTag={has_think} hasClosingThinkTag={has_closing_think} valid={is_valid} retryCount=0"
        )

        # 2. Controlled Retry if sanitized output is empty or unusable
        if not is_valid:
            logger.warning(
                f"[AI_RESPONSE_RETRY] Initial completion produced empty/unusable reply after sanitization. "
                f"Initiating controlled retry | requestId={request_id} sessionId={request.sessionId}"
            )
            
            retry_prompt = system_prompt + "\n\nCRITICAL RETRY INSTRUCTION: Provide ONLY your direct mentor reply. Do NOT output <think> tags or reasoning."
            retry_raw = await self.provider.complete(
                system_prompt=retry_prompt,
                messages=messages,
                temperature=0.5,
                max_tokens=1024
            )

            
            reply_text, lesson_complete, completed_objectives = self._extract_and_sanitize(retry_raw, request)
            retry_valid = bool(reply_text and reply_text.strip())
            
            logger.info(
                f"[AI_RESPONSE_VALIDATION] requestId={request_id} sessionId={request.sessionId} "
                f"rawLength={len(retry_raw)} sanitizedLength={len(reply_text)} "
                f"hasThinkTag={'<think>' in retry_raw.lower()} hasClosingThinkTag={'</think>' in retry_raw.lower()} "
                f"valid={retry_valid} retryCount=1"
            )

            # 3. Fallback Mechanism if retry also fails
            if not retry_valid:
                logger.error(
                    f"[AI_RESPONSE_FALLBACK] Controlled retry failed to produce valid reply. Applying safe fallback. "
                    f"requestId={request_id} sessionId={request.sessionId}"
                )
                reply_text = DEFAULT_CHAT_FALLBACK
                lesson_complete = False
                completed_objectives = []

        if len(reply_text) > 1200:
            logger.warning(
                f"[AIGATEWAY] Suspiciously large cleaned response | char_count={len(reply_text)} | session={request.sessionId}"
            )

        return ChatResponse(
            reply=reply_text,
            provider="groq",
            model=self.provider.model,
            lessonComplete=lesson_complete,
            completedObjectives=completed_objectives
        )

    async def process_lesson_init(self, request: LessonInitRequest, user_id: str = None, request_id: str = None) -> ChatResponse:
        """Generates the initial mentor message for a new study plan lesson using full learner context."""
        base_prompt = self._load_prompt_file("chat_system.txt")
        mentor_behavior = self._load_prompt_file("mentor_behavior.txt")
        lesson_behavior = self._load_prompt_file("lesson_behavior.txt")
        lesson_init_prompt = self._load_prompt_file("lesson_init_system.txt")

        system_prompt_parts = [
            base_prompt,
            mentor_behavior,
            lesson_behavior,
            lesson_init_prompt,
        ]

        context_blocks = self._format_context_blocks(
            learner_profile=request.learnerProfile,
            lesson_context=request.lessonContext,
            learning_memory=request.learningMemory,
            baseline=request.baseline,
            study_plan=request.studyPlan,
            progress=request.progress
        )
        system_prompt_parts.extend(context_blocks)

        system_prompt = "\n\n".join(system_prompt_parts)

        messages = [
            {
                "role": "user",
                "content": "Please initialize today's lesson and generate your opening mentor message now."
            }
        ]

        logger.info(f"Generating AI initial lesson greeting for session={request.sessionId} | reqId={request_id}")
        
        raw_reply = await self.provider.complete(
            system_prompt=system_prompt,
            messages=messages,
            temperature=0.7,
            max_tokens=512
        )

        reply_text = sanitize_ai_response(raw_reply)
        is_valid = bool(reply_text and reply_text.strip())

        logger.info(
            f"[AI_RESPONSE_VALIDATION] requestId={request_id} sessionId={request.sessionId} "
            f"rawLength={len(raw_reply)} sanitizedLength={len(reply_text)} "
            f"hasThinkTag={'<think>' in raw_reply.lower()} hasClosingThinkTag={'</think>' in raw_reply.lower()} "
            f"valid={is_valid} retryCount=0"
        )

        if not is_valid:
            logger.warning(f"[AI_RESPONSE_RETRY] Retrying lesson init completion | reqId={request_id} sessionId={request.sessionId}")
            retry_prompt = system_prompt + "\n\nCRITICAL RETRY INSTRUCTION: Provide ONLY your direct opening mentor message. Do NOT output <think> tags."
            retry_raw = await self.provider.complete(
                system_prompt=retry_prompt,
                messages=messages,
                temperature=0.5,
                max_tokens=512
            )
            reply_text = sanitize_ai_response(retry_raw)
            retry_valid = bool(reply_text and reply_text.strip())
            
            logger.info(
                f"[AI_RESPONSE_VALIDATION] requestId={request_id} sessionId={request.sessionId} "
                f"rawLength={len(retry_raw)} sanitizedLength={len(reply_text)} "
                f"valid={retry_valid} retryCount=1"
            )

            if not retry_valid:
                logger.error(f"[AI_RESPONSE_FALLBACK] Using lesson init fallback | reqId={request_id} sessionId={request.sessionId}")
                reply_text = DEFAULT_INIT_FALLBACK

        if len(reply_text) > 1200:
            logger.warning(
                f"[AIGATEWAY] Suspiciously large cleaned initial lesson response | char_count={len(reply_text)} | session={request.sessionId}"
            )

        return ChatResponse(
            reply=reply_text,
            provider="groq",
            model=self.provider.model
        )


# Singleton service instance
chat_service = ChatService()
