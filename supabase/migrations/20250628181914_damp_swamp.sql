/*
  # Add Delivery System

  1. New Tables
    - `delivery_drivers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text)
      - `phone` (text)
      - `vehicle_type` (text)
      - `is_online` (boolean)
      - `current_location` (text, optional)
      - `rating` (decimal)
      - `total_deliveries` (integer)
      - `created_at` (timestamp)

    - `deliveries`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `driver_id` (uuid, foreign key to delivery_drivers)
      - `pickup_address` (text)
      - `delivery_address` (text)
      - `distance` (text)
      - `estimated_time` (text)
      - `delivery_fee` (decimal)
      - `status` (text: available, assigned, picked_up, delivered)
      - `assigned_at` (timestamp)
      - `picked_up_at` (timestamp)
      - `delivered_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for drivers to manage their own data
    - Add policies for viewing available deliveries
*/

-- Delivery drivers table
CREATE TABLE IF NOT EXISTS delivery_drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  vehicle_type text NOT NULL DEFAULT 'car',
  is_online boolean DEFAULT false,
  current_location text,
  rating decimal(2,1) DEFAULT 5.0,
  total_deliveries integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DO $$
BEGIN
  DROP POLICY IF EXISTS "Drivers can view their own profile" ON delivery_drivers;
  CREATE POLICY "Drivers can view their own profile"
    ON delivery_drivers
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN undefined_object THEN
    CREATE POLICY "Drivers can view their own profile"
      ON delivery_drivers
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Drivers can update their own profile" ON delivery_drivers;
  CREATE POLICY "Drivers can update their own profile"
    ON delivery_drivers
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN undefined_object THEN
    CREATE POLICY "Drivers can update their own profile"
      ON delivery_drivers
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Drivers can insert their own profile" ON delivery_drivers;
  CREATE POLICY "Drivers can insert their own profile"
    ON delivery_drivers
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN undefined_object THEN
    CREATE POLICY "Drivers can insert their own profile"
      ON delivery_drivers
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
END $$;

-- Deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES delivery_drivers(id) ON DELETE SET NULL,
  pickup_address text NOT NULL,
  delivery_address text NOT NULL,
  distance text NOT NULL,
  estimated_time text NOT NULL,
  delivery_fee decimal(10,2) NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'available',
  assigned_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DO $$
BEGIN
  DROP POLICY IF EXISTS "Drivers can view available deliveries" ON deliveries;
  CREATE POLICY "Drivers can view available deliveries"
    ON deliveries
    FOR SELECT
    TO authenticated
    USING (
      status = 'available' OR 
      driver_id IN (
        SELECT id FROM delivery_drivers WHERE user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN undefined_object THEN
    CREATE POLICY "Drivers can view available deliveries"
      ON deliveries
      FOR SELECT
      TO authenticated
      USING (
        status = 'available' OR 
        driver_id IN (
          SELECT id FROM delivery_drivers WHERE user_id = auth.uid()
        )
      );
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Drivers can update their assigned deliveries" ON deliveries;
  CREATE POLICY "Drivers can update their assigned deliveries"
    ON deliveries
    FOR UPDATE
    TO authenticated
    USING (
      driver_id IN (
        SELECT id FROM delivery_drivers WHERE user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN undefined_object THEN
    CREATE POLICY "Drivers can update their assigned deliveries"
      ON deliveries
      FOR UPDATE
      TO authenticated
      USING (
        driver_id IN (
          SELECT id FROM delivery_drivers WHERE user_id = auth.uid()
        )
      );
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "System can create deliveries" ON deliveries;
  CREATE POLICY "System can create deliveries"
    ON deliveries
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
EXCEPTION
  WHEN undefined_object THEN
    CREATE POLICY "System can create deliveries"
      ON deliveries
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
END $$;

-- Insert sample delivery driver
INSERT INTO delivery_drivers (user_id, name, phone, vehicle_type, is_online, current_location, rating, total_deliveries)
SELECT 
  auth.uid(),
  'John Driver',
  '+1 (555) 123-4567',
  'car',
  true,
  'Downtown Area',
  4.9,
  147
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

-- Create sample deliveries for testing
INSERT INTO deliveries (order_id, pickup_address, delivery_address, distance, estimated_time, delivery_fee, status)
SELECT 
  o.id,
  CASE 
    WHEN r.name = 'Mario''s Pizza Palace' THEN '456 Restaurant St'
    WHEN r.name = 'Burger Station' THEN '789 Food Ave'
    WHEN r.name = 'Sushi Zen' THEN '321 Sushi Blvd'
    ELSE '123 Kitchen Rd'
  END,
  o.delivery_address,
  CASE 
    WHEN RANDOM() < 0.5 THEN '2.1 miles'
    ELSE '1.8 miles'
  END,
  CASE 
    WHEN RANDOM() < 0.5 THEN '18 min'
    ELSE '15 min'
  END,
  CASE 
    WHEN o.total > 50 THEN 12.50
    WHEN o.total > 30 THEN 9.75
    ELSE 7.25
  END,
  CASE 
    WHEN o.status = 'ready' THEN 'available'
    WHEN o.status = 'on_the_way' THEN 'picked_up'
    ELSE 'available'
  END
FROM orders o
JOIN restaurants r ON o.restaurant_id = r.id
WHERE o.status IN ('ready', 'on_the_way')
ON CONFLICT DO NOTHING;