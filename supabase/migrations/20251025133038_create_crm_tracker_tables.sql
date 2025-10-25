/*
  # CRM Machine Tracker Database Schema

  1. New Tables
    - `chc_centers`
      - `id` (uuid, primary key)
      - `name` (text)
      - `location_lat` (numeric)
      - `location_lng` (numeric)
      - `created_at` (timestamptz)
    
    - `machines`
      - `id` (uuid, primary key)
      - `machine_id` (text, unique) - Human-readable ID like CRM-2024-0001
      - `name` (text)
      - `type` (text) - Tractor, Harvester, Baler, Seeder, Plough
      - `status` (text) - in_use, idle, maintenance
      - `fuel_level` (integer) - 0-100
      - `total_hours` (integer) - Total operational hours
      - `location_lat` (numeric)
      - `location_lng` (numeric)
      - `chc_id` (uuid, foreign key)
      - `last_active` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `alerts`
      - `id` (uuid, primary key)
      - `machine_id` (uuid, foreign key)
      - `type` (text) - error, warning
      - `message` (text)
      - `is_read` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read all data
    - Add policies for authenticated users to insert/update machines and alerts

  3. Indexes
    - Add indexes on frequently queried columns for performance
*/

-- Create CHC Centers table
CREATE TABLE IF NOT EXISTS chc_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location_lat numeric(10, 6) NOT NULL,
  location_lng numeric(10, 6) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create Machines table
CREATE TABLE IF NOT EXISTS machines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id text UNIQUE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('Tractor', 'Harvester', 'Baler', 'Seeder', 'Plough')),
  status text NOT NULL DEFAULT 'idle' CHECK (status IN ('in_use', 'idle', 'maintenance')),
  fuel_level integer NOT NULL DEFAULT 100 CHECK (fuel_level >= 0 AND fuel_level <= 100),
  total_hours integer NOT NULL DEFAULT 0,
  location_lat numeric(10, 6) NOT NULL,
  location_lng numeric(10, 6) NOT NULL,
  chc_id uuid REFERENCES chc_centers(id),
  last_active timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid REFERENCES machines(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('error', 'warning')),
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE chc_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for CHC Centers
CREATE POLICY "Anyone can view CHC centers"
  ON chc_centers FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert CHC centers"
  ON chc_centers FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for Machines
CREATE POLICY "Anyone can view machines"
  ON machines FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert machines"
  ON machines FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update machines"
  ON machines FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for Alerts
CREATE POLICY "Anyone can view alerts"
  ON alerts FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert alerts"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update alerts"
  ON alerts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_machines_status ON machines(status);
CREATE INDEX IF NOT EXISTS idx_machines_chc_id ON machines(chc_id);
CREATE INDEX IF NOT EXISTS idx_machines_last_active ON machines(last_active);
CREATE INDEX IF NOT EXISTS idx_alerts_machine_id ON alerts(machine_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for machines table
DROP TRIGGER IF EXISTS update_machines_updated_at ON machines;
CREATE TRIGGER update_machines_updated_at
  BEFORE UPDATE ON machines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();