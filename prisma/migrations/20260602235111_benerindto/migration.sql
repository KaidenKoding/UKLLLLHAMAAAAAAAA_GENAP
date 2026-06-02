/*
  Warnings:

  - You are about to drop the column `image` on the `Menu` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Menu` DROP COLUMN `image`,
    ADD COLUMN `imageUrl` TEXT NULL;
