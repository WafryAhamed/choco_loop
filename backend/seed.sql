USE chocolate_warehouse_db;

-- Insert admin user with password hash for "password"
INSERT INTO users (name, email, password_hash, role)
VALUES (
  'Admin',
  'admin@warehouse.local',
  '$2b$12$HaKg56d6ttmEctWwKIRM4eIvDaoWlNMMBbx2dJEfiJFQOYeyDkwxe',
  'admin'
);

-- Seed inventory items
INSERT INTO inventory_items (name, sku, category, quantity, capacity, location, status) VALUES
('Classic Milk Chocolate Box', 'CHOC-MILK-01', 'Milk', 1250, 2000, 'Colombo', 'In Stock'),
('85% Dark Cocoa Premium', 'CHOC-DARK-85', 'Dark', 420, 1000, 'Kandy', 'Low Stock'),
('White Chocolate Truffles', 'CHOC-WHT-TRF', 'Truffle', 890, 1500, 'Galle', 'In Stock'),
('Premium Assorted Collection', 'CHOC-ASST-PR', 'Assorted', 150, 500, 'Jaffna', 'Low Stock'),
('Dark Chocolate Truffles', 'CHOC-DRK-TRF', 'Truffle', 0, 800, 'Negombo', 'Out of Stock'),
('Milk Chocolate Almond', 'CHOC-MILK-ALM', 'Milk', 1800, 2000, 'Trincomalee', 'In Stock'),
('White Macadamia Nut', 'CHOC-WHT-MAC', 'White', 600, 1000, 'Matara', 'In Stock'),
('70% Dark Cocoa Standard', 'CHOC-DARK-70', 'Dark', 1100, 1500, 'Anuradhapura', 'In Stock'),
('Sea Salt Caramel Squares', 'CHOC-CAR-SEA', 'Assorted', 320, 1200, 'Ratnapura', 'Low Stock'),
('Hazelnut Milk Praline', 'CHOC-MILK-HAZ', 'Milk', 950, 1000, 'Kurunegala', 'In Stock'),
('Dark Chocolate Mint', 'CHOC-DARK-MNT', 'Dark', 50, 800, 'Nuwara Eliya', 'Low Stock'),
('White Raspberry Swirl', 'CHOC-WHT-RSP', 'White', 780, 1000, 'Badulla', 'In Stock');

-- Seed robots
INSERT INTO robots (name, status, battery_level, current_task_id) VALUES
('OpenCV Arm Alpha', 'idle', 100, NULL);

-- Seed active tasks
INSERT INTO tasks (description, status, progress, task_type) VALUES
('Picking Blue Box → Colombo', 'Active', 65, 'Pick'),
('Sorting Dark Chocolate', 'Queued', 0, 'Sort'),
('Packaging Truffle Collection', 'Queued', 0, 'Pack'),
('Waiting for vision confirmation', 'Waiting', 0, 'System'),
('Picking White Box → Galle', 'Queued', 0, 'Pick');

-- Seed task history
INSERT INTO tasks (description, status, duration, operator, confidence, robot_id) VALUES
('Pick Dark Chocolate 85% → Colombo', 'Success', '24s', 'Auto', 95, 'RBT-01'),
('Sort Milk Chocolate Box → Kandy', 'Success', '18s', 'AI', 98, 'RBT-02'),
('Pack White Truffles → Galle', 'Failed', '35s', 'Manual', 55, 'RBT-03');
