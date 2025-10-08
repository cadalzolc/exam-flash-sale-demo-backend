/*
  Warnings:

  - Added the required column `max_qty_per_order` to the `promos_products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "promos_products" ADD COLUMN     "max_qty_per_order" INTEGER NOT NULL;
