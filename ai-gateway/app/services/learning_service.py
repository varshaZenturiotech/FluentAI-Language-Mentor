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

        logger.info("Sending session analysis request to Groq")
        response_text = await self.provider.complete(
            system_prompt=system_prompt,
            messages=[{"role": "user", "content": user_message}],
            temperature=0.3,
            json_mode=True
        )

        try:
            analysis_data = json.loads(response_text)
            # Inject pronunciation fields
            # Real pronunciation scoring should come from pronunciation_service.py once it's backed by actual audio analysis, and should be merged into the session-analysis response at that point rather than re-fabricated by the text-based LLM call.
            analysis_data["pronunciationScore"] = pronunciation_score
            analysis_data["pronunciationScoreAvailable"] = pronunciation_available
            return analysis_data
        except Exception as e:
            logger.error(f"Failed to parse session analysis JSON: {response_text}. Error: {str(e)}")
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

        logger.info("Sending baseline evaluation request to Groq")
        response_text = await self.provider.complete(
            system_prompt=system_prompt,
            messages=[{"role": "user", "content": user_message}],
            temperature=0.2,
            json_mode=True
        )

        try:
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
            logger.error(f"Failed to parse baseline evaluation JSON: {response_text}. Error: {str(e)}")
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

learning_service = LearningService()
