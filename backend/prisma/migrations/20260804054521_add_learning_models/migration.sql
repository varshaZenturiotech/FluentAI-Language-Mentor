-- CreateTable
CREATE TABLE "vocabularies" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "word" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "example" TEXT,
    "language" TEXT NOT NULL,
    "difficulty" "LanguageLevel" NOT NULL DEFAULT 'BEGINNER',
    "mastered" BOOLEAN NOT NULL DEFAULT false,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "lastReviewedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vocabularies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grammar_mistakes" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "sentence" TEXT NOT NULL,
    "correctSentence" TEXT NOT NULL,
    "explanation" TEXT,
    "grammarRule" TEXT,
    "mistakeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grammar_mistakes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "level" "LanguageLevel" NOT NULL DEFAULT 'BEGINNER',
    "language" TEXT NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 15,
    "xpReward" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "lessonId" UUID NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL DEFAULT 0,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vocabularies_userId_idx" ON "vocabularies"("userId");

-- CreateIndex
CREATE INDEX "vocabularies_language_idx" ON "vocabularies"("language");

-- CreateIndex
CREATE INDEX "vocabularies_mastered_idx" ON "vocabularies"("mastered");

-- CreateIndex
CREATE INDEX "vocabularies_nextReviewAt_idx" ON "vocabularies"("nextReviewAt");

-- CreateIndex
CREATE INDEX "vocabularies_createdAt_idx" ON "vocabularies"("createdAt");

-- CreateIndex
CREATE INDEX "grammar_mistakes_userId_idx" ON "grammar_mistakes"("userId");

-- CreateIndex
CREATE INDEX "grammar_mistakes_createdAt_idx" ON "grammar_mistakes"("createdAt");

-- CreateIndex
CREATE INDEX "lessons_level_idx" ON "lessons"("level");

-- CreateIndex
CREATE INDEX "lessons_language_idx" ON "lessons"("language");

-- CreateIndex
CREATE INDEX "lessons_createdAt_idx" ON "lessons"("createdAt");

-- CreateIndex
CREATE INDEX "progress_userId_idx" ON "progress"("userId");

-- CreateIndex
CREATE INDEX "progress_lessonId_idx" ON "progress"("lessonId");

-- CreateIndex
CREATE INDEX "progress_completed_idx" ON "progress"("completed");

-- CreateIndex
CREATE INDEX "progress_createdAt_idx" ON "progress"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "progress_userId_lessonId_key" ON "progress"("userId", "lessonId");

-- AddForeignKey
ALTER TABLE "vocabularies" ADD CONSTRAINT "vocabularies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grammar_mistakes" ADD CONSTRAINT "grammar_mistakes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
