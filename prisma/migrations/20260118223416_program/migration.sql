/*
  Warnings:

  - You are about to drop the column `degree_title` on the `certificates` table. All the data in the column will be lost.
  - You are about to drop the column `specialization` on the `certificates` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `certificates` DROP COLUMN `degree_title`,
    DROP COLUMN `specialization`;
