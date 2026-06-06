USE chocolate_warehouse_db;

<<<<<<< HEAD
-- Admin user (password: admin123)
INSERT IGNORE INTO users (name, email, password_hash, role)
VALUES (
  'Admin',
  'admin@chocoloop.com',
  '$2a$10$YourHashHerePlaceholder',
  'admin'
);

-- Operator user (password: operator123)
INSERT IGNORE INTO users (name, email, password_hash, role)
VALUES (
  'Operator',
  'operator@chocoloop.com',
  '$2a$10$YourHashHerePlaceholder2',
  'operator'
=======
-- Warehouse Staff user (password: staff123)
INSERT IGNORE INTO users (name, email, password_hash, role)
VALUES (
  'John Staff',
  'staff@choco.com',
  '$2a$10$BaaU7S8k8IVzEwEadGc53.Xf2Yhh7lRB1vJCAo4DZ8pAz1F3/8jqG',
  'warehouse_staff'
);

-- Warehouse Supervisor user (password: supervisor123)
INSERT IGNORE INTO users (name, email, password_hash, role)
VALUES (
  'Sarah Supervisor',
  'supervisor@choco.com',
  '$2a$10$kqGiwfBXvQ6mNDlvotXjKeMhjCrr7uf40ucBwc/Wi2OoAXU4/b9P2',
  'warehouse_supervisor'
);

-- Maintenance/Technical Staff user (password: maintenance123)
INSERT IGNORE INTO users (name, email, password_hash, role)
VALUES (
  'Mike Maintenance',
  'maintenance@choco.com',
  '$2a$10$N9ypTl3u5xJzQqF9j4c/bOJ/cKXfLlJgHz0/XzN5zfQ7K7R8Q2cxu',
  'maintenance_staff'
>>>>>>> fix-camera
);

-- Inventory items matching vision detection colors (start at 0 — real data from camera)
INSERT IGNORE INTO inventory_items (name, sku, category, quantity, capacity, location, status) VALUES
('Milk Chocolate', 'CHOC-MILK-01', 'Milk Chocolate', 0, 1000, 'BIN-A', 'Out of Stock'),
('Dark Chocolate', 'CHOC-DARK-01', 'Dark Chocolate', 0, 1000, 'BIN-B', 'Out of Stock'),
('White Chocolate', 'CHOC-WHT-01', 'White Chocolate', 0, 1000, 'BIN-C', 'Out of Stock');

-- Robot arm
INSERT IGNORE INTO robots (name, status, battery_level, current_task_id) VALUES
('OpenCV Arm Alpha', 'idle', 100, NULL);
