CREATE DATABASE  IF NOT EXISTS `patrol_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `patrol_db`;
-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: patrol_db
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `allowed_employees`
--

DROP TABLE IF EXISTS `allowed_employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `allowed_employees` (
  `employee_id` varchar(50) NOT NULL,
  `is_registered` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `allowed_employees`
--

LOCK TABLES `allowed_employees` WRITE;
/*!40000 ALTER TABLE `allowed_employees` DISABLE KEYS */;
INSERT INTO `allowed_employees` VALUES ('A26-001',1),('A26-002',0),('A26-003',0),('A26-004',0),('A26-005',0),('admin',1);
/*!40000 ALTER TABLE `allowed_employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patrol_logs`
--

DROP TABLE IF EXISTS `patrol_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patrol_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `situation` varchar(255) NOT NULL,
  `position` varchar(255) NOT NULL,
  `image_path` text,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patrol_logs`
--

LOCK TABLES `patrol_logs` WRITE;
/*!40000 ALTER TABLE `patrol_logs` DISABLE KEYS */;
INSERT INTO `patrol_logs` VALUES (24,'파노라마','START','http://192.168.0.5:5000/panorama/PANO_20260317_122619.jpg','2026-03-17 12:26:20'),(27,'파노라마','B-1','http://192.168.0.5:5000/panorama/PANO_20260319_093947.jpg','2026-03-19 09:39:47'),(32,'사람 감지','START','http://192.168.0.5:5000/uploads/20260319_151907.jpg','2026-03-19 15:19:07'),(33,'?화재 감지','START','http://192.168.0.5:5000/uploads/20260319_152416.jpg','2026-03-19 15:24:17'),(34,'사람 감지','미지정','http://192.168.0.5:5000/uploads/20260319_172832.jpg','2026-03-19 17:28:33'),(35,'사람 감지','미지정','http://192.168.0.5:5000/uploads/20260319_173446.jpg','2026-03-19 17:34:46');
/*!40000 ALTER TABLE `patrol_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `employee_id` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`employee_id`),
  CONSTRAINT `fk_allowed_employee` FOREIGN KEY (`employee_id`) REFERENCES `allowed_employees` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('a26-001','$2b$12$od8gZwdTe/ViRL4MR2jqB.dxXg/esSSYHb8aQqiZByOX2ziHdcRKC','2026-02-24 00:38:02'),('admin','$2b$12$NUvVYRIgpfjuQU7TGskTY.1OZfzyRIgCvWzkZ84wNxw.mZMnJFZhu','2026-02-23 02:12:06');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-20  9:28:39
