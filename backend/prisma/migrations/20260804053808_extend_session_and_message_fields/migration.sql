/*
  Warnings:

  - Added the required column `difficulty` to the `conversation_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `language` to the `conversation_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "conversation_sessions" ADD COLUMN     "difficulty" "LanguageLevel" NOT NULL,
ADD COLUMN     "language" TEXT NOT NULL,
ADD COLUMN     "lastMessageAt" TIMESTAMP(3),
ADD COLUMN     "lessonType" TEXT,
ADD COLUMN     "topic" TEXT,
ADD COLUMN     "totalMessages" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "correctedText" TEXT,
ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "translatedText" TEXT;
