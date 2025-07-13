/*
  Warnings:

  - You are about to drop the column `introduction` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `introductionFormatted` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `keyFindings` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `keyFindingsFormatted` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `tableOfContents` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `tableOfContentsFormatted` on the `Conversation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "introduction",
DROP COLUMN "introductionFormatted",
DROP COLUMN "keyFindings",
DROP COLUMN "keyFindingsFormatted",
DROP COLUMN "tableOfContents",
DROP COLUMN "tableOfContentsFormatted",
ADD COLUMN     "commonQuestions" TEXT,
ADD COLUMN     "commonQuestionsFormatted" TEXT;
