-- Migration: Create attachments table for finance_sheet uploads
-- File: 0026_create_finance_sheet_attachments.sql

CREATE TABLE IF NOT EXISTS `finance_sheet_attachments` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `finance_id` BIGINT NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `storage_path` VARCHAR(1024) DEFAULT NULL,
  `mime_type` VARCHAR(100) DEFAULT NULL,
  `size_bytes` BIGINT DEFAULT NULL,
  `uploaded_by` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_finance_id` (`finance_id`),
  CONSTRAINT `fk_finance_attachment_finance` FOREIGN KEY (`finance_id`) REFERENCES `finance_sheet` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optionally create an index on filename for faster lookups
CREATE INDEX IF NOT EXISTS `idx_finance_attachment_filename` ON `finance_sheet_attachments` (`filename`(191));
