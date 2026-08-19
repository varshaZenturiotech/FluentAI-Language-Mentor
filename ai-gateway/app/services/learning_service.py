import json
import logging
from app.providers.groq_provider import GroqProvider

logger = logging.getLogger("app.services.learning_service")

class LearningService:
    def __init__(self):
        self.provider = GroqProvider()

    async def analyze_session(self, profile: dict, study_plan: dict | None, current_lesson: str | dict | None, weak_topics: list | None, recent_vocab: list | None, prev_summary: str | None, messages: list[dict]) -> dict:
        system_prompt = """You are an expert English Language tutor and learning analyst.
Your task is to analyze the last 10 messages of an English learning chat session and output learning metrics and evaluation JSON.
The output MUST be a valid JSON object matching the following structure:
{
  "completed": true,
  "completionPercentage": 100,
  "lessonCompletion": 100,
  "studyMinutes": 15,
  "grammarScore": 80,
  "vocabularyScore": 70,
  "confidenceScore": 75,
  "fluencyScore": 65,
  "grammarMistakes": [
    {
      "sentence": "incorrect sentence spoken by user",
      "correctSentence": "corrected sentence",
      "explanation": "why this correction was made",
      "grammarRule": "e.g. Present Perfect",
      "mistakeType": "e.g. Tense Error"
    }
  ],
  "weakTopics": ["Present Perfect"],
  "weakAreas": ["Present Perfect"],
  "newWords": ["deployment", "repository"],
  "newVocabulary": ["deployment", "repository"],
  "masteredWords": ["sprint"],
  "completedObjectives": ["Spoke about software engineering"],
  "objectivesCompleted": ["Spoke about software engineering"],
  "recommendedTopics": ["Business meetings"],
  "recommendation": "Review Present Perfect verbs in business contexts."
}

Instructions:
1. Return ONLY raw JSON. No markdown code blocks, no trailing comments, no leading text. Just the JSON object.
2. "completed" MUST be true ONLY if the learner successfully practiced/addressed today's lesson objectives and had a meaningful interactive exchange (e.g. at least 4 messages from user). Otherwise, set "completed" to false.
3. Evaluate mistakes and vocabulary. If no mistakes, grammarMistakes should be empty list.
4. Be fair with scores (0-100).
"""

        # Limit messages to last 10
        last_10_messages = messages[-10:] if messages else []
        formatted_messages = "\n".join([f"{msg.get('role', 'user')}: {msg.get('content', '')}" for msg in last_10_messages])

        user_message = f"""Analyze this English learning session:

Learner Profile:
- Occupation: {profile.get('occupation', 'Software Engineer')}
- English Level: {profile.get('englishLevel', 'Intermediate')}
- Native Language: {profile.get('nativeLanguage', 'Malayalam')}
- Goals: {", ".join(profile.get('goals', []))}
- Interests: {", ".join(profile.get('interests', []))}

Current Study Plan:
{json.dumps(study_plan) if study_plan else "None"}

Current Lesson:
{json.dumps(current_lesson) if current_lesson else "None"}

Weak Topics:
{", ".join(weak_topics) if weak_topics else "None"}

Recent Vocabulary:
{", ".join(recent_vocab) if recent_vocab else "None"}

Previous Session Summary:
{prev_summary if prev_summary else "None"}

Last 10 Messages:
{formatted_messages}
"""

        # Real pronunciation scoring should come from pronunciation_service.py once it's backed by actual audio analysis, and should be merged into the session-analysis response at that point rather than re-fabricated by the text-based LLM call.
        pronunciation_score = None
        pronunciation_available = False

        try:
            logger.info("Sending session analysis request to Groq")
            response_text = await self.provider.complete(
                system_prompt=system_prompt,
                messages=[{"role": "user", "content": user_message}],
                temperature=0.3,
                json_mode=True
            )
            analysis_data = json.loads(response_text)
            # Inject pronunciation fields
            # Real pronunciation scoring should come from pronunciation_service.py once it's backed by actual audio analysis, and should be merged into the session-analysis response at that point rather than re-fabricated by the text-based LLM call.
            analysis_data["pronunciationScore"] = pronunciation_score
            analysis_data["pronunciationScoreAvailable"] = pronunciation_available
            return analysis_data
        except Exception as e:
            logger.error(f"Failed to parse session analysis: {str(e)}")
            # Fallback structure
            return {
                "completed": False,
                "completionPercentage": 50,
                "lessonCompletion": 50,
                "studyMinutes": 10,
                "grammarScore": 75,
                "vocabularyScore": 70,
                "confidenceScore": 70,
                "fluencyScore": 65,
                # Real pronunciation scoring should come from pronunciation_service.py once it's backed by actual audio analysis, and should be merged into the session-analysis response at that point rather than re-fabricated by the text-based LLM call.
                "pronunciationScore": pronunciation_score,
                "pronunciationScoreAvailable": pronunciation_available,
                "grammarMistakes": [],
                "weakTopics": [],
                "weakAreas": [],
                "newWords": [],
                "newVocabulary": [],
                "masteredWords": [],
                "completedObjectives": [],
                "objectivesCompleted": [],
                "recommendedTopics": [],
                "recommendation": "Try to practice more conversation topics and speak at least 4 turns."
            }

    async def evaluate_baseline(self, request_data: dict) -> dict:
        """Evaluates a learner's baseline assessment inputs using LLM analysis and multiple choice results.
        Returns a structured evaluation report.
        """
        system_prompt = """You are an expert English Language assessor and CEFR certifier.
Your task is to analyze a learner's baseline assessment inputs: their written text, their spoken transcript (if available), and their multiple-choice scores in Grammar, Vocabulary, Reading, and Listening.
You must output a comprehensive baseline language evaluation matching this JSON structure:
{
  "grammar": { "score": 85, "level": "B2", "strengths": ["Good verb agreement"], "weaknesses": ["Minor preposition errors"] },
  "vocabulary": { "score": 75, "level": "B1", "strengths": ["Good daily vocabulary"], "weaknesses": ["Needs more academic words"] },
  "reading": { "score": 80, "level": "B2", "strengths": ["Understands main idea"], "weaknesses": ["Inference questions could improve"] },
  "listening": { "score": 70, "level": "B1", "strengths": ["Basic comprehension"], "weaknesses": ["Struggles with fast speaking"] },
  "writing": { "score": 65, "level": "B1", "strengths": ["Coherent ideas"], "weaknesses": ["Needs complex sentence structures"] },
  "speaking": { "score": 60, "level": "B1", "strengths": ["Communicates intent"], "weaknesses": ["Frequent pauses", "Simple grammar"] },
  "pronunciation": { "score": 0, "level": "N/A", "strengths": [], "weaknesses": [], "assessmentStatus": "unavailable" },
  "fluency": { "score": 62, "level": "B1", "strengths": ["Steady pace"], "weaknesses": ["Struggles with word retrieval"] },
  "overallScore": 70,
  "overallLevel": "B1",
  "strengths": ["Reading comprehension", "Basic communication"],
  "weaknesses": ["Speaking confidence", "Sentence structure complexity"],
  "assessmentStatus": "completed"
}

Instructions:
1. Grade each skill objectively. Utilize CEFR definitions (Pre-A1, A1, A2, B1, B2, C1, C2) and internal scores (0 to 100).
2. Incorporate multiple-choice (MCQ) correct/total ratios to calibrate the starting baseline for Grammar, Vocabulary, Reading, and Listening.
3. Critically analyze the written text for grammar errors, vocabulary depth, spelling, and sentence complexity to grade Writing.
4. If a spoken transcript is provided, analyze it for grammatical correctness, conversational coherence, and vocabulary choice to grade Speaking and Fluency. If not provided, Speaking/Fluency should be set to default/placeholder (e.g. score 0, level "N/A").
5. For Pronunciation, since reliable audio/phoneme analysis is not currently active, set it to:
   "pronunciation": { "score": 0, "level": "N/A", "strengths": [], "weaknesses": [], "assessmentStatus": "unavailable" }
   And do NOT count Pronunciation in the weighted overallScore.
6. Calculate the overallScore as a simple average of the remaining 7 active skills (Grammar, Vocabulary, Reading, Listening, Writing, Speaking, Fluency).
7. Return ONLY raw JSON. No markdown backticks, no comments, no extra text.
"""

        user_message = f"""Analyze these baseline assessment inputs for grading:
- Target English Level: {request_data.get('targetLevel', 'Intermediate')}
- Multiple Choice Results:
  * Grammar MCQ: {request_data.get('mcGrammarScore', 0)} / {request_data.get('mcGrammarTotal', 1)}
  * Vocabulary MCQ: {request_data.get('mcVocabularyScore', 0)} / {request_data.get('mcVocabularyTotal', 1)}
  * Reading MCQ: {request_data.get('mcReadingScore', 0)} / {request_data.get('mcReadingTotal', 1)}
  * Listening MCQ: {request_data.get('mcListeningScore', 0)} / {request_data.get('mcListeningTotal', 1)}

- Written Response:
\"\"\"{request_data.get('writingText', '')}\"\"\"

- Spoken Response Transcript (if available):
\"\"\"{request_data.get('speakingTranscript', 'No audio/speaking response provided.')}\"\"\"

Please evaluate all skills accordingly.
"""

        try:
            logger.info("Sending baseline evaluation request to Groq")
            response_text = await self.provider.complete(
                system_prompt=system_prompt,
                messages=[{"role": "user", "content": user_message}],
                temperature=0.2,
                json_mode=True
            )
            evaluation = json.loads(response_text)
            # Ensure pronunciation is explicitly marked as unavailable
            evaluation["pronunciation"] = {
                "score": 0,
                "level": "N/A",
                "strengths": [],
                "weaknesses": [],
                "assessmentStatus": "unavailable"
            }
            # Calculate overall score excluding pronunciation
            active_skills = ["grammar", "vocabulary", "reading", "listening", "writing", "speaking", "fluency"]
            scores = []
            for skill in active_skills:
                val = evaluation.get(skill, {}).get("score", 0)
                scores.append(val)
            evaluation["overallScore"] = int(sum(scores) / len(scores)) if scores else 0
            
            return evaluation
        except Exception as e:
            logger.error(f"Failed to parse baseline evaluation: {str(e)}")
            # Fallback structure
            return {
                "grammar": { "score": 50, "level": "A2", "strengths": ["Basic structures"], "weaknesses": [] },
                "vocabulary": { "score": 50, "level": "A2", "strengths": ["Common nouns"], "weaknesses": [] },
                "reading": { "score": 50, "level": "A2", "strengths": ["Basic decoding"], "weaknesses": [] },
                "listening": { "score": 50, "level": "A2", "strengths": ["Understands clear speech"], "weaknesses": [] },
                "writing": { "score": 50, "level": "A2", "strengths": ["Simple sentences"], "weaknesses": [] },
                "speaking": { "score": 50, "level": "A2", "strengths": ["Basic production"], "weaknesses": [] },
                "pronunciation": { "score": 0, "level": "N/A", "strengths": [], "weaknesses": [], "assessmentStatus": "unavailable" },
                "fluency": { "score": 50, "level": "A2", "strengths": ["Short phrases"], "weaknesses": [] },
                "overallScore": 50,
                "overallLevel": "A2",
                "strengths": [],
                "weaknesses": [],
                "assessmentStatus": "completed"
            }

    def _extract_and_parse_json(self, response_text: str) -> dict:
        import re
        import json

        # 1. Strip reasoning/think blocks (<think>...</think>)
        cleaned_text = re.sub(r'<think>[\s\S]*?</think>', '', response_text).strip()

        # 2. Try direct json.loads
        try:
            return json.loads(cleaned_text)
        except Exception:
            pass

        # 3. Try matching markdown code block ```json ... ```
        md_matches = re.findall(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", cleaned_text)
        for candidate in reversed(md_matches):
            try:
                sans_comments = re.sub(r'//.*', '', candidate)
                return json.loads(sans_comments)
            except Exception:
                pass

        # 4. Extract top-level JSON candidates using brace-level counting
        candidates = []
        stack = []
        start = -1
        for i, char in enumerate(cleaned_text):
            if char == '{':
                if not stack:
                    start = i
                stack.append('{')
            elif char == '}' and stack:
                stack.pop()
                if not stack and start != -1:
                    candidates.append(cleaned_text[start:i+1])
                    start = -1

        for candidate in reversed(candidates):
            try:
                sans_comments = re.sub(r'//.*', '', candidate)
                return json.loads(sans_comments)
            except Exception:
                pass

        # 5. Last resort: strip comments on whole text and load
        sans_comments = re.sub(r'//.*', '', cleaned_text)
        return json.loads(sans_comments)

    async def evaluate_conversational_turn(
        self,
        history: list,
        turn_count: int,
        user_message: str,
        target_level: str = "unknown"
    ) -> dict:
        """Processes a single turn in the conversational baseline assessment.
        Returns next mentor question or final evaluation report if complete.
        """
        system_prompt = """You are FluentAI, an warm, encouraging AI English Mentor conducting a natural conversational baseline assessment.

CRITICAL ROLE AND GOALS:
1. Conduct a natural, adaptive conversation with the learner to assess their English level across CEFR scales (Pre-A1 to C2).
2. DO NOT make it feel like an exam or test. NO "Question 1 of 6", NO multiple choice, NO scores during conversation, NO formal quiz instructions.
3. Adapt your follow-up questions dynamically based on the learner's demonstrated proficiency:
   - For simple/short answers (Beginner): Ask simple, friendly follow-ups with clear vocabulary.
   - For detailed/complex answers (Intermediate/Advanced): Ask for opinions, comparisons, or reasoning to evaluate higher-level grammar and vocabulary.
4. Cover key conversational topics across turns:
   - Turn 1: Work / daily routine. Ask what the learner does and what a typical day looks like for them (e.g. "Tell me about yourself. What do you do, and what do you usually do during your day?"). This surfaces present-tense/habitual-action usage.
   - Turn 2: Follow-up on their specific work. Ask about the kind of projects or tasks they handle day to day, building directly on what they just said (e.g. "Nice! Tell me about your work. What kind of projects do you usually work on?").
   - Turn 3: A short role-play prompt tied to their work context, to test spontaneous, less-rehearsed speech (e.g. "Now imagine you're meeting a new colleague for the first time. How would you introduce yourself?"). Prefer role-play scenarios (introducing themselves, explaining their job to someone new, asking for help at work) over abstract questions whenever the learner's answers suggest they'd benefit from a concrete scenario to react to.
   - Turn 4: Past experience / recent events (e.g. a project they finished, a challenge they solved).
   - Turn 5: Future goals / plans.
   - Turn 6+: Opinion / reasoning / problem solving.

Always build each question on the specific content of the learner's previous answer rather than asking a disconnected topic — the transition itself should read as a natural reaction to what they just said, not a topic switch.

IMPORTANT COMMUNICATION RULE:
Never use emojis, emoticons, decorative Unicode symbols, or emoji-style icons in assessment responses.

All greetings, questions, follow-ups, acknowledgements, transitions, and completion messages must be plain natural language suitable for spoken conversation and TTS.

Do not use emojis even when expressing friendliness, encouragement, excitement, or acknowledgement.

Use natural words instead, for example:
"That's interesting."
"Good to hear."
"That sounds useful."
"Tell me more about that."

OUTPUT FORMAT:
Return ONLY raw valid JSON matching this schema:
{
  "message": "Your next conversational question OR warm completion closing message.",
  "isCompleted": false,
  "turnCount": 6,
  "estimatedLevel": "B1",
  "coveredSkills": ["introduction", "daily_life", "past_experience"],
  "evaluation": null
}

CRITICAL INSTRUCTIONS:
1. DO NOT include any reasoning, thinking process, draft notes, commentary, or numbered lists in your output.
2. Your response MUST start immediately with '{' and end with '}'.
3. If isCompleted is false, evaluation MUST be null.
4. isCompleted MUST be set to true ONLY if turn_count >= 5 AND you have collected sufficient evidence to assess skills.

IF isCompleted IS true, the "evaluation" field MUST contain the full structured CEFR report:
{
  "message": "Thank you! That was really helpful. I have a good understanding of your English level now. I'll use what I learned to create your personalized learning plan.",
  "isCompleted": true,
  "turnCount": 6,
  "estimatedLevel": "B1",
  "coveredSkills": ["introduction", "daily_life", "past_experience", "future_plans", "opinion"],
  "evaluation": {
    "grammar": { "score": 75, "level": "B1", "strengths": ["Good basic tense usage"], "weaknesses": ["Minor tense consistency issues"] },
    "vocabulary": { "score": 70, "level": "B1", "strengths": ["Good everyday vocabulary"], "weaknesses": ["Could use more precise synonyms"] },
    "reading": { "score": 75, "level": "B1", "strengths": ["Comprehends conversational prompts"], "weaknesses": ["Complex clause parsing"] },
    "listening": { "score": 80, "level": "B2", "strengths": ["Responds accurately to audio questions"], "weaknesses": ["Fast nuanced speech"] },
    "writing": { "score": 70, "level": "B1", "strengths": ["Clear text communication"], "weaknesses": ["Sentence structure complexity"] },
    "speaking": { "score": 75, "level": "B1", "strengths": ["Expresses ideas naturally"], "weaknesses": ["Spoken pauses for vocabulary"] },
    "pronunciation": { "score": 0, "level": "N/A", "strengths": [], "weaknesses": [], "assessmentStatus": "unavailable" },
    "fluency": { "score": 72, "level": "B1", "strengths": ["Good conversational flow"], "weaknesses": ["Hesitations on complex topics"] },
    "overallScore": 74,
    "overallLevel": "B1",
    "strengths": ["Conversational clarity", "Active engagement"],
    "weaknesses": ["Advanced grammar structures", "Vocabulary range"],
    "assessmentStatus": "completed"
  }
}
"""

        # Format history
        formatted_history = []
        for item in (history or []):
            role = "assistant" if item.get("role") == "assistant" else "user"
            formatted_history.append(f"{role.capitalize()}: {item.get('content', '')}")

        if user_message and (not history or history[-1].get("content") != user_message):
            formatted_history.append(f"User: {user_message}")

        history_text = "\n".join(formatted_history) if formatted_history else "No prior history."
        logger.info(f"[LIVE_HISTORY_TEXT_BUILT] turnCount={turn_count}:\n{history_text}")

        user_prompt = f"""Process this baseline assessment turn:
Current Turn Count: {turn_count}
Target Level (self-reported): {target_level}

Conversation History so far:
{history_text}

Latest User Message:
\"{user_message}\"

Generate the next turn JSON now.
"""

        try:
            logger.info(f"Processing conversational baseline assessment turn | turnCount: {turn_count} | targetLevel: {target_level}")
            response_text = await self.provider.complete(
                system_prompt=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
                temperature=0.4,
                json_mode=False,
                max_tokens=2048
            )
            logger.info(f"[LIVE_RAW_LLM_RESPONSE] turnCount={turn_count}:\n{response_text}")

            # Robust multi-pass JSON extraction
            result = self._extract_and_parse_json(response_text)

            # Ensure fields exist
            result["turnCount"] = turn_count + 1
            if result.get("isCompleted") and result.get("evaluation"):
                # Normalize pronunciation and overall score
                eval_obj = result["evaluation"]
                if isinstance(eval_obj, dict):
                    eval_obj["pronunciation"] = {
                        "score": 0,
                        "level": "N/A",
                        "strengths": [],
                        "weaknesses": [],
                        "assessmentStatus": "unavailable"
                    }
                    active_skills = ["grammar", "vocabulary", "reading", "listening", "writing", "speaking", "fluency"]
                    scores = [eval_obj.get(s, {}).get("score", 70) if isinstance(eval_obj.get(s), dict) else 70 for s in active_skills]
                    eval_obj["overallScore"] = int(sum(scores) / len(scores)) if scores else 70
                    if "overallLevel" not in eval_obj or not eval_obj["overallLevel"]:
                        eval_obj["overallLevel"] = result.get("estimatedLevel", "B1")
                    eval_obj["assessmentStatus"] = "completed"
                    result["evaluation"] = eval_obj

            return result

        except Exception as e:
            logger.exception(f"Error evaluating conversational turn (turnCount: {turn_count}): {str(e)}")
            is_final_turn = turn_count >= 5
            if is_final_turn:
                return {
                    "message": "Thank you! I have a good understanding of your English level now. I'll use what I learned to create your personalized learning plan.",
                    "isCompleted": True,
                    "turnCount": turn_count + 1,
                    "estimatedLevel": "B1",
                    "coveredSkills": ["introduction", "daily_life", "past_experience", "future_plans", "opinion"],
                    "evaluation": {
                        "grammar": { "score": 70, "level": "B1", "strengths": ["Basic structures"], "weaknesses": [] },
                        "vocabulary": { "score": 70, "level": "B1", "strengths": ["Common vocabulary"], "weaknesses": [] },
                        "reading": { "score": 70, "level": "B1", "strengths": ["Prompt comprehension"], "weaknesses": [] },
                        "listening": { "score": 70, "level": "B1", "strengths": ["Audio engagement"], "weaknesses": [] },
                        "writing": { "score": 70, "level": "B1", "strengths": ["Text communication"], "weaknesses": [] },
                        "speaking": { "score": 70, "level": "B1", "strengths": ["Conversational responses"], "weaknesses": [] },
                        "pronunciation": { "score": 0, "level": "N/A", "strengths": [], "weaknesses": [], "assessmentStatus": "unavailable" },
                        "fluency": { "score": 70, "level": "B1", "strengths": ["Continuous dialog"], "weaknesses": [] },
                        "overallScore": 70,
                        "overallLevel": "B1",
                        "strengths": ["Active engagement", "Clear communication"],
                        "weaknesses": ["Grammar consistency"],
                        "assessmentStatus": "completed"
                    }
                }
            else:
                return {
                    "message": "That's interesting! Could you tell me a little more about what you enjoy doing in your free time?",
                    "isCompleted": False,
                    "turnCount": turn_count + 1,
                    "estimatedLevel": "B1",
                    "coveredSkills": ["introduction", "daily_life"],
                    "evaluation": None
                }

learning_service = LearningService()


