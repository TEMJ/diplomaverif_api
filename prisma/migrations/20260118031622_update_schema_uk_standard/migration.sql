/*
  Warnings:

  - You are about to drop the column `grade` on the `grades` table. All the data in the column will be lost.
  - You are about to drop the column `subject_id` on the `grades` table. All the data in the column will be lost.
  - You are about to drop the column `major` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `matricule` on the `students` table. All the data in the column will be lost.
  - You are about to drop the `subjects` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[student_id,module_id]` on the table `grades` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[student_id]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[university_id,student_id]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `mark` to the `grades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `module_id` to the `grades` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `grades` DROP FOREIGN KEY `grades_subject_id_fkey`;

-- DropForeignKey
ALTER TABLE `subjects` DROP FOREIGN KEY `subjects_university_id_fkey`;

-- DropIndex
DROP INDEX `grades_student_id_subject_id_key` ON `grades`;

-- DropIndex
DROP INDEX `students_matricule_idx` ON `students`;

-- DropIndex
DROP INDEX `students_matricule_key` ON `students`;

-- AlterTable
ALTER TABLE `certificates` ADD COLUMN `degree_classification` VARCHAR(50) NULL,
    ADD COLUMN `final_mark` DECIMAL(5, 2) NULL;

-- AlterTable
ALTER TABLE `grades` DROP COLUMN `grade`,
    DROP COLUMN `subject_id`,
    ADD COLUMN `mark` DECIMAL(5, 2) NOT NULL,
    ADD COLUMN `module_id` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `students` DROP COLUMN `major`,
    DROP COLUMN `matricule`,
    ADD COLUMN `enrollment_date` DATETIME(3) NULL,
    ADD COLUMN `program_id` VARCHAR(191) NULL,
    ADD COLUMN `student_id` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `universities` ADD COLUMN `official_seal_url` VARCHAR(500) NULL,
    ADD COLUMN `registrar_name` VARCHAR(255) NULL,
    ADD COLUMN `signature_url` VARCHAR(500) NULL,
    ADD COLUMN `ukprn` VARCHAR(10) NULL;

-- DropTable
DROP TABLE `subjects`;

-- CreateTable
CREATE TABLE `programs` (
    `id` VARCHAR(191) NOT NULL,
    `university_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `level` VARCHAR(50) NOT NULL,
    `totalCreditsRequired` INTEGER NOT NULL DEFAULT 360,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `programs_university_id_idx`(`university_id`),
    UNIQUE INDEX `programs_university_id_title_key`(`university_id`, `title`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `modules` (
    `id` VARCHAR(191) NOT NULL,
    `university_id` VARCHAR(191) NOT NULL,
    `program_id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `credits` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `modules_university_id_idx`(`university_id`),
    INDEX `modules_program_id_idx`(`program_id`),
    UNIQUE INDEX `modules_university_id_code_key`(`university_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `grades_module_id_idx` ON `grades`(`module_id`);

-- CreateIndex
CREATE UNIQUE INDEX `grades_student_id_module_id_key` ON `grades`(`student_id`, `module_id`);

-- CreateIndex
CREATE UNIQUE INDEX `students_student_id_key` ON `students`(`student_id`);

-- CreateIndex
CREATE INDEX `students_program_id_idx` ON `students`(`program_id`);

-- CreateIndex
CREATE INDEX `students_student_id_idx` ON `students`(`student_id`);

-- CreateIndex
CREATE UNIQUE INDEX `students_university_id_student_id_key` ON `students`(`university_id`, `student_id`);

-- CreateIndex
CREATE INDEX `universities_ukprn_idx` ON `universities`(`ukprn`);

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_program_id_fkey` FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `programs` ADD CONSTRAINT `programs_university_id_fkey` FOREIGN KEY (`university_id`) REFERENCES `universities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `modules` ADD CONSTRAINT `modules_university_id_fkey` FOREIGN KEY (`university_id`) REFERENCES `universities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `modules` ADD CONSTRAINT `modules_program_id_fkey` FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grades` ADD CONSTRAINT `grades_module_id_fkey` FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
