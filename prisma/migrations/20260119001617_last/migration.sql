/*
  Warnings:

  - Added the required column `program_id` to the `certificates` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `certificates` ADD COLUMN `program_id` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_program_id_fkey` FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
