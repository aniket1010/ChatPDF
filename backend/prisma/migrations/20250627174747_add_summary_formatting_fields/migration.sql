-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "introductionFormatted" TEXT,
ADD COLUMN     "keyFindingsFormatted" TEXT,
ADD COLUMN     "summaryContentType" TEXT NOT NULL DEFAULT 'text',
ADD COLUMN     "summaryFormatted" TEXT,
ADD COLUMN     "summaryProcessedAt" TIMESTAMP(3),
ADD COLUMN     "tableOfContentsFormatted" TEXT;
