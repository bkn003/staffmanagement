/*
  # Add Locations and Salary Categories Tables

  1. New Tables
    - `locations`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `display_name` (text)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `salary_categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `display_name` (text)
      - `is_active` (boolean, default true)
      - `sort_order` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Allow authenticated users to read
    - Allow only authenticated users to insert/update/delete

  3. Initial Data
    - Insert default locations: Godown, Big Shop, Small Shop
    - Insert default salary categories: Basic Salary, Incentive, HRA
*/

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create salary_categories table
CREATE TABLE IF NOT EXISTS salary_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_categories ENABLE ROW LEVEL SECURITY;

-- Policies for locations
CREATE POLICY "Allow authenticated users to read locations"
  ON locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert locations"
  ON locations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update locations"
  ON locations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete locations"
  ON locations FOR DELETE
  TO authenticated
  USING (true);

-- Policies for salary_categories
CREATE POLICY "Allow authenticated users to read salary categories"
  ON salary_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert salary categories"
  ON salary_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update salary categories"
  ON salary_categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete salary categories"
  ON salary_categories FOR DELETE
  TO authenticated
  USING (true);

-- Insert default locations
INSERT INTO locations (name, display_name) VALUES
  ('godown', 'Godown'),
  ('big_shop', 'Big Shop'),
  ('small_shop', 'Small Shop')
ON CONFLICT (name) DO NOTHING;

-- Insert default salary categories
INSERT INTO salary_categories (name, display_name, sort_order) VALUES
  ('basic_salary', 'Basic Salary', 1),
  ('incentive', 'Incentive', 2),
  ('hra', 'HRA', 3)
ON CONFLICT (name) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_locations_is_active ON locations(is_active);
CREATE INDEX IF NOT EXISTS idx_salary_categories_is_active ON salary_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_salary_categories_sort_order ON salary_categories(sort_order);
