-- MySQL dump 10.13  Distrib 8.0.44, for Linux (x86_64)
--
-- Host: localhost    Database: lead_lims2
-- ------------------------------------------------------
-- Server version	8.0.44-0ubuntu0.22.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bioinformatics_sheet_clinical`
--

DROP TABLE IF EXISTS `bioinformatics_sheet_clinical`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bioinformatics_sheet_clinical` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `unique_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` bigint unsigned DEFAULT NULL,
  `sample_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `organisation_hospital` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `clinician_researcher_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `patient_client_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age` int DEFAULT NULL,
  `gender` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `service_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `no_of_samples` int DEFAULT NULL,
  `sequencing_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sequencing_data_storage_date` date DEFAULT NULL,
  `basecalling` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `basecalling_data_storage_date` date DEFAULT NULL,
  `workflow_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `analysis_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `analysis_date` date DEFAULT NULL,
  `third_party_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sample_sent_to_third_party_date` date DEFAULT NULL,
  `third_party_trf` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `results_raw_data_received_from_third_party_date` date DEFAULT NULL,
  `third_party_report` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tat` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vcf_file_link` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cnv_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `progenics_raw_data` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `progenics_raw_data_size` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `progenics_raw_data_link` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `analysis_html_link` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `relative_abundance_sheet` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_analysis_sheet` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `database_tools_information` text COLLATE utf8mb4_unicode_ci,
  `alert_to_technical_leadd` tinyint(1) DEFAULT '0',
  `alert_to_report_team` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modified_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `modified_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remark_comment` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_bioinformatics_unique_id` (`unique_id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_sample_id` (`sample_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bioinformatics_sheet_discovery`
--

DROP TABLE IF EXISTS `bioinformatics_sheet_discovery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bioinformatics_sheet_discovery` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `unique_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` bigint unsigned DEFAULT NULL,
  `sample_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `organisation_hospital` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `clinician_researcher_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `patient_client_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age` int DEFAULT NULL,
  `gender` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `service_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `no_of_samples` int DEFAULT NULL,
  `sequencing_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sequencing_data_storage_date` date DEFAULT NULL,
  `basecalling` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `basecalling_data_storage_date` date DEFAULT NULL,
  `workflow_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `analysis_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `analysis_date` date DEFAULT NULL,
  `third_party_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sample_sent_to_third_party_date` date DEFAULT NULL,
  `third_party_trf` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `results_raw_data_received_from_third_party_date` date DEFAULT NULL,
  `third_party_report` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tat` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vcf_file_link` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cnv_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `progenics_raw_data` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `progenics_raw_data_size` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `progenics_raw_data_link` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `analysis_html_link` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `relative_abundance_sheet` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_analysis_sheet` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `database_tools_information` text COLLATE utf8mb4_unicode_ci,
  `alert_to_technical_leadd` tinyint(1) DEFAULT '0',
  `alert_to_report_team` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modified_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `modified_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remark_comment` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_bioinformatics_discovery_unique_id` (`unique_id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_sample_id` (`sample_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients` (
  `id` varchar(36) NOT NULL,
  `organization_name` varchar(255) NOT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `pincode` varchar(20) DEFAULT NULL,
  `client_type` varchar(50) DEFAULT NULL,
  `registration_date` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `gst_number` varchar(50) DEFAULT NULL,
  `pan_number` varchar(50) DEFAULT NULL,
  `credit_limit` decimal(10,2) DEFAULT NULL,
  `payment_terms` varchar(100) DEFAULT NULL,
  `assigned_sales_rep` varchar(36) DEFAULT NULL,
  `notes` text,
  `tags` json DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `finance_sheet`
--

DROP TABLE IF EXISTS `finance_sheet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `finance_sheet` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `unique_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` bigint unsigned DEFAULT NULL,
  `sample_collection_date` date DEFAULT NULL,
  `organisation_hospital` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `clinician_researcher_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `clinician_researcher_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `clinician_researcher_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `clinician_researcher_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `patient_client_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `patient_client_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `patient_client_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `patient_client_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `service_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `budget` decimal(10,2) DEFAULT NULL,
  `phlebotomist_charges` decimal(10,2) DEFAULT NULL,
  `sales_responsible_person` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sample_shipment_amount` decimal(10,2) DEFAULT NULL,
  `invoice_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_amount` decimal(10,2) DEFAULT NULL,
  `invoice_date` date DEFAULT NULL,
  `payment_receipt_amount` decimal(10,2) DEFAULT NULL,
  `balance_amount` decimal(10,2) DEFAULT NULL,
  `payment_receipt_date` date DEFAULT NULL,
  `mode_of_payment` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transactional_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `balance_amount_received_date` date DEFAULT NULL,
  `total_amount_received_status` tinyint(1) DEFAULT '0',
  `utr_details` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `third_party_charges` decimal(10,2) DEFAULT NULL,
  `other_charges` decimal(10,2) DEFAULT NULL,
  `other_charges_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `third_party_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `third_party_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `third_party_payment_date` date DEFAULT NULL,
  `third_party_payment_status` tinyint(1) DEFAULT '0',
  `alert_to_labprocess_team` tinyint(1) DEFAULT '0',
  `alert_to_report_team` tinyint(1) DEFAULT '0',
  `alert_to_technical_lead` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modified_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `modified_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remark_comment` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_finance_unique_id` (`unique_id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_invoice_number` (`invoice_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `genetic_counselling_records`
--

DROP TABLE IF EXISTS `genetic_counselling_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `genetic_counselling_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `unique_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` bigint unsigned DEFAULT NULL,
  `counselling_date` date DEFAULT NULL,
  `gc_registration_start_time` time DEFAULT NULL,
  `gc_registration_end_time` time DEFAULT NULL,
  `patient_client_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age` int DEFAULT NULL,
  `gender` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `patient_client_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `patient_client_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `patient_client_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_status` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mode_of_payment` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approval_from_head` tinyint(1) DEFAULT '0',
  `clinician_researcher_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `organisation_hospital` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `speciality` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `query_suspection` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gc_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gc_other_members` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `service_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `counseling_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `counseling_start_time` time DEFAULT NULL,
  `counseling_end_time` time DEFAULT NULL,
  `budget_for_test_opted` decimal(10,2) DEFAULT NULL,
  `testing_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action_required` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `potential_patient_for_testing_in_future` tinyint(1) DEFAULT '0',
  `extended_family_testing_requirement` tinyint(1) DEFAULT '0',
  `budget` decimal(10,2) DEFAULT NULL,
  `sample_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gc_summary_sheet` text COLLATE utf8mb4_unicode_ci,
  `gc_video_link` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gc_audio_link` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sales_responsible_person` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modified_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `modified_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remark_comment` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_gc_unique_id` (`unique_id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_counselling_date` (`counselling_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `labprocess_clinical_sheet`
--

DROP TABLE IF EXISTS `labprocess_clinical_sheet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `labprocess_clinical_sheet` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `unique_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` bigint unsigned DEFAULT NULL,
  `sample_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `service_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sample_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `no_of_samples` int DEFAULT NULL,
  `sample_received_date` date DEFAULT NULL,
  `extraction_protocol` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `extraction_quality_check` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `extraction_qc_status` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `extraction_process` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `library_preparation_protocol` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `library_preparation_quality_check` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `library_preparation_qc_status` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `library_preparation_process` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purification_protocol` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purification_quality_check` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purification_qc_status` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purification_process` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alert_to_bioinformatics_team` tinyint(1) DEFAULT '0',
  `alert_to_technical_lead` tinyint(1) DEFAULT '0',
  `progenics_trf` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modified_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `modified_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remark_comment` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_lab_process_clinical_unique_id` (`unique_id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_sample_id` (`sample_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `labprocess_discovery_sheet`
--

DROP TABLE IF EXISTS `labprocess_discovery_sheet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `labprocess_discovery_sheet` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `unique_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` bigint unsigned DEFAULT NULL,
  `sample_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `service_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sample_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `no_of_samples` int DEFAULT NULL,
  `sample_received_date` date DEFAULT NULL,
  `extraction_protocol` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `extraction_quality_check` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `extraction_qc_status` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `extraction_process` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `library_preparation_protocol` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `library_preparation_quality_check` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `library_preparation_qc_status` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `library_preparation_process` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purification_protocol` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purification_quality_check` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purification_qc_status` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purification_process` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alert_to_bioinformatics_team` tinyint(1) DEFAULT '0',
  `alert_to_technical_leadd` tinyint(1) DEFAULT '0',
  `progenics_trf` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modified_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `modified_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remark_comment` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_lab_process_unique_id` (`unique_id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_sample_id` (`sample_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lead_management`
--

DROP TABLE IF EXISTS `lead_management`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_management` (
  `id` varchar(36) NOT NULL,
  `unique_id` varchar(100) DEFAULT NULL,
  `project_id` varchar(100) DEFAULT NULL,
  `lead_type` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'quoted',
  `organisation_hospital` varchar(255) DEFAULT NULL,
  `clinician_researcher_name` varchar(255) DEFAULT NULL,
  `speciality` varchar(255) DEFAULT NULL,
  `clinician_researcher_email` varchar(255) DEFAULT NULL,
  `clinician_researcher_phone` varchar(50) DEFAULT NULL,
  `clinician_researcher_address` varchar(500) DEFAULT NULL,
  `patient_client_name` varchar(255) DEFAULT NULL,
  `age` int DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `patient_client_email` varchar(255) DEFAULT NULL,
  `patient_client_phone` varchar(50) DEFAULT NULL,
  `patient_client_address` varchar(500) DEFAULT NULL,
  `service_name` varchar(255) DEFAULT NULL,
  `sample_type` varchar(255) DEFAULT NULL,
  `no_of_samples` int DEFAULT NULL,
  `budget` decimal(10,2) DEFAULT NULL,
  `amount_quoted` decimal(10,2) DEFAULT NULL,
  `tat` varchar(50) DEFAULT NULL,
  `sample_shipment_amount` decimal(10,2) DEFAULT NULL,
  `phlebotomist_charges` decimal(10,2) DEFAULT NULL,
  `genetic_counselor_required` tinyint(1) DEFAULT '0',
  `nutritional_counselling_required` tinyint(1) DEFAULT '0',
  `sample_pick_up_from` varchar(500) DEFAULT NULL,
  `delivery_up_to` timestamp NULL DEFAULT NULL,
  `sample_collection_date` timestamp NULL DEFAULT NULL,
  `sample_shipped_date` timestamp NULL DEFAULT NULL,
  `sample_recevied_date` timestamp NULL DEFAULT NULL,
  `tracking_id` varchar(100) DEFAULT NULL,
  `courier_company` varchar(255) DEFAULT NULL,
  `progenics_trf` varchar(255) DEFAULT NULL,
  `follow_up` varchar(500) DEFAULT NULL,
  `Remark_Comment` text,
  `lead_created_by` varchar(36) DEFAULT NULL,
  `sales_responsible_person` varchar(255) DEFAULT NULL,
  `lead_created` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `lead_modified` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_id` (`unique_id`),
  KEY `idx_unique_id` (`unique_id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_status` (`status`),
  KEY `idx_organisation` (`organisation_hospital`),
  KEY `idx_patient_name` (`patient_client_name`),
  KEY `idx_lead_created` (`lead_created`),
  KEY `idx_sample_collection_date` (`sample_collection_date`),
  KEY `idx_service_name` (`service_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lead_trfs`
--

DROP TABLE IF EXISTS `lead_trfs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_trfs` (
  `id` varchar(36) NOT NULL,
  `lead_id` varchar(36) DEFAULT NULL,
  `filename` varchar(255) DEFAULT NULL,
  `data` longblob,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lead_trf_lead_id` (`lead_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lims_users`
--

DROP TABLE IF EXISTS `lims_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lims_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `role` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(100) NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `related_id` varchar(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `nutritional_management`
--

DROP TABLE IF EXISTS `nutritional_management`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nutritional_management` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `unique_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` bigint unsigned DEFAULT NULL,
  `sample_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `service_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `patient_client_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age` int DEFAULT NULL,
  `gender` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `progenics_trf` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `questionnaire` text COLLATE utf8mb4_unicode_ci,
  `questionnaire_call_recording` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_analysis_sheet` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `progenics_report` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nutrition_chart` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `counselling_session_date` date DEFAULT NULL,
  `further_counselling_required` tinyint(1) DEFAULT '0',
  `counselling_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `counselling_session_recording` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alert_to_technical_lead` tinyint(1) DEFAULT '0',
  `alert_to_report_team` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modified_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `modified_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remark_comment` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_nutritional_management_unique_id` (`unique_id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_sample_id` (`sample_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pricing`
--

DROP TABLE IF EXISTS `pricing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pricing` (
  `id` varchar(36) NOT NULL,
  `test_name` varchar(255) NOT NULL,
  `test_code` varchar(50) DEFAULT NULL,
  `base_price` decimal(10,2) NOT NULL,
  `discounted_price` decimal(10,2) DEFAULT NULL,
  `currency` varchar(10) DEFAULT 'INR',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `category` varchar(100) DEFAULT NULL,
  `subcategory` varchar(100) DEFAULT NULL,
  `description` text,
  `turnaround_time` int DEFAULT NULL,
  `sample_requirements` text,
  `methodology` varchar(255) DEFAULT NULL,
  `accreditation` varchar(255) DEFAULT NULL,
  `valid_from` timestamp NULL DEFAULT NULL,
  `valid_to` timestamp NULL DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `test_code` (`test_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `process_master_sheet`
--

DROP TABLE IF EXISTS `process_master_sheet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `process_master_sheet` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `unique_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` bigint unsigned DEFAULT NULL,
  `sample_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `organisation_hospital` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `clinician_researcher_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `speciality` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `clinician_researcher_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `clinician_researcher_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `clinician_researcher_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `patient_client_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age` int DEFAULT NULL,
  `gender` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `patient_client_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `patient_client_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `patient_client_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sample_collection_date` date DEFAULT NULL,
  `sample_recevied_date` date DEFAULT NULL,
  `service_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sample_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `no_of_samples` int DEFAULT NULL,
  `tat` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sales_responsible_person` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `progenics_trf` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `third_party_trf` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `progenics_report` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sample_sent_to_third_party_date` date DEFAULT NULL,
  `third_party_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `third_party_report` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `results_raw_data_received_from_third_party_date` date DEFAULT NULL,
  `logistic_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lab_process_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bioinformatics_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nutritional_management_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `progenics_report_release_date` date DEFAULT NULL,
  `Remark_Comment` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modified_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `modified_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_process_unique_id` (`unique_id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_sample_id` (`sample_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `recycle_bin`
--

DROP TABLE IF EXISTS `recycle_bin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recycle_bin` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data` json DEFAULT NULL,
  `original_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reporting`
--

DROP TABLE IF EXISTS `reporting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reporting` (
  `report_id` int NOT NULL AUTO_INCREMENT,
  `sample_id` varchar(36) DEFAULT NULL,
  `report_release_date` date DEFAULT NULL,
  `report_release_status` varchar(30) DEFAULT NULL,
  `remainder_date` date DEFAULT NULL,
  `note` text,
  PRIMARY KEY (`report_id`),
  KEY `sample_id` (`sample_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` varchar(36) NOT NULL,
  `sample_id` varchar(36) NOT NULL,
  `status` varchar(50) DEFAULT 'in_progress',
  `report_path` varchar(500) DEFAULT NULL,
  `generated_at` timestamp NULL DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by` varchar(36) DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `report_type` varchar(100) DEFAULT NULL,
  `report_format` varchar(50) DEFAULT NULL,
  `findings` text,
  `recommendations` text,
  `clinical_interpretation` text,
  `technical_notes` text,
  `quality_control` json DEFAULT NULL,
  `validation_status` varchar(50) DEFAULT NULL,
  `report_version` varchar(20) DEFAULT NULL,
  `delivery_method` varchar(50) DEFAULT NULL,
  `recipient_email` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_reports_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sales_activities`
--

DROP TABLE IF EXISTS `sales_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_activities` (
  `id` varchar(36) NOT NULL,
  `lead_id` varchar(36) DEFAULT NULL,
  `activity_type` varchar(50) NOT NULL,
  `description` text,
  `outcome` varchar(100) DEFAULT NULL,
  `next_action` varchar(255) DEFAULT NULL,
  `scheduled_date` timestamp NULL DEFAULT NULL,
  `completed_date` timestamp NULL DEFAULT NULL,
  `assigned_to` varchar(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `duration` int DEFAULT NULL,
  `priority` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'planned',
  `notes` text,
  `attachments` json DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sample_tracking`
--

DROP TABLE IF EXISTS `sample_tracking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sample_tracking` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `unique_id` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `project_id` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sample_collection_date` date DEFAULT NULL,
  `sample_shipped_date` date DEFAULT NULL,
  `sample_delivery_date` date DEFAULT NULL,
  `sample_pick_up_from` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_up_to` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tracking_id` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `courier_company` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sample_shipment_amount` decimal(10,2) DEFAULT NULL,
  `organisation_hospital` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `clinician_researcher_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `clinician_researcher_phone` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `patient_client_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `patient_client_phone` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sample_recevied_date` date DEFAULT NULL,
  `sales_responsible_person` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `third_party_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `third_party_phone` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sample_sent_to_third_party_date` date DEFAULT NULL,
  `sample_received_to_third_party_date` date DEFAULT NULL,
  `alert_to_labprocess_team` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remark_comment` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(100) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-21 21:27:14
