/*
  Warnings:

  - Added the required column `status` to the `purchases` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EPurchaseStatus" AS ENUM ('PENDING', 'COMPLETED');

-- AlterTable
ALTER TABLE "purchases" ADD COLUMN     "status" "EPurchaseStatus" NOT NULL;
