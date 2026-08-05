-- =============================================================================
-- Asset Management System - Complete MySQL Database Schema
-- Includes: PK, FK, Indexes, Constraints, Status, and Audit Fields
-- Audit Fields: created_at, updated_at, deleted_at (Soft Delete)
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Roles Table
CREATE TABLE `roles` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE,
    `permissions` JSON NULL,
    `status` ENUM('active', 'inactive') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    INDEX `idx_role_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Employees Table
CREATE TABLE `employees` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `employee_code` VARCHAR(20) NOT NULL UNIQUE,
    `first_name` VARCHAR(50) NOT NULL,
    `last_name` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `phone` VARCHAR(20) NULL,
    `department` VARCHAR(100) NULL,
    `designation` VARCHAR(100) NULL,
    `status` ENUM('active', 'resigned', 'on_leave') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    INDEX `idx_employee_code` (`employee_code`),
    INDEX `idx_employee_email` (`email`),
    INDEX `idx_employee_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Users Table
CREATE TABLE `users` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `employee_id` INT UNSIGNED NULL,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role_id` INT UNSIGNED NOT NULL,
    `status` ENUM('active', 'locked', 'inactive') DEFAULT 'active',
    `last_login` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT `fk_user_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_user_role` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`),
    INDEX `idx_username` (`username`),
    INDEX `idx_user_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Asset Categories Table
CREATE TABLE `asset_categories` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `prefix` VARCHAR(10) NULL COMMENT 'E.g., LAP for Laptops',
    `description` TEXT NULL,
    `status` ENUM('active', 'inactive') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    INDEX `idx_cat_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Assets Table
CREATE TABLE `assets` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `asset_tag` VARCHAR(50) NOT NULL UNIQUE,
    `name` VARCHAR(100) NOT NULL,
    `category_id` INT UNSIGNED NOT NULL,
    `serial_number` VARCHAR(100) NULL UNIQUE,
    `model` VARCHAR(100) NULL,
    `brand` VARCHAR(100) NULL,
    `purchase_date` DATE NULL,
    `purchase_cost` DECIMAL(15, 2) DEFAULT 0.00,
    `warranty_expiry` DATE NULL,
    `status` ENUM('available', 'assigned', 'in_repair', 'damaged', 'retired', 'disposed') DEFAULT 'available',
    `specifications` JSON NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT `fk_asset_category` FOREIGN KEY (`category_id`) REFERENCES `asset_categories`(`id`),
    INDEX `idx_asset_tag` (`asset_tag`),
    INDEX `idx_asset_status` (`status`),
    INDEX `idx_asset_serial` (`serial_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Assignments Table
CREATE TABLE `assignments` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `asset_id` INT UNSIGNED NOT NULL,
    `employee_id` INT UNSIGNED NOT NULL,
    `assigned_by` INT UNSIGNED NOT NULL,
    `assigned_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `return_due_date` DATE NULL,
    `actual_return_date` TIMESTAMP NULL,
    `status` ENUM('active', 'returned', 'overdue') DEFAULT 'active',
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT `fk_assign_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`),
    CONSTRAINT `fk_assign_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`),
    CONSTRAINT `fk_assign_user` FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`),
    INDEX `idx_assign_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Damage Reports Table
CREATE TABLE `damage_reports` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `asset_id` INT UNSIGNED NOT NULL,
    `reported_by` INT UNSIGNED NOT NULL,
    `damage_date` DATE NOT NULL,
    `description` TEXT NOT NULL,
    `severity` ENUM('minor', 'major', 'critical') DEFAULT 'minor',
    `status` ENUM('pending', 'under_review', 'resolved', 'dismissed') DEFAULT 'pending',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT `fk_damage_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`),
    CONSTRAINT `fk_damage_user` FOREIGN KEY (`reported_by`) REFERENCES `users`(`id`),
    INDEX `idx_damage_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Service Records Table
CREATE TABLE `service_records` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `asset_id` INT UNSIGNED NOT NULL,
    `service_type` VARCHAR(100) NOT NULL COMMENT 'Repair, Maintenance, Upgrade',
    `provider` VARCHAR(255) NULL,
    `service_date` DATE NOT NULL,
    `completion_date` DATE NULL,
    `cost` DECIMAL(15, 2) DEFAULT 0.00,
    `details` TEXT NULL,
    `status` ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT `fk_service_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`),
    INDEX `idx_service_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Activity Logs Table
CREATE TABLE `activity_logs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NULL,
    `action` VARCHAR(100) NOT NULL,
    `module` VARCHAR(50) NOT NULL,
    `target_id` INT UNSIGNED NULL,
    `old_values` JSON NULL,
    `new_values` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT `fk_log_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_log_module` (`module`),
    INDEX `idx_log_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Notifications Table
CREATE TABLE `notifications` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `type` ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
    `is_read` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT `fk_notify_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
    INDEX `idx_notify_user` (`user_id`),
    INDEX `idx_notify_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Chat History Table
CREATE TABLE `chat_history` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `message` TEXT NOT NULL,
    `sender` ENUM('user', 'ai') NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT `fk_chat_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
    INDEX `idx_chat_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. AI Memory Table
CREATE TABLE `ai_memory` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL UNIQUE,
    `context_summary` TEXT NULL,
    `preference_data` JSON NULL,
    `last_interaction_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT `fk_memory_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
    INDEX `idx_memory_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
