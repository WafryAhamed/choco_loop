<<<<<<< HEAD
CREATE DATABASE IF NOT EXISTS chocolate_warehouse_db;
=======
<<<<<<< HEAD
DROP DATABASE IF EXISTS chocolate_warehouse_db;
CREATE DATABASE chocolate_warehouse_db;
=======
CREATE DATABASE IF NOT EXISTS chocolate_warehouse_db;
>>>>>>> fix-camera
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
USE chocolate_warehouse_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
<<<<<<< HEAD
  role ENUM('admin','operator') DEFAULT 'operator',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
=======
<<<<<<< HEAD
  role ENUM('admin','operator') DEFAULT 'operator',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
=======
  role ENUM('warehouse_staff','warehouse_supervisor','maintenance_staff') DEFAULT 'warehouse_staff',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
>>>>>>> fix-camera
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
<<<<<<< HEAD
  sku VARCHAR(100) UNIQUE,
=======
<<<<<<< HEAD
  sku VARCHAR(100),
=======
  sku VARCHAR(100) UNIQUE,
>>>>>>> fix-camera
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
  category VARCHAR(100),
  quantity INT DEFAULT 0,
  capacity INT DEFAULT 1000,
  location VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Out of Stock',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_type VARCHAR(50),
  description TEXT,
  item_id INT,
  quantity INT DEFAULT 1,
  status VARCHAR(50) DEFAULT 'Queued',
  progress INT DEFAULT 0,
  robot_id VARCHAR(50),
  duration VARCHAR(50),
  operator VARCHAR(100),
  confidence INT,
<<<<<<< HEAD
  source ENUM('voice','manual','vision','web') DEFAULT 'manual',
=======
  source ENUM('voice','manual','vision') DEFAULT 'manual',
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
  assigned_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (item_id) REFERENCES inventory_items(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS task_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT,
  action VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS robots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  status ENUM('idle','working','error') DEFAULT 'idle',
  battery_level INT DEFAULT 100,
  current_task_id INT,
  FOREIGN KEY (current_task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS voice_commands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  command_text TEXT,
  parsed_task_type VARCHAR(100),
  parsed_item VARCHAR(255),
  parsed_quantity INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vision_detections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item VARCHAR(255) NOT NULL,
  color VARCHAR(50) NOT NULL,
  action VARCHAR(50) DEFAULT 'pick',
  confidence INT DEFAULT 95,
  event_id VARCHAR(255) UNIQUE,
  source VARCHAR(50) DEFAULT 'vision',
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
