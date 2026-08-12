import logging
import os
from app.schemas.chat import ChatRequest, ChatResponse
from app.providers.groq_provider import GroqProvider
from app.core.exceptions import LLMProviderException

logger = logging.getLogger("app.services.chat_service")

class ChatService:
    """Business logic service for managing AI Mentor chat completions.
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

    async def process_chat(self, request: ChatRequest, user_id: str = None) -> ChatResponse:
        """Coordinates system prompt loading, messages formatting, and querying the provider."""
        # Load system base prompt and behaviors
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

        # 1. Format Learner Profile
        profile_str = ""
        profile_data = request.learnerProfile
        if not profile_data and user_id:
            try:
                import httpx
                from app.core.config import settings
                
                async with httpx.AsyncClient() as client:
                    url = f"{settings.BACKEND_URL}/api/v1/learning-profile"
                    headers = {
                        "X-Internal-Key": settings.INTERNAL_API_KEY,
                        "X-User-Id": user_id
                    }
                    response = await client.get(url, headers=headers, timeout=5.0)
                    if response.status_code == 200:
                        data = response.json()
                        if data.get("success") and data.get("data"):
                            res_data = data["data"]
                            if res_data.get("onboardingCompleted") and res_data.get("profile"):
                                profile_data = res_data["profile"]
            except Exception as e:
                logger.error(f"Error fetching learner profile for user {user_id}: {str(e)}")

        if profile_data:
            goals_list = "\n".join([f"- {g}" for g in profile_data.get("goals", [])]) if isinstance(profile_data.get("goals"), list) else ""
            interests_list = "\n".join([f"- {i}" for i in profile_data.get("interests", [])]) if isinstance(profile_data.get("interests"), list) else ""
            profile_str = f"""
### LEARNER PROFILE:
- **Native Language**: {profile_data.get('nativeLanguage', 'Malayalam')}
- **Age Group**: {profile_data.get('ageGroup', 'Unknown')}
- **Occupation**: {profile_data.get('occupation', 'Unknown')}
- **English Level**: {profile_data.get('englishLevel', 'Intermediate')}
- **Learning Goals**:
{goals_list if goals_list else '- None'}
- **Interests**:
{interests_list if interests_list else '- None'}
- **Daily Learning Goal**: {profile_data.get('dailyGoal', 15)} minutes
"""
            system_prompt_parts.append(profile_str.strip())

        # 2. Format Lesson Context
        if request.lessonContext:
            lc = request.lessonContext
            objectives_data = lc.get('objectives', 'Practice speaking and listening')
            objectives_str = objectives_data if isinstance(objectives_data, str) else ", ".join(objectives_data) if isinstance(objectives_data, list) else str(objectives_data)
            lesson_str = f"""
### ACTIVE STUDY PLAN LESSON CONTEXT:
- **Title**: {lc.get('title', 'English Lesson')}
- **Lesson Type**: {lc.get('lessonType', 'Conversation')}
- **Estimated Duration**: {lc.get('estimatedMinutes', 15)} minutes
- **Difficulty Level**: {lc.get('difficulty', 'Beginner')}
- **Objectives**: {objectives_str}
"""
            system_prompt_parts.append(lesson_str.strip())

        # 3. Format Learning Memory
        if request.learningMemory:
            lm = request.learningMemory
            
            weak_topics_str = "\n".join([f"- {t}" for t in lm.get("weakGrammarTopics", [])]) if isinstance(lm.get("weakGrammarTopics"), list) else ""
            
            vocab_list = lm.get("vocabulary", [])
            vocab_str = ""
            if isinstance(vocab_list, list):
                vocab_str = "\n".join([f"- {v.get('word')} ({v.get('status', 'new')})" for v in vocab_list if isinstance(v, dict)])
                
            mistakes_list = lm.get("previousMistakes", [])
            mistakes_str = ""
            if isinstance(mistakes_list, list):
                mistakes_str = "\n".join([f"- Learned: '{m.get('original')}' -> Correct: '{m.get('corrected')}' ({m.get('explanation')})" for m in mistakes_list if isinstance(m, dict)])
                
            strengths_str = "\n".join([f"- {s}" for s in lm.get("strengths", [])]) if isinstance(lm.get("strengths"), list) else ""
            
            memory_str = f"""
### LEARNING MEMORY & ANALYTICS:
- **Weak Grammar Topics to practice/address**:
{weak_topics_str if weak_topics_str else '- None recorded yet'}
- **Vocabulary currently learning/mastered**:
{vocab_str if vocab_str else '- None recorded yet'}
- **Previous mistakes to watch out for**:
{mistakes_str if mistakes_str else '- None recorded yet'}
- **Current Strengths**:
{strengths_str if strengths_str else '- None recorded yet'}
- **Recent Session Summary**: {lm.get('recentSessionSummary', 'No recent sessions')}
- **Current Fluency Score**: {lm.get('fluency', 70)}/100
- **Current Confidence Score**: {lm.get('confidence', 70)}/100
"""
            system_prompt_parts.append(memory_str.strip())

        system_prompt = "\n\n".join(system_prompt_parts)
        
        # Build user turn payload incorporating history if available
        messages = []
        if request.history:
            for msg in request.history:
                role = "assistant" if msg.role.lower() == "assistant" else "user"
                messages.append({"role": role, "content": msg.content})

        # Append the new user message if it is not already the last item in history
        if not messages or messages[-1]["content"] != request.message:
            messages.append({"role": "user", "content": request.message})
        
        logger.debug(f"Processing chat session={request.sessionId} | language={request.language}")
        
        # Execute chat completion via the Groq provider
        reply_text = await self.provider.complete(
            system_prompt=system_prompt,
            messages=messages,
            temperature=0.7
        )

        return ChatResponse(
            reply=reply_text,
            provider="groq",
            model=self.provider.model
        )

# Singleton service instance
chat_service = ChatService()
