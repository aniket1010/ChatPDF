-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "processingStatus" TEXT NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'completed';
