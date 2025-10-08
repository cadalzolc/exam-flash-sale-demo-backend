/*
  Warnings:

  - You are about to drop the column `promoId` on the `promos_products` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[product_id,promo_id]` on the table `promos_products` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `promo_id` to the `promos_products` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."promos_products" DROP CONSTRAINT "promos_products_promoId_fkey";

-- DropIndex
DROP INDEX "public"."promos_products_product_id_promoId_key";

-- AlterTable
ALTER TABLE "promos_products" DROP COLUMN "promoId",
ADD COLUMN     "promo_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "promos_products_product_id_promo_id_key" ON "promos_products"("product_id", "promo_id");

-- AddForeignKey
ALTER TABLE "promos_products" ADD CONSTRAINT "promos_products_promo_id_fkey" FOREIGN KEY ("promo_id") REFERENCES "promos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
