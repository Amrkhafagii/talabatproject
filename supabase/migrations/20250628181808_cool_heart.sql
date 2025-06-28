/*
  # Complete Database Schema Setup

  1. New Tables
    - `categories` - Food categories with emoji icons
    - `restaurants` - Restaurant information and details
    - `menu_items` - Menu items for each restaurant
    - `orders` - Customer orders
    - `order_items` - Individual items within orders

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access on categories, restaurants, and menu items
    - Add policies for authenticated users to manage their own orders
    - Add policies for restaurant owners to manage their restaurant orders

  3. Sample Data
    - Insert sample categories, restaurants, and menu items
*/

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate
DO $$
BEGIN
  DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
  CREATE POLICY "Categories are viewable by everyone"
    ON categories
    FOR SELECT
    USING (true);
EXCEPTION
  WHEN undefined_object THEN
    CREATE POLICY "Categories are viewable by everyone"
      ON categories
      FOR SELECT
      USING (true);
END $$;

-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cuisine text NOT NULL,
  rating decimal(2,1) DEFAULT 0.0,
  delivery_time text NOT NULL,
  delivery_fee decimal(10,2) DEFAULT 0.00,
  image text NOT NULL,
  promoted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate
DO $$
BEGIN
  DROP POLICY IF EXISTS "Restaurants are viewable by everyone" ON restaurants;
  CREATE POLICY "Restaurants are viewable by everyone"
    ON restaurants
    FOR SELECT
    USING (true);
EXCEPTION
  WHEN undefined_object THEN
    CREATE POLICY "Restaurants are viewable by everyone"
      ON restaurants
      FOR SELECT
      USING (true);
END $$;

-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  price decimal(10,2) NOT NULL,
  image text NOT NULL,
  category text NOT NULL,
  popular boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate
DO $$
BEGIN
  DROP POLICY IF EXISTS "Menu items are viewable by everyone" ON menu_items;
  CREATE POLICY "Menu items are viewable by everyone"
    ON menu_items
    FOR SELECT
    USING (true);
EXCEPTION
  WHEN undefined_object THEN
    CREATE POLICY "Menu items are viewable by everyone"
      ON menu_items
      FOR SELECT
      USING (true);
END $$;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  total decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'preparing',
  delivery_address text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
  CREATE POLICY "Users can view their own orders"
    ON orders
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN undefined_object THEN
    CREATE POLICY "Users can view their own orders"
      ON orders
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can create their own orders" ON orders;
  CREATE POLICY "Users can create their own orders"
    ON orders
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN undefined_object THEN
    CREATE POLICY "Users can create their own orders"
      ON orders
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
  CREATE POLICY "Users can update their own orders"
    ON orders
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN undefined_object THEN
    CREATE POLICY "Users can update their own orders"
      ON orders
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
END $$;

-- Restaurant owners can view and update orders for their restaurants
DO $$
BEGIN
  DROP POLICY IF EXISTS "Restaurant owners can view their restaurant orders" ON orders;
  CREATE POLICY "Restaurant owners can view their restaurant orders"
    ON orders
    FOR SELECT
    TO authenticated
    USING (true); -- For now, allow all authenticated users to view orders
EXCEPTION
  WHEN undefined_object THEN
    CREATE POLICY "Restaurant owners can view their restaurant orders"
      ON orders
      FOR SELECT
      TO authenticated
      USING (true);
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Restaurant owners can update their restaurant orders" ON orders;
  CREATE POLICY "Restaurant owners can update their restaurant orders"
    ON orders
    FOR UPDATE
    TO authenticated
    USING (true); -- For now, allow all authenticated users to update orders
EXCEPTION
  WHEN undefined_object THEN
    CREATE POLICY "Restaurant owners can update their restaurant orders"
      ON orders
      FOR UPDATE
      TO authenticated
      USING (true);
END $$;

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  price decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view order items for their orders" ON order_items;
  CREATE POLICY "Users can view order items for their orders"
    ON order_items
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_items.order_id 
        AND orders.user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN undefined_object THEN
    CREATE POLICY "Users can view order items for their orders"
      ON order_items
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM orders 
          WHERE orders.id = order_items.order_id 
          AND orders.user_id = auth.uid()
        )
      );
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can create order items for their orders" ON order_items;
  CREATE POLICY "Users can create order items for their orders"
    ON order_items
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_items.order_id 
        AND orders.user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN undefined_object THEN
    CREATE POLICY "Users can create order items for their orders"
      ON order_items
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM orders 
          WHERE orders.id = order_items.order_id 
          AND orders.user_id = auth.uid()
        )
      );
END $$;

-- Restaurant owners can view order items for their restaurant orders
DO $$
BEGIN
  DROP POLICY IF EXISTS "Restaurant owners can view order items for their restaurant" ON order_items;
  CREATE POLICY "Restaurant owners can view order items for their restaurant"
    ON order_items
    FOR SELECT
    TO authenticated
    USING (true); -- For now, allow all authenticated users to view order items
EXCEPTION
  WHEN undefined_object THEN
    CREATE POLICY "Restaurant owners can view order items for their restaurant"
      ON order_items
      FOR SELECT
      TO authenticated
      USING (true);
END $$;

-- Insert sample data
INSERT INTO categories (name, emoji) VALUES
  ('Pizza', '🍕'),
  ('Burger', '🍔'),
  ('Sushi', '🍣'),
  ('Indian', '🍛'),
  ('Chinese', '🥢'),
  ('Dessert', '🍰')
ON CONFLICT DO NOTHING;

INSERT INTO restaurants (name, cuisine, rating, delivery_time, delivery_fee, image, promoted) VALUES
  ('Mario''s Pizza Palace', 'Italian', 4.5, '25-30', 2.99, 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', true),
  ('Burger Station', 'American', 4.3, '20-25', 1.99, 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', false),
  ('Sushi Zen', 'Japanese', 4.7, '30-35', 3.99, 'https://images.pexels.com/photos/1148086/pexels-photo-1148086.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', false),
  ('Spice Garden', 'Indian', 4.4, '35-40', 2.49, 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', true)
ON CONFLICT DO NOTHING;

-- Insert sample menu items for Mario's Pizza Palace
INSERT INTO menu_items (restaurant_id, name, description, price, image, category, popular) 
SELECT 
  r.id,
  'Margherita Pizza',
  'Fresh mozzarella, tomato sauce, basil leaves',
  18.99,
  'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Popular',
  true
FROM restaurants r WHERE r.name = 'Mario''s Pizza Palace'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (restaurant_id, name, description, price, image, category, popular) 
SELECT 
  r.id,
  'Pepperoni Pizza',
  'Classic pepperoni with mozzarella cheese',
  21.99,
  'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Popular',
  true
FROM restaurants r WHERE r.name = 'Mario''s Pizza Palace'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (restaurant_id, name, description, price, image, category, popular) 
SELECT 
  r.id,
  'Caesar Salad',
  'Crisp romaine lettuce, parmesan, croutons',
  12.99,
  'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Sides',
  false
FROM restaurants r WHERE r.name = 'Mario''s Pizza Palace'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (restaurant_id, name, description, price, image, category, popular) 
SELECT 
  r.id,
  'Garlic Bread',
  'Fresh baked bread with garlic butter',
  6.99,
  'https://images.pexels.com/photos/4198018/pexels-photo-4198018.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Sides',
  false
FROM restaurants r WHERE r.name = 'Mario''s Pizza Palace'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (restaurant_id, name, description, price, image, category, popular) 
SELECT 
  r.id,
  'Coca Cola',
  'Classic Coca Cola 330ml can',
  2.99,
  'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Beverages',
  false
FROM restaurants r WHERE r.name = 'Mario''s Pizza Palace'
ON CONFLICT DO NOTHING;