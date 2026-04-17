-- ============================================================
-- RESET — drop everything before re-running the schema
-- Run this first, then run 001_schema.sql
-- ============================================================

DROP TABLE IF EXISTS reviews    CASCADE;
DROP TABLE IF EXISTS pc_builds  CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS orders     CASCADE;
DROP TABLE IF EXISTS products   CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles   CASCADE;

DROP SEQUENCE IF EXISTS order_seq CASCADE;

DROP FUNCTION IF EXISTS handle_new_user()   CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS is_admin()          CASCADE;
