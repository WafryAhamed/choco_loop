DROP DATABASE IF EXISTS chocolate_warehouse_db;
CREATE DATABASE chocolate_warehouse_db;
USE chocolate_warehouse_db;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  role ENUM('admin','operator'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  sku VARCHAR(100),
  category VARCHAR(100),
  quantity INT,
  capacity INT,
  location VARCHAR(255),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_type VARCHAR(100),
  description TEXT,
  item_id INT,
  quantity INT,
  status VARCHAR(50),
  progress INT DEFAULT 0,
  robot_id VARCHAR(50),
  duration VARCHAR(50),
  operator VARCHAR(50),
  confidence INT,
  source VARCHAR(50),
  assigned_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (item_id) REFERENCES inventory_items(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id)
);

CREATE TABLE task_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT,
  action VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE robots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  status VARCHAR(50),
  battery_level INT,
  current_task_id INT,
  FOREIGN KEY (current_task_id) REFERENCES tasks(id)
);

CREATE TABLE voice_commands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  command_text TEXT,
  parsed_task_type VARCHAR(100),
  parsed_item VARCHAR(255),
  parsed_quantity INT
);
