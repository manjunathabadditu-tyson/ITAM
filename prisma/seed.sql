-- Seed data for ITAM PostgreSQL database
-- Run with: psql -U postgres -d itam -f prisma/seed.sql

-- Insert Roles
INSERT INTO "roles" ("id", "name", "code", "isActive", "createdAt") VALUES
  ('role-super-admin', 'Super Admin', 'SUPER_ADMIN', true, NOW()),
  ('role-purchase-admin', 'Purchase Admin', 'PURCHASE_ADMIN', true, NOW()),
  ('role-store-admin', 'Store Admin', 'STORE_ADMIN', true, NOW()),
  ('role-hr-manager', 'HR Manager', 'HR_MANAGER', true, NOW()),
  ('role-end-user', 'End User', 'END_USER', true, NOW());

-- Insert Departments
INSERT INTO "departments" ("id", "name", "code", "isActive", "createdAt") VALUES
  ('dept-it', 'IT', 'IT', true, NOW()),
  ('dept-hr', 'Human Resources', 'HR', true, NOW()),
  ('dept-ops', 'Operations', 'OPS', true, NOW());

-- Insert Users
INSERT INTO "users" ("id", "email", "name", "passwordHash", "authType", "isActive", "departmentId", "createdAt", "updatedAt") VALUES
  ('user-admin', 'admin@tyson.com', 'Admin User', '$2a$10$dummy', 'Local', true, 'dept-it', NOW(), NOW()),
  ('user-purchaser', 'purchaser@tyson.com', 'Purchase Admin', '$2a$10$dummy', 'Local', true, 'dept-it', NOW(), NOW()),
  ('user-store', 'storemanager@tyson.com', 'Store Manager', '$2a$10$dummy', 'Local', true, 'dept-it', NOW(), NOW()),
  ('user-manager', 'manager@tyson.com', 'John Manager', '$2a$10$dummy', 'Local', true, 'dept-ops', NOW(), NOW()),
  ('user-emp1', 'john@tyson.com', 'John Smith', '$2a$10$dummy', 'Local', true, 'dept-ops', NOW(), NOW()),
  ('user-emp2', 'jane@tyson.com', 'Jane Doe', '$2a$10$dummy', 'Local', true, 'dept-ops', NOW(), NOW());

-- Update manager relationship
UPDATE "users" SET "managerId" = 'user-manager' WHERE "id" IN ('user-emp1', 'user-emp2');

-- Insert User Roles
INSERT INTO "user_roles" ("id", "userId", "roleId", "createdAt") VALUES
  ('ur-admin', 'user-admin', 'role-super-admin', NOW()),
  ('ur-purchaser', 'user-purchaser', 'role-purchase-admin', NOW()),
  ('ur-store', 'user-store', 'role-store-admin', NOW()),
  ('ur-manager', 'user-manager', 'role-hr-manager', NOW()),
  ('ur-emp1', 'user-emp1', 'role-end-user', NOW()),
  ('ur-emp2', 'user-emp2', 'role-end-user', NOW());

-- Insert Asset Types
INSERT INTO "asset_types" ("id", "name", "code", "description", "isActive", "createdAt") VALUES
  ('type-laptop', 'Laptop', 'LAP', 'Portable computers for employees', true, NOW()),
  ('type-monitor', 'Monitor', 'MON', 'Display monitors', true, NOW()),
  ('type-keyboard', 'Keyboard', 'KEY', 'Input devices', true, NOW());

-- Insert Asset Names
INSERT INTO "asset_names" ("id", "name", "manufacturer", "assetTypeId", "defaultSpecs", "defaultWarrantyMonths", "isActive", "createdAt") VALUES
  ('aname-dell-lat', 'Dell Latitude 5440', 'Dell', 'type-laptop', 'i7, 16GB RAM, 512GB SSD', 12, true, NOW()),
  ('aname-macbook', 'MacBook Pro 14', 'Apple', 'type-laptop', 'M3 Pro, 16GB RAM, 512GB SSD', 12, true, NOW()),
  ('aname-dell-mon', 'Dell U2724D', 'Dell', 'type-monitor', '4K, USB-C', 3, true, NOW());

-- Insert Vendors
INSERT INTO "vendors" ("id", "name", "code", "contactInfo", "isActive", "createdAt") VALUES
  ('vendor-dell', 'Dell Technologies', 'DELL', 'sales@dell.com', true, NOW()),
  ('vendor-apple', 'Apple Inc', 'APPLE', 'sales@apple.com', true, NOW()),
  ('vendor-logi', 'Logitech', 'LOGI', 'sales@logitech.com', true, NOW());

-- Insert Locations
INSERT INTO "locations" ("id", "name", "code", "site", "address", "isActive", "createdAt") VALUES
  ('loc-hq', 'Corporate HQ', 'HQ', 'Springfield', '123 Main St, Springfield, IL', true, NOW()),
  ('loc-dc', 'Distribution Center', 'DC', 'Chicago', '456 Industrial Ave, Chicago, IL', true, NOW());

-- Insert Assets
INSERT INTO "assets" ("id", "assetTag", "assetNameId", "typeId", "serialNum", "status", "condition", "currentHolder", "locationId", "purchaseCost", "warrantyStart", "warrantyEnd", "createdAt", "updatedAt") VALUES
  ('asset-1', 'TYS-LAP-00001', 'aname-dell-lat', 'type-laptop', 'DLL001', 'Assigned', 'Good', 'user-emp1', 'loc-hq', 1200.0, NOW(), NOW() + INTERVAL '1 year', NOW(), NOW()),
  ('asset-2', 'TYS-LAP-00002', 'aname-dell-lat', 'type-laptop', 'DLL002', 'Assigned', 'Good', 'user-emp2', 'loc-hq', 1200.0, NOW(), NOW() + INTERVAL '1 year', NOW(), NOW()),
  ('asset-3', 'TYS-LAP-00003', 'aname-dell-lat', 'type-laptop', 'DLL003', 'Available', 'Good', NULL, 'loc-hq', 1200.0, NOW(), NOW() + INTERVAL '1 year', NOW(), NOW()),
  ('asset-4', 'TYS-MON-00001', 'aname-dell-mon', 'type-monitor', 'MON001', 'Assigned', 'Good', 'user-emp1', 'loc-hq', 500.0, NOW(), NOW() + INTERVAL '3 months', NOW(), NOW());

-- Insert Asset Movements
INSERT INTO "asset_movements" ("id", "assetId", "action", "toStatus", "performedBy", "notes", "createdAt") VALUES
  ('mov-1', 'asset-1', 'StockIn', 'Available', 'user-purchaser', 'Received from Dell', NOW()),
  ('mov-2', 'asset-1', 'Allocate', 'Assigned', 'user-store', 'Allocated to John Smith', NOW()),
  ('mov-3', 'asset-2', 'StockIn', 'Available', 'user-purchaser', 'Received from Dell', NOW()),
  ('mov-4', 'asset-2', 'Allocate', 'Assigned', 'user-store', 'Allocated to Jane Doe', NOW()),
  ('mov-5', 'asset-4', 'StockIn', 'Available', 'user-purchaser', 'Received from Dell', NOW()),
  ('mov-6', 'asset-4', 'Allocate', 'Assigned', 'user-store', 'Allocated to John Smith', NOW());
