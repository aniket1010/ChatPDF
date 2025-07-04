-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "contentType" TEXT NOT NULL DEFAULT 'text',
ADD COLUMN     "formattedText" TEXT,
ADD COLUMN     "processedAt" TIMESTAMP(3);
