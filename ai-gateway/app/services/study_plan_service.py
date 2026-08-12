import json
import logging
import time
from app.providers.groq_provider import GroqProvider
from app.schemas.study_plan import GeneratePlanResponse
from app.core.exceptions import InternalServerErrorException
from pydantic import ValidationError

logger = logging.getLogger("app.services.study_plan_service")

class StudyPlanService:
    def __init__(self):
        self.provider = GroqProvider()

    async def generate_plan(self, profile: dict, baseline_skills: dict = None) -> dict:
        logger.info("[STUDY_PLAN_REQUEST_RECEIVED] study-plan/generate request received")
        
        system_prompt = """You are an expert English Language tutor and curriculum designer.
Your task is to generate a highly personalized, structured English learning study plan for a user based on their profile, baseline assessment skills, and prioritized focus areas.
The output MUST be a valid JSON object matching the following structure:
{
  "title": "Title of the study plan matching user goals",
  "description": "A warm, motivating description of the plan",
  "durationWeeks": 8,
  "weeks": [
    {
      "weekNumber": 1,
      "title": "Weekly theme title",
      "description": "Detailed description of weekly goals",
      "focusSkills": ["speaking", "fluency"],
      "objectives": [
        {
          "id": "w1_obj1",
          "description": "Measurable description (e.g., Speak for 60 seconds about a topic with fewer than 5 major hesitations)",
          "successCriteria": ["Uses complete sentences", "Speaks for 60 seconds"]
        }
      ],
      "days": [
        {
          "dayNumber": 1,
          "weekNumber": 1,
          "title": "Short title for the day's study",
          "estimatedMinutes": 20,
          "lessonType": "Vocabulary | Grammar | Conversation | Listening | Review",
          "lessonContent": "Concise instructions (1-2 sentences max) for today."
        }
      ]
    }
  ]
}

Instructions:
1. Generate exactly 8 weeks (durationWeeks = 8) and exactly 56 days (7 days per week, numbered 1 to 56 consecutively).
2. Day numbers must consecutively span 1 to 56 across the 8 weeks: Week 1 has days 1-7, Week 2 has days 8-14, ..., Week 8 has days 50-56.
3. For each day, lessonType must be one of: Vocabulary, Grammar, Conversation, Listening, Review.
4. Tailor the weekly theme, focusSkills, objectives, and daily lessonContent to the user's englishLevel, goals, occupation, and interests.
5. Adaptively prioritize skills with lower baseline assessment scores and those listed in priority_areas (allocating more weeks/lessons targeting those areas).
6. All objective IDs must be unique (e.g., w1_obj1, w1_obj2, w2_obj1). Success criteria must be clear, measurable, and non-empty.
7. Keep daily "lessonContent" extremely concise (1-2 sentences max) to fit within token limits.
8. Return ONLY raw JSON. No markdown code blocks, no trailing comments, no leading text. Just the JSON object.
"""

        user_message = f"""Generate a personalized English learning plan for this user:
- Age Group: {profile.get('ageGroup', '25-34')}
- Occupation: {profile.get('occupation', 'Professional')}
- English Level: {profile.get('englishLevel', 'Beginner')}
- Native Language: {profile.get('nativeLanguage', 'Malayalam')}
- Goals: {", ".join(profile.get('goals', ['General speaking']))}
- Interests: {", ".join(profile.get('interests', ['Technology']))}
- Daily Goal: {profile.get('dailyLearningGoal', 15)} minutes
"""
        if baseline_skills:
            is_actual = baseline_skills.get('is_actual_assessment', False)
            source_type = "measured actual assessment scores" if is_actual else "self-assessment scores"
            user_message += f"\nBaseline {source_type} (0-100 scale, lower means weaker skill to prioritize):\n"
            for skill, score in baseline_skills.items():
                if skill in ['grammar', 'vocabulary', 'reading', 'listening', 'writing', 'speaking', 'pronunciation', 'fluency'] and score is not None:
                    user_message += f"- {skill.capitalize()}: {score}\n"
            if baseline_skills.get('priority_areas'):
                user_message += f"- Calculated Priority Focus Areas: {', '.join(baseline_skills['priority_areas'])}\n"
            if is_actual:
                if baseline_skills.get('strengths'):
                    user_message += f"- Measured Strengths: {', '.join(baseline_skills['strengths']) if isinstance(baseline_skills['strengths'], list) else baseline_skills['strengths']}\n"
                if baseline_skills.get('weaknesses'):
                    user_message += f"- Measured Weaknesses: {', '.join(baseline_skills['weaknesses']) if isinstance(baseline_skills['weaknesses'], list) else baseline_skills['weaknesses']}\n"

        user_message += "\nIMPORTANT: You MUST generate exactly 8 weeks in the weeks array (from weekNumber 1 to weekNumber 8). Do NOT truncate, skip, or summarize any weeks. Every single week must contain exactly 7 days, so there are exactly 56 days in total in the final output JSON. Ensure every single day has a daily lesson."

        logger.info("[BASELINE_CONTEXT_VALIDATED] Baseline context validated")
        logger.info("[PROMPT_CREATED] Prompt created")

        logger.info("[GROQ_REQUEST_STARTED] Requesting study plan from Groq")
        groq_start_time = time.perf_counter()
        try:
            response_text = await self.provider.complete(
                system_prompt=system_prompt,
                messages=[{"role": "user", "content": user_message}],
                temperature=0.7,
                json_mode=True,
                max_tokens=4096
            )
        except Exception as e:
            logger.error(f"[STUDY_PLAN_GENERATION_FAILED] Groq completion call failed: {str(e)}")
            raise e

        groq_duration_ms = int((time.perf_counter() - groq_start_time) * 1000)
        response_length = len(response_text)
        logger.info(f"[GROQ_RESPONSE_RECEIVED] Received response from Groq. Length: {response_length} chars. Duration: {groq_duration_ms}ms")

        try:
            plan_data = json.loads(response_text)
            logger.info("[LLM_JSON_PARSED] Parsed response text as JSON successfully")
            
            validated_plan = GeneratePlanResponse.model_validate(plan_data)
            logger.info("[PLAN_SCHEMA_VALIDATED] Validated study plan schema successfully")
            
            logger.info(
                f"[STUDY_PLAN_GENERATION_SUCCESS] Generated study plan successfully. "
                f"safe_metadata: duration_ms={groq_duration_ms}, response_length={response_length}, "
                f"number_of_weeks={len(validated_plan.weeks)}, "
                f"number_of_days={sum(len(w.days) for w in validated_plan.weeks)}, "
                f"validation_status=success"
            )
            return plan_data
        except (json.JSONDecodeError, ValidationError, TypeError, KeyError, ValueError) as e:
            logger.warning(
                f"[FALLBACK_USED] Recoverable failure in parsing or validating LLM response: {str(e)}. "
                f"Generating fallback study plan."
            )
            
            # Fallback structure with exactly 8 weeks and 56 days
            weeks_fallback = []
            for w in range(1, 9):
                days_fallback = []
                for d in range((w - 1) * 7 + 1, w * 7 + 1):
                    days_fallback.append({
                        "dayNumber": d,
                        "weekNumber": w,
                        "title": f"English Practice Day {d}",
                        "estimatedMinutes": profile.get('dailyLearningGoal', 20) or 20,
                        "lessonType": "Vocabulary" if d % 2 == 1 else "Grammar",
                        "lessonContent": "Review work communication phrases, practice daily greetings, and study sentence structures."
                    })
                weeks_fallback.append({
                    "weekNumber": w,
                    "title": f"Theme Focus Week {w}",
                    "description": f"Targeted review of key skills for Week {w}.",
                    "focusSkills": ["grammar", "vocabulary"],
                    "objectives": [
                        {
                            "id": f"w{w}_obj1",
                            "description": f"Master basic structures and tasks for week {w}",
                            "successCriteria": ["Completes all weekly lessons", "Averages >= 70% in exercises"]
                        }
                    ],
                    "days": days_fallback
                })

            fallback_plan = {
                "title": f"Personalized 8-Week English Roadmap for {profile.get('occupation', 'Learner') or 'Learner'}",
                "description": "Start speaking English confidently in daily conversation and workplace contexts.",
                "durationWeeks": 8,
                "weeks": weeks_fallback
            }

            try:
                validated_fallback = GeneratePlanResponse.model_validate(fallback_plan)
                logger.info("[PLAN_SCHEMA_VALIDATED] Fallback study plan schema validated successfully")
                
                logger.info(
                    f"[STUDY_PLAN_GENERATION_SUCCESS] Generated fallback study plan successfully. "
                    f"safe_metadata: duration_ms={groq_duration_ms}, response_length={response_length}, "
                    f"number_of_weeks={len(validated_fallback.weeks)}, "
                    f"number_of_days={sum(len(w.days) for w in validated_fallback.weeks)}, "
                    f"validation_status=fallback"
                )
                return fallback_plan
            except Exception as fe:
                logger.error(f"[STUDY_PLAN_GENERATION_FAILED] Fallback validation failed: {str(fe)}")
                raise InternalServerErrorException(f"Fallback validation failed: {str(fe)}")


    async def generate_recommendations(self, profile: dict, progress: dict, mistakes: list[dict], vocab: list[str]) -> dict:
        system_prompt = """You are an expert English Language tutor.
Your task is to generate dynamic daily learning recommendations for a user based on their profile, recent performance, weak grammar areas/mistakes, and vocabulary study list.
The output MUST be a valid JSON object matching the following structure:
{
  "focus": "Today's Focus header text (e.g., Practice workplace conversations.)",
  "reason": "Why we are focusing on this (e.g., You struggled with Present Perfect yesterday. Let's review it for 5 minutes.)",
  "vocabulary": ["Word1", "Word2", "Word3", "Word4", "Word5"]
}

Instructions:
1. Provide exactly 5 contextual vocabulary words related to their occupation, interests, or level.
2. The reason should reference their recent mistakes, performance, or level.
3. Return ONLY raw JSON. No markdown, no trailing/leading text.
"""

        user_message = f"""Generate daily recommendations for this user:
Profile:
- Occupation: {profile.get('occupation', 'Learner')}
- Level: {profile.get('englishLevel', 'Beginner')}
- Goals: {", ".join(profile.get('goals', ['General speaking']))}
- Interests: {", ".join(profile.get('interests', ['Technology']))}

Recent Mistakes/Corrections:
{json.dumps(mistakes[:5]) if mistakes else "No recent mistakes recorded yet."}

Vocabulary Studied Recently:
{json.dumps(vocab[:10]) if vocab else "No vocabulary added yet."}
"""

        logger.info(f"Generating recommendations for user profile: {profile}")
        response_text = await self.provider.complete(
            system_prompt=system_prompt,
            messages=[{"role": "user", "content": user_message}],
            temperature=0.7,
            json_mode=True
        )

        try:
            rec_data = json.loads(response_text)
            return rec_data
        except Exception as e:
            logger.error(f"Failed to parse recommendations JSON: {response_text}. Error: {str(e)}")
            return {
                "focus": "Daily Grammar & Conversation Focus",
                "reason": "Let's work on conversation fluency and review common verbs.",
                "vocabulary": ["Meeting", "Feedback", "Collaborate", "Schedule", "Task"]
            }

study_plan_service = StudyPlanService()
