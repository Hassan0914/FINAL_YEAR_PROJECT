/*
  Warnings:

  - You are about to drop the column `otherGestures` on the `analysis_history` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."analysis_history" DROP COLUMN "otherGestures",
ADD COLUMN     "finalScore" DOUBLE PRECISION;
