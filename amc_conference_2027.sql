/*
 Navicat Premium Dump SQL

 Source Server         : tiendetravels_db
 Source Server Type    : MySQL
 Source Server Version : 90600 (9.6.0)
 Source Host           : localhost:3306
 Source Schema         : amc_conference_2027

 Target Server Type    : MySQL
 Target Server Version : 90600 (9.6.0)
 File Encoding         : 65001

 Date: 15/06/2026 09:55:32
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for admin_audit_log
-- ----------------------------
DROP TABLE IF EXISTS `admin_audit_log`;
CREATE TABLE `admin_audit_log`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_clerk_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_table` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `target_id` int NULL DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_admin_clerk_id`(`admin_clerk_id` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of admin_audit_log
-- ----------------------------

-- ----------------------------
-- Table structure for admins
-- ----------------------------
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login` datetime NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `email`(`email` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of admins
-- ----------------------------
INSERT INTO `admins` VALUES (1, 'AMC Administrator', 'admin@amc2027.org', '$2b$12$O5aDDsK4EYYUukAA8eJsl.uyqJcWCwJuOfwdqF.6ETLu2a01rCiCW', 1, '2026-06-13 10:02:35', '2026-06-01 10:47:17');

-- ----------------------------
-- Table structure for conference_settings
-- ----------------------------
DROP TABLE IF EXISTS `conference_settings`;
CREATE TABLE `conference_settings`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `setting_key`(`setting_key` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 15 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of conference_settings
-- ----------------------------
INSERT INTO `conference_settings` VALUES (1, 'conference_name', '3rd Quadrennial Conference 2027', '2026-06-01 10:15:16');
INSERT INTO `conference_settings` VALUES (2, 'conference_dates', 'March 9–14, 2027', '2026-06-01 10:15:16');
INSERT INTO `conference_settings` VALUES (3, 'conference_location', 'Harare, Zimbabwe', '2026-06-01 10:15:16');
INSERT INTO `conference_settings` VALUES (4, 'conference_start_date', '2027-03-09', '2026-06-01 10:15:16');
INSERT INTO `conference_settings` VALUES (5, 'registration_fee_delegate_usd', '150', '2026-06-01 10:15:16');
INSERT INTO `conference_settings` VALUES (6, 'registration_fee_observer_usd', '100', '2026-06-01 10:15:16');
INSERT INTO `conference_settings` VALUES (7, 'registration_fee_guest_usd', '120', '2026-06-01 10:15:16');
INSERT INTO `conference_settings` VALUES (8, 'accommodation_fee_per_night_usd', '80', '2026-06-01 10:15:16');
INSERT INTO `conference_settings` VALUES (9, 'registration_open', 'true', '2026-06-01 10:15:16');
INSERT INTO `conference_settings` VALUES (10, 'max_registrations', '500', '2026-06-01 10:15:16');
INSERT INTO `conference_settings` VALUES (11, 'conference_theme', 'Equipped to transform Africa's sociopolitical and economic landscape', '2026-06-01 10:15:16');
INSERT INTO `conference_settings` VALUES (12, 'conference_theme_scripture', 'Isaiah 61:1', '2026-06-01 10:15:16');
INSERT INTO `conference_settings` VALUES (13, 'venue_name', 'Rainbow Towers Hotel & Conference Centre', '2026-06-01 10:15:16');
INSERT INTO `conference_settings` VALUES (14, 'venue_address', 'Pennefather Avenue, Harare, Zimbabwe', '2026-06-01 10:15:16');

-- ----------------------------
-- Table structure for hotel_bookings
-- ----------------------------
DROP TABLE IF EXISTS `hotel_bookings`;
CREATE TABLE `hotel_bookings`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `hotel_id` int NOT NULL,
  `registration_id` int NULL DEFAULT NULL,
  `guest_name` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `guest_email` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `check_in` date NOT NULL DEFAULT '2027-03-09',
  `check_out` date NOT NULL DEFAULT '2027-03-15',
  `nights` int NOT NULL DEFAULT 6,
  `rooms` int NOT NULL DEFAULT 1,
  `total_usd` decimal(10, 2) NOT NULL,
  `status` enum('reserved','confirmed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'reserved',
  `expires_at` timestamp NULL DEFAULT NULL,
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_hotel`(`hotel_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_expires`(`expires_at` ASC) USING BTREE,
  CONSTRAINT `hotel_bookings_ibfk_1` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of hotel_bookings
-- ----------------------------

-- ----------------------------
-- Table structure for hotels
-- ----------------------------
DROP TABLE IF EXISTS `hotels`;
CREATE TABLE `hotels`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `stars` tinyint NOT NULL DEFAULT 3,
  `address` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `distance_km` decimal(5, 2) NULL DEFAULT NULL,
  `price_usd` decimal(8, 2) NOT NULL,
  `room_type` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'Standard Room',
  `total_rooms` int NOT NULL DEFAULT 0,
  `available_rooms` int NOT NULL DEFAULT 0,
  `amenities` json NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `photo_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT 0,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of hotels
-- ----------------------------
INSERT INTO `hotels` VALUES (1, 'Kentucky Hotel', 3, '27 St Patricks Rd, Hatfield', 7.00, 60.00, 'Standard Room', 10, 10, NULL, 'Good', '', 0, 1, '2026-06-13 10:17:41', '2026-06-13 10:17:41');

-- ----------------------------
-- Table structure for payments
-- ----------------------------
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `registrant_id` int NOT NULL,
  `paynow_poll_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `paynow_reference` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `amount` decimal(10, 2) NOT NULL,
  `currency` enum('USD','ZWL') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'USD',
  `payment_method` enum('ecocash','visa','mastercard','telecash','paynow','bank') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'ecocash',
  `status` enum('pending','awaiting_delivery','delivered','created','sent','cancelled','disputed','refunded','paid') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'pending',
  `paynow_status_raw` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_registrant_id`(`registrant_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`registrant_id`) REFERENCES `registrants` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of payments
-- ----------------------------
INSERT INTO `payments` VALUES (1, 6, NULL, 'AMC2027-00006-1781342006430', 150.00, 'USD', 'bank', 'pending', NULL, NULL, '2026-06-13 11:13:26');
INSERT INTO `payments` VALUES (2, 11, 'https://www.paynow.co.zw/Interface/CheckPayment/?guid=da2cde05-d3dc-4f74-969a-1a6b4a0db994', 'AMC2027-00011-1781349419805', 150.00, 'USD', 'visa', 'pending', NULL, NULL, '2026-06-13 13:17:00');
INSERT INTO `payments` VALUES (3, 12, 'https://www.paynow.co.zw/Interface/CheckPayment/?guid=5c86f2c2-69c3-4004-a179-4ef8b47c11d0', 'AMC2027-00012-1781349643705', 150.00, 'USD', 'visa', 'paid', 'paid', '2026-06-13 13:23:54', '2026-06-13 13:20:43');
INSERT INTO `payments` VALUES (4, 13, NULL, 'AMC2027-00013-1781350345203', 150.00, 'USD', 'ecocash', 'pending', NULL, NULL, '2026-06-13 13:32:25');
INSERT INTO `payments` VALUES (5, 13, NULL, 'AMC2027-00013-1781350353211', 150.00, 'USD', 'ecocash', 'pending', NULL, NULL, '2026-06-13 13:32:33');
INSERT INTO `payments` VALUES (6, 13, NULL, 'AMC2027-00013-1781353436274', 150.00, 'USD', 'ecocash', 'pending', NULL, NULL, '2026-06-13 14:23:56');
INSERT INTO `payments` VALUES (7, 13, NULL, 'AMC2027-00013-1781353787423', 150.00, 'USD', 'ecocash', 'pending', NULL, NULL, '2026-06-13 14:29:47');
INSERT INTO `payments` VALUES (8, 13, 'https://www.paynow.co.zw/Interface/CheckPayment/?guid=933f37b1-644f-4549-b727-3ff559b31274', 'AMC2027-00013-1781353944046', 150.00, 'USD', 'ecocash', 'paid', 'paid', '2026-06-13 14:32:30', '2026-06-13 14:32:24');

-- ----------------------------
-- Table structure for registrants
-- ----------------------------
DROP TABLE IF EXISTS `registrants`;
CREATE TABLE `registrants`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `registration_ref` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'e.g. AMC2027-00042',
  `designation` enum('Archbishop','Bishop','Dr','His Eminence','Most Revd Dr','Most Revd Prof','Mr','Mrs','Ms','Presiding Prelate','Revd','Revd Dr','Rt Revd','Very Revd') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `office` enum('Administrative Assistant','AMC Executive Member','Bishop','Conference Secretary','General Secretary','Prelate','Presiding Bishop','Secretary of Conference') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('Delegate','Invited Guest','Observer') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `church` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `accommodation` tinyint(1) NULL DEFAULT 0,
  `accommodation_nights` int NULL DEFAULT 0,
  `num_people` int NULL DEFAULT 1,
  `dietary_requirements` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `special_requests` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `payment_status` enum('pending','paid','failed','refunded') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'pending',
  `registration_status` enum('pending','confirmed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `registration_ref`(`registration_ref` ASC) USING BTREE,
  INDEX `idx_email`(`email` ASC) USING BTREE,
  INDEX `idx_payment_status`(`payment_status` ASC) USING BTREE,
  INDEX `idx_registration_status`(`registration_status` ASC) USING BTREE,
  INDEX `idx_category`(`category` ASC) USING BTREE,
  INDEX `idx_country`(`country` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 14 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of registrants
-- ----------------------------
INSERT INTO `registrants` VALUES (1, 'AMC2027-00001', 'Archbishop', 'Carlos Takudzwa', 'Shava', 'shavacarlos1@gmail.com', '+263784754396', 'Presiding Bishop', 'Delegate', 'Reimage Private College', 'Zimbabwe', 0, 0, 1, NULL, NULL, 'pending', 'pending', '2026-06-01 10:36:44', '2026-06-01 10:36:44');
INSERT INTO `registrants` VALUES (2, 'AMC2027-00002', 'Mr', 'Carlos Takudzwa', 'Shava', 'shavacarlos2@gmail.com', '+263784754396', 'Presiding Bishop', 'Invited Guest', 'Reimage Private College', 'Zimbabwe', 1, 2, 1, 'n/a', 'n/a', 'pending', 'pending', '2026-06-01 11:47:24', '2026-06-01 11:47:24');
INSERT INTO `registrants` VALUES (3, 'AMC2027-00003', 'Archbishop', 'Carlos Takudzwa', 'Shava', 'shavacarlos8@gmail.com', '+263784754396', 'Prelate', 'Delegate', 'Reimage Private College', 'Zimbabwe', 0, 0, 1, NULL, NULL, 'pending', 'pending', '2026-06-13 10:25:59', '2026-06-13 10:25:59');
INSERT INTO `registrants` VALUES (4, 'AMC2027-00004', 'Archbishop', 'Carlos Takudzwa', 'Shava', 'shavacarlos9@gmail.com', '+263784754396', 'Prelate', 'Delegate', 'Reimage Private College', 'Zimbabwe', 0, 0, 1, 'N/a', 'N/a', 'pending', 'pending', '2026-06-13 10:27:26', '2026-06-13 10:27:26');
INSERT INTO `registrants` VALUES (5, 'AMC2027-00005', 'Archbishop', 'Carlos Takudzwa', 'Shava', 'shavacarlos4@gmail.com', '+263784754396', 'Secretary of Conference', 'Delegate', 'Reimage Private College', 'Zimbabwe', 0, 0, 1, NULL, NULL, 'pending', 'pending', '2026-06-13 10:48:22', '2026-06-13 10:48:22');
INSERT INTO `registrants` VALUES (6, 'AMC2027-00006', 'Very Revd', 'Carlos Takudzwa', 'Shava', 'shavacarlos11@gmail.com', '+263784754396', 'Conference Secretary', 'Delegate', 'Reimage Private College', 'Zimbabwe', 0, 0, 1, NULL, NULL, 'pending', 'pending', '2026-06-13 11:09:51', '2026-06-13 11:09:51');
INSERT INTO `registrants` VALUES (7, 'AMC2027-00007', 'Archbishop', 'Carlos Takudzwa', 'Shava', 'shavacarlos12@gmail.com', '+263784754396', 'Secretary of Conference', 'Observer', 'Reimage Private College', 'Zimbabwe', 0, 0, 1, NULL, NULL, 'pending', 'pending', '2026-06-13 11:15:10', '2026-06-13 11:15:10');
INSERT INTO `registrants` VALUES (8, 'AMC2027-00008', 'Archbishop', 'Carlos Takudzwa', 'Shava', 'shavacarlos120@gmail.com', '+263784754396', 'Secretary of Conference', 'Delegate', 'Reimage Private College', 'Zimbabwe', 0, 0, 1, NULL, NULL, 'pending', 'pending', '2026-06-13 11:42:42', '2026-06-13 11:42:42');
INSERT INTO `registrants` VALUES (9, 'AMC2027-00009', 'Mr', 'Carlos Takudzwa', 'Shava', 'shavacarlos18@gmail.com', '+263784754396', 'Secretary of Conference', 'Delegate', 'Reimage Private College', 'Zimbabwe', 0, 0, 1, NULL, NULL, 'pending', 'pending', '2026-06-13 12:57:55', '2026-06-13 12:57:55');
INSERT INTO `registrants` VALUES (10, 'AMC2027-00010', 'Bishop', 'Carlos Takudzwa', 'Shava', 'amchostinger@gmail.com', '+263784754396', 'Administrative Assistant', 'Delegate', 'Reimage Private College', 'Zimbabwe', 0, 0, 1, NULL, NULL, 'pending', 'pending', '2026-06-13 13:09:10', '2026-06-13 13:09:10');
INSERT INTO `registrants` VALUES (11, 'AMC2027-00011', 'Archbishop', 'Carlos Takudzwa', 'Shava', 'amchostinger@gmail.com', '+263784754396', 'Bishop', 'Delegate', 'Reimage Private College', 'Zimbabwe', 0, 0, 1, NULL, NULL, 'pending', 'pending', '2026-06-13 13:15:18', '2026-06-13 13:15:18');
INSERT INTO `registrants` VALUES (12, 'AMC2027-00012', 'Revd Dr', 'Carlos Takudzwa', 'Shava', 'amchostinger@gmail.com', '+263784754396', 'Secretary of Conference', 'Delegate', 'Reimage Private College', 'Zimbabwe', 0, 0, 1, NULL, NULL, 'paid', 'confirmed', '2026-06-13 13:20:39', '2026-06-13 13:23:54');
INSERT INTO `registrants` VALUES (13, 'AMC2027-00013', 'Dr', 'Carlos Takudzwa', 'Shava', 'amchostinger@gmail.com', '+263784754396', 'Bishop', 'Delegate', 'Reimage Private College', 'Zimbabwe', 0, 0, 1, NULL, NULL, 'paid', 'confirmed', '2026-06-13 13:32:16', '2026-06-13 14:32:30');

-- ----------------------------
-- Table structure for schedule_sessions
-- ----------------------------
DROP TABLE IF EXISTS `schedule_sessions`;
CREATE TABLE `schedule_sessions`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NULL DEFAULT NULL,
  `title` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `room` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `type` enum('worship','keynote','general','social','break','logistics') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'general',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_date`(`session_date` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 53 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of schedule_sessions
-- ----------------------------
INSERT INTO `schedule_sessions` VALUES (1, '2027-03-09', '17:00:00', '18:30:00', 'AMC Executive Meeting', 'Board Room', 'general', 'Led by Revd Dr Martin Mujinga, AMC General Secretary', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (2, '2027-03-09', '18:30:00', '19:30:00', 'Dinner for Delegates', 'Dining Hall', 'social', 'Welcome dinner', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (3, '2027-03-09', '19:30:00', '20:00:00', 'Presentation of Conference Emblems & Flags', 'Plenary Hall', 'general', 'Conference emblems and flags presentation', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (4, '2027-03-10', '06:30:00', '08:30:00', 'Breakfast', 'Dining Hall', 'break', '', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (5, '2027-03-10', '08:30:00', '08:45:00', 'Procession', 'Plenary Hall', 'general', 'Led by Revd Likhai Molife, General Secretary - Methodist Church in Zimbabwe', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (6, '2027-03-10', '08:45:00', '11:00:00', 'Opening Service', 'Plenary Hall', 'worship', 'Bishop Simbarashe Sithole, Presiding Bishop of the Methodist Church in Zimbabwe', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (7, '2027-03-10', '11:00:00', '11:30:00', 'AMC President - Address and Official Opening', 'Plenary Hall', 'keynote', 'Most Revd Dr Paul K Boafo, AMC President', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (8, '2027-03-10', '11:30:00', '12:00:00', 'Welcome and Introductions', 'Plenary Hall', 'general', '', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (9, '2027-03-10', '12:00:00', '12:30:00', 'Photo Shooting', 'Plenary Hall', 'general', 'Ms Bongi Moyo-Bango and the Communication Team', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (10, '2027-03-10', '12:30:00', '14:00:00', 'Lunch', 'Dining Hall', 'break', '', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (11, '2027-03-10', '14:00:00', '15:00:00', 'Keynote Address', 'Plenary Hall', 'keynote', 'Speaker TBA', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (12, '2027-03-10', '15:00:00', '15:15:00', 'Health Break', 'Foyer', 'break', '', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (13, '2027-03-10', '15:15:00', '16:00:00', 'Milestones of the Africa Methodist Council', 'Plenary Hall', 'general', '', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (14, '2027-03-10', '16:00:00', '17:30:00', 'Celebrating International Women - Day', 'Plenary Hall', 'keynote', '', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (15, '2027-03-10', '17:30:00', '18:30:00', 'Closing Worship', 'Plenary Hall', 'worship', 'East Africa region leading', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (16, '2027-03-10', '18:30:00', '20:00:00', 'Dinner', 'Dining Hall', 'social', '', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (17, '2027-03-11', '06:30:00', '08:30:00', 'Breakfast', 'Dining Hall', 'break', '', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (18, '2027-03-11', '08:30:00', '09:00:00', 'Theological Reflections', 'Plenary Hall', 'worship', 'Anglophone West Africa', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (19, '2027-03-11', '09:30:00', '10:30:00', 'Revisiting the Concept of Wesleyan Holiness and Its Impact in Africa', 'Plenary Hall', 'keynote', 'Speaker TBA', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (20, '2027-03-11', '10:00:00', '10:30:00', 'Health Break', 'Foyer', 'break', '', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (21, '2027-03-11', '10:30:00', '11:30:00', 'Democracy under Pressure - The African Church as Moral Compass in Times of Political Uncertainty', 'Conference Room A', 'keynote', 'Speaker TBA - AMC Business Session 1', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (22, '2027-03-11', '11:30:00', '12:30:00', 'Youthquake - The Church Role in Addressing Youth Migration through Investment, Opportunity, and Justice', 'Conference Room B', 'keynote', 'Speaker TBA - AMC Business Session 2', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (23, '2027-03-11', '12:30:00', '14:00:00', 'Lunch', 'Dining Hall', 'break', '', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (24, '2027-03-11', '14:30:00', '16:00:00', 'Group Discussions - Youth, Women, Men', 'Various Rooms', 'general', 'AMC Business Session 3', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (25, '2027-03-11', '16:00:00', '17:00:00', 'Feedback from Group Discussions', 'Plenary Hall', 'general', 'AMC Business Session 4', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (26, '2027-03-11', '17:00:00', '18:30:00', 'Musical Presentations', 'Plenary Hall', 'social', 'Methodist Church in Zimbabwe Musical Groups', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (27, '2027-03-11', '18:30:00', '19:00:00', 'Closing Devotions', 'Plenary Hall', 'worship', 'Central Africa region', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (28, '2027-03-11', '19:00:00', '20:00:00', 'Dinner', 'Dining Hall', 'social', '', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (29, '2027-03-12', '06:30:00', '08:30:00', 'Breakfast', 'Dining Hall', 'break', '', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (30, '2027-03-12', '08:30:00', '09:00:00', 'Theological Reflections', 'Plenary Hall', 'worship', 'Speaker TBA', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (31, '2027-03-12', '09:00:00', '10:00:00', 'The Renewed Scramble for Africa - Minerals - A Prophetic Response to Extraction, Exploitation, and Neo-Colonial Power', 'Plenary Hall', 'keynote', 'Speaker TBA', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (32, '2027-03-12', '10:00:00', '10:30:00', 'Health Break', 'Foyer', 'break', '', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (33, '2027-03-12', '10:30:00', '11:30:00', 'Fraternal Greetings', 'Plenary Hall', 'general', 'Revd Dr Martin Mujinga, AMC General Secretary', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (34, '2027-03-12', '11:30:00', '12:30:00', 'The Impact of Methodism on World Christianity', 'Plenary Hall', 'keynote', 'Speaker TBA', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (35, '2027-03-12', '12:30:00', '14:00:00', 'Lunch', 'Dining Hall', 'break', 'Francophone West Africa', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (36, '2027-03-12', '14:00:00', '15:00:00', 'Digital Transformation and Human Dignity in Africa - The Church - Responsibility in an Emerging Digital Society', 'Conference Room A', 'keynote', 'Speaker TBA - AMC Business Session 5', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (37, '2027-03-12', '15:00:00', '16:00:00', 'Discussion on the Roles of the Church in Drugs and Substance Abuse', 'Conference Room B', 'keynote', 'Speaker TBA', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (38, '2027-03-12', '16:00:00', '17:00:00', 'Presentation of Awards', 'Plenary Hall', 'general', 'Most Revd Dr Paul K Boafo, AMC President', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (39, '2027-03-12', '17:00:00', '18:00:00', 'Evening Service', 'Plenary Hall', 'worship', 'Vice President (TBA)', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (40, '2027-03-12', '18:00:00', '20:00:00', 'Dinner', 'Dining Hall', 'social', '', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (41, '2027-03-13', '06:30:00', '08:30:00', 'Breakfast', 'Dining Hall', 'break', '', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (42, '2027-03-13', '08:30:00', '09:30:00', 'Morning Worship', 'Plenary Hall', 'worship', 'Speaker TBA', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (43, '2027-03-13', '09:30:00', '11:30:00', 'General Conference Plenary Session - Resolutions', 'Plenary Hall', 'general', 'Resolutions Committee', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (44, '2027-03-13', '11:30:00', '12:00:00', 'Press Conference', 'Board Room', 'general', 'President, Vice Presidents and General Secretary', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (45, '2027-03-13', '12:00:00', '13:00:00', 'Lunch', 'Dining Hall', 'break', '', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (46, '2027-03-13', '13:00:00', '17:00:00', 'Excursion', 'Off-site', 'social', 'Local Organising Committee', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (47, '2027-03-13', '17:00:00', '19:00:00', 'Conference Night - Music Night', 'Grand Ballroom', 'social', 'Local Organising Committee', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (48, '2027-03-13', '19:00:00', '19:40:00', 'Closing Service', 'Plenary Hall', 'worship', 'AMC President', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (49, '2027-03-13', '19:40:00', '20:00:00', 'Dinner', 'Dining Hall', 'social', '', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (50, '2027-03-14', '07:00:00', '08:00:00', 'Breakfast', 'Dining Hall', 'break', '', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (51, '2027-03-14', '08:00:00', '13:00:00', 'Church Services at Methodist Churches in Harare', 'Various Locations', 'worship', 'Lunch provided by local churches', '2026-06-13 10:05:37', '2026-06-13 10:05:37');
INSERT INTO `schedule_sessions` VALUES (52, '2027-03-14', '13:00:00', NULL, 'Delegate Departures', '', 'logistics', '', '2026-06-13 10:05:37', '2026-06-13 10:05:37');

-- ----------------------------
-- Table structure for session_speakers
-- ----------------------------
DROP TABLE IF EXISTS `session_speakers`;
CREATE TABLE `session_speakers`  (
  `session_id` int NOT NULL,
  `speaker_id` int NOT NULL,
  `role` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  PRIMARY KEY (`session_id`, `speaker_id`) USING BTREE,
  INDEX `speaker_id`(`speaker_id` ASC) USING BTREE,
  CONSTRAINT `session_speakers_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `schedule_sessions` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `session_speakers_ibfk_2` FOREIGN KEY (`speaker_id`) REFERENCES `speakers` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of session_speakers
-- ----------------------------

-- ----------------------------
-- Table structure for speakers
-- ----------------------------
DROP TABLE IF EXISTS `speakers`;
CREATE TABLE `speakers`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `designation` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '',
  `church` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '',
  `country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '',
  `bio` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `photo_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `keynote` tinyint(1) NOT NULL DEFAULT 0,
  `display_order` int NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 25 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of speakers
-- ----------------------------

SET FOREIGN_KEY_CHECKS = 1;
