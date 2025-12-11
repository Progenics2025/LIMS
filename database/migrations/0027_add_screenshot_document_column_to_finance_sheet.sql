-- Migration: Add screenshot_document column to finance_sheet
-- File: 0027_add_screenshot_document_column_to_finance_sheet.sql

    ALTER TABLE `finance_sheet`
    ADD COLUMN `screenshot_document` VARCHAR(255) DEFAULT NULL COMMENT 'Primary screenshot/document filename or URL';
