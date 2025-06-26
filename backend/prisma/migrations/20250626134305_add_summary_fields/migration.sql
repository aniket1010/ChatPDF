-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "introduction" TEXT,
ADD COLUMN     "keyFindings" TEXT,
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "summaryGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "tableOfContents" TEXT;
