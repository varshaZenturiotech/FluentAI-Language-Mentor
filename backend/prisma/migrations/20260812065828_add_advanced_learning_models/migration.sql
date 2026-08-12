-- CreateEnum
CREATE TYPE "StudyPlanDayStatus" AS ENUM ('LOCKED', 'AVAILABLE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "LessonSessionStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "conversation_sessions" ADD COLUMN     "duration_minutes" INTEGER,
ADD COLUMN     "lesson_id" UUID,
ADD COLUMN     "study_plan_id" UUID;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "audio_url" TEXT,
ADD COLUMN     "translated_content" TEXT;

-- CreateTable
CREATE TABLE "learning_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "age_group" TEXT,
    "occupation" TEXT,
    "english_level" TEXT NOT NULL,
    "native_language" TEXT NOT NULL,
    "daily_learning_goal" INTEGER NOT NULL DEFAULT 15,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_goals" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "goal" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_interests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "interest" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_plans" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration_weeks" INTEGER NOT NULL DEFAULT 8,
    "weeks_metadata" TEXT,
    "plan_version" INTEGER NOT NULL DEFAULT 1,
    "last_adapted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_plan_days" (
    "id" UUID NOT NULL,
    "study_plan_id" UUID NOT NULL,
    "day_number" INTEGER NOT NULL,
    "week_number" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "estimated_minutes" INTEGER NOT NULL DEFAULT 15,
    "lesson_type" TEXT NOT NULL,
    "lesson_content" TEXT NOT NULL,
    "status" "StudyPlanDayStatus" NOT NULL DEFAULT 'LOCKED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_plan_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "lessons_completed" INTEGER NOT NULL DEFAULT 0,
    "conversations_completed" INTEGER NOT NULL DEFAULT 0,
    "vocabulary_learned" INTEGER NOT NULL DEFAULT 0,
    "grammar_topics_completed" INTEGER NOT NULL DEFAULT 0,
    "listening_sessions" INTEGER NOT NULL DEFAULT 0,
    "pronunciation_sessions" INTEGER NOT NULL DEFAULT 0,
    "quizzes_completed" INTEGER NOT NULL DEFAULT 0,
    "study_minutes" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "completion_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "current_level" TEXT NOT NULL DEFAULT 'BEGINNER',
    "total_minutes" INTEGER NOT NULL DEFAULT 0,
    "grammar_completed" INTEGER NOT NULL DEFAULT 0,
    "vocabulary_completed" INTEGER NOT NULL DEFAULT 0,
    "pronunciation_completed" INTEGER NOT NULL DEFAULT 0,
    "listening_completed" INTEGER NOT NULL DEFAULT 0,
    "quiz_completed" INTEGER NOT NULL DEFAULT 0,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "last_learning_date" TIMESTAMP(3),
    "overall_progress" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_learning_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "minutes_studied" INTEGER NOT NULL DEFAULT 0,
    "completed_lessons" INTEGER NOT NULL DEFAULT 0,
    "completed_tasks" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_learning_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "session_id" UUID,
    "study_plan_day_id" UUID,
    "study_minutes" INTEGER NOT NULL DEFAULT 0,
    "grammar_score" INTEGER NOT NULL DEFAULT 0,
    "vocabulary_score" INTEGER NOT NULL DEFAULT 0,
    "fluency_score" INTEGER NOT NULL DEFAULT 0,
    "confidence_score" INTEGER NOT NULL DEFAULT 0,
    "pronunciation_score" INTEGER NOT NULL DEFAULT 0,
    "lesson_completion_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "completed_tasks" TEXT,
    "weak_topics" TEXT,
    "new_words" TEXT,
    "recommendations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weak_topics" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "topic" TEXT NOT NULL,
    "mistake_count" INTEGER NOT NULL DEFAULT 0,
    "improvement_score" INTEGER NOT NULL DEFAULT 0,
    "last_practiced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "weak_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabulary_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "word" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "times_seen" INTEGER NOT NULL DEFAULT 0,
    "times_correct" INTEGER NOT NULL DEFAULT 0,
    "mastery_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "last_reviewed" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'new',

    CONSTRAINT "vocabulary_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "study_plan_id" UUID NOT NULL,
    "week_id" INTEGER NOT NULL,
    "day_id" UUID NOT NULL,
    "lesson_id" UUID,
    "status" "LessonSessionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "duration" INTEGER NOT NULL DEFAULT 0,
    "completion_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "ai_summary" TEXT,
    "xp_earned" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lesson_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learner_assessments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "grammar" INTEGER NOT NULL DEFAULT 0,
    "vocabulary" INTEGER NOT NULL DEFAULT 0,
    "reading" INTEGER NOT NULL DEFAULT 0,
    "speaking" INTEGER NOT NULL DEFAULT 0,
    "listening" INTEGER NOT NULL DEFAULT 0,
    "writing" INTEGER NOT NULL DEFAULT 0,
    "pronunciation" INTEGER NOT NULL DEFAULT 0,
    "fluency" INTEGER NOT NULL DEFAULT 0,
    "actual_grammar" INTEGER NOT NULL DEFAULT 0,
    "actual_vocabulary" INTEGER NOT NULL DEFAULT 0,
    "actual_speaking" INTEGER NOT NULL DEFAULT 0,
    "actual_listening" INTEGER NOT NULL DEFAULT 0,
    "actual_reading" INTEGER NOT NULL DEFAULT 0,
    "actual_writing" INTEGER NOT NULL DEFAULT 0,
    "actual_pronunciation" INTEGER NOT NULL DEFAULT 0,
    "actual_fluency" INTEGER NOT NULL DEFAULT 0,
    "actual_strengths" TEXT,
    "actual_weaknesses" TEXT,
    "actual_level" TEXT NOT NULL DEFAULT 'Pre-A1',
    "actual_score" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learner_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_assessments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "week_number" INTEGER NOT NULL,
    "grammar" INTEGER NOT NULL,
    "speaking" INTEGER NOT NULL,
    "listening" INTEGER NOT NULL,
    "writing" INTEGER NOT NULL,
    "pronunciation" INTEGER NOT NULL,
    "fluency" INTEGER NOT NULL,
    "feedback" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objective_masteries" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "objective" TEXT NOT NULL,
    "mastery_score" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "attempts_count" INTEGER NOT NULL DEFAULT 0,
    "last_practiced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "objective_masteries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "learning_profiles_user_id_key" ON "learning_profiles"("user_id");

-- CreateIndex
CREATE INDEX "learning_profiles_user_id_idx" ON "learning_profiles"("user_id");

-- CreateIndex
CREATE INDEX "learning_goals_user_id_idx" ON "learning_goals"("user_id");

-- CreateIndex
CREATE INDEX "learning_interests_user_id_idx" ON "learning_interests"("user_id");

-- CreateIndex
CREATE INDEX "study_plans_user_id_idx" ON "study_plans"("user_id");

-- CreateIndex
CREATE INDEX "study_plan_days_study_plan_id_idx" ON "study_plan_days"("study_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_plan_days_study_plan_id_day_number_key" ON "study_plan_days"("study_plan_id", "day_number");

-- CreateIndex
CREATE UNIQUE INDEX "learning_progress_user_id_key" ON "learning_progress"("user_id");

-- CreateIndex
CREATE INDEX "learning_progress_user_id_idx" ON "learning_progress"("user_id");

-- CreateIndex
CREATE INDEX "daily_learning_logs_user_id_idx" ON "daily_learning_logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_learning_logs_user_id_date_key" ON "daily_learning_logs"("user_id", "date");

-- CreateIndex
CREATE INDEX "learning_sessions_user_id_idx" ON "learning_sessions"("user_id");

-- CreateIndex
CREATE INDEX "weak_topics_user_id_idx" ON "weak_topics"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "weak_topics_user_id_topic_key" ON "weak_topics"("user_id", "topic");

-- CreateIndex
CREATE INDEX "vocabulary_progress_user_id_idx" ON "vocabulary_progress"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "vocabulary_progress_user_id_word_key" ON "vocabulary_progress"("user_id", "word");

-- CreateIndex
CREATE INDEX "lesson_sessions_user_id_idx" ON "lesson_sessions"("user_id");

-- CreateIndex
CREATE INDEX "lesson_sessions_day_id_idx" ON "lesson_sessions"("day_id");

-- CreateIndex
CREATE UNIQUE INDEX "learner_assessments_user_id_key" ON "learner_assessments"("user_id");

-- CreateIndex
CREATE INDEX "learner_assessments_user_id_idx" ON "learner_assessments"("user_id");

-- CreateIndex
CREATE INDEX "weekly_assessments_user_id_idx" ON "weekly_assessments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_assessments_user_id_week_number_key" ON "weekly_assessments"("user_id", "week_number");

-- CreateIndex
CREATE INDEX "objective_masteries_user_id_idx" ON "objective_masteries"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "objective_masteries_user_id_objective_key" ON "objective_masteries"("user_id", "objective");

-- AddForeignKey
ALTER TABLE "learning_profiles" ADD CONSTRAINT "learning_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_goals" ADD CONSTRAINT "learning_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "learning_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_interests" ADD CONSTRAINT "learning_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "learning_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plan_days" ADD CONSTRAINT "study_plan_days_study_plan_id_fkey" FOREIGN KEY ("study_plan_id") REFERENCES "study_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_progress" ADD CONSTRAINT "learning_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_learning_logs" ADD CONSTRAINT "daily_learning_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weak_topics" ADD CONSTRAINT "weak_topics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_progress" ADD CONSTRAINT "vocabulary_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_sessions" ADD CONSTRAINT "lesson_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_sessions" ADD CONSTRAINT "lesson_sessions_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "study_plan_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_assessments" ADD CONSTRAINT "learner_assessments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_assessments" ADD CONSTRAINT "weekly_assessments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objective_masteries" ADD CONSTRAINT "objective_masteries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
