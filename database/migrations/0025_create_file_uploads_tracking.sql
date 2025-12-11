-- Create table to track all uploaded files with category-based organization
CREATE TABLE IF NOT EXISTS `file_uploads` (
  `id` varchar(36) NOT NULL COMMENT 'Unique identifier for the upload record',
  `filename` varchar(255) NOT NULL COMMENT 'Original filename',
  `original_name` varchar(255) COMMENT 'Original name before sanitization',
  `storage_path` varchar(500) NOT NULL COMMENT 'Full path where file is stored (e.g., uploads/Progenics_TRF/1764259675840-file.pdf)',
  `category` varchar(100) NOT NULL COMMENT 'File category: Progenics_TRF, Thirdparty_TRF, Progenics_Report, Thirdparty_Report, etc.',
  `file_size` bigint COMMENT 'File size in bytes',
  `mime_type` varchar(100) COMMENT 'MIME type of the file (e.g., application/pdf)',
  `uploaded_by` varchar(255) COMMENT 'User ID or username who uploaded the file',
  `related_entity_type` varchar(100) COMMENT 'Entity type (e.g., lead, sample, lab_process)',
  `related_entity_id` varchar(255) COMMENT 'ID of the related entity',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'When the file was uploaded',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0' COMMENT 'Soft delete flag',
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_related_entity` (`related_entity_type`, `related_entity_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Centralized tracking of all uploaded files across the system';
