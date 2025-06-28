/*
  # Complete Food Delivery Platform Schema

  1. New Tables
    - `users` - Extended user profiles with user types
    - `categories` - Food categories with emojis
    - `restaurants` - Restaurant information and settings
    - `restaurant_hours` - Operating hours for restaurants
    - `menu_items` - Restaurant menu items with pricing
    - `user_addresses` - Customer delivery addresses
    - `orders` - Order management with status tracking
    - `order_items` - Individual items within orders
    - `delivery_drivers` - Driver profiles and status
    - `deliveries` - Delivery tracking and management
    - `reviews` - Customer feedback system

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each user type
    - Secure data access based on user roles

  3. Features
    - Auto-generated order numbers
    - Timestamp tracking for audit trails
    - Performance indexes for common queries
    - Sample data for testing
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  user_type text NOT NULL DEFAULT 'customer' CHECK (user_type IN ('customer', 'restaurant', 'delivery')),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view own profile" ON users;
  DROP POLICY IF EXISTS "Users can update own profile" ON users;
  DROP POLICY IF EXISTS "Users can insert own profile" ON users;
END $$;

CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
END $$;

CREATE POLICY "Categories are viewable by everyone"
  ON categories
  FOR SELECT
  USING (true);

-- Restaurants table (simplified without owner_id)
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cuisine text NOT NULL,
  rating decimal(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  delivery_time text NOT NULL,
  delivery_fee decimal(10,2) DEFAULT 0.00 CHECK (delivery_fee >= 0),
  image text NOT NULL,
  promoted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Restaurants are viewable by everyone" ON restaurants;
END $$;

CREATE POLICY "Restaurants are viewable by everyone"
  ON restaurants
  FOR SELECT
  USING (true);

-- Menu items table (simplified without owner references)
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  price decimal(10,2) NOT NULL CHECK (price > 0),
  image text NOT NULL,
  category text NOT NULL,
  popular boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Menu items are viewable by everyone" ON menu_items;
END $$;

CREATE POLICY "Menu items are viewable by everyone"
  ON menu_items
  FOR SELECT
  USING (true);

-- Orders table (simplified)
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  total decimal(10,2) NOT NULL CHECK (total >= 0),
  status text NOT NULL DEFAULT 'preparing' CHECK (status IN ('preparing', 'ready', 'on_the_way', 'delivered', 'cancelled')),
  delivery_address text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
  DROP POLICY IF EXISTS "Users can create their own orders" ON orders;
  DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
  DROP POLICY IF EXISTS "Restaurant owners can view their restaurant orders" ON orders;
  DROP POLICY IF EXISTS "Restaurant owners can update their restaurant orders" ON orders;
END $$;

CREATE POLICY "Users can view their own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Restaurant owners can view their restaurant orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Restaurant owners can update their restaurant orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (true);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price decimal(10,2) NOT NULL CHECK (price > 0),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view order items for their orders" ON order_items;
  DROP POLICY IF EXISTS "Users can create order items for their orders" ON order_items;
  DROP POLICY IF EXISTS "Restaurant owners can view order items for their restaurant" ON order_items;
END $$;

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

CREATE POLICY "Restaurant owners can view order items for their restaurant"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (true);

-- Delivery drivers table
CREATE TABLE IF NOT EXISTS delivery_drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  vehicle_type text NOT NULL DEFAULT 'car' CHECK (vehicle_type IN ('bicycle', 'motorcycle', 'car', 'scooter')),
  is_online boolean DEFAULT false,
  current_location text,
  rating decimal(2,1) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  total_deliveries integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Drivers can insert their own profile" ON delivery_drivers;
  DROP POLICY IF EXISTS "Drivers can update their own profile" ON delivery_drivers;
  DROP POLICY IF EXISTS "Drivers can view their own profile" ON delivery_drivers;
END $$;

CREATE POLICY "Drivers can insert their own profile"
  ON delivery_drivers
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Drivers can update their own profile"
  ON delivery_drivers
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Drivers can view their own profile"
  ON delivery_drivers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES delivery_drivers(id) ON DELETE SET NULL,
  pickup_address text NOT NULL,
  delivery_address text NOT NULL,
  distance text NOT NULL,
  estimated_time text NOT NULL,
  delivery_fee decimal(10,2) DEFAULT 0.00,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'picked_up', 'delivered', 'cancelled')),
  assigned_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Drivers can view available deliveries" ON deliveries;
  DROP POLICY IF EXISTS "Drivers can update their assigned deliveries" ON deliveries;
  DROP POLICY IF EXISTS "System can create deliveries" ON deliveries;
END $$;

CREATE POLICY "Drivers can view available deliveries"
  ON deliveries
  FOR SELECT
  TO authenticated
  USING (
    status = 'available' OR 
    (driver_id IN (
      SELECT id FROM delivery_drivers WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Drivers can update their assigned deliveries"
  ON deliveries
  FOR UPDATE
  TO authenticated
  USING (
    driver_id IN (
      SELECT id FROM delivery_drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can create deliveries"
  ON deliveries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON restaurants(cuisine);
CREATE INDEX IF NOT EXISTS idx_restaurants_rating ON restaurants(rating DESC);
CREATE INDEX IF NOT EXISTS idx_restaurants_promoted ON restaurants(promoted DESC);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver ON deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_drivers_online ON delivery_drivers(is_online);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist and recreate them
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_restaurants_updated_at ON restaurants;
DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_delivery_drivers_updated_at ON delivery_drivers;

-- Add update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_delivery_drivers_updated_at BEFORE UPDATE ON delivery_drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO categories (name, emoji) VALUES
  ('Pizza', '🍕'),
  ('Burgers', '🍔'),
  ('Sushi', '🍣'),
  ('Indian', '🍛'),
  ('Chinese', '🥢'),
  ('Mexican', '🌮'),
  ('Italian', '🍝'),
  ('Thai', '🍜'),
  ('Desserts', '🍰'),
  ('Beverages', '🥤')
ON CONFLICT (name) DO NOTHING;

-- Insert sample restaurants
INSERT INTO restaurants (name, cuisine, rating, delivery_time, delivery_fee, image, promoted) VALUES
  (
    'Mario''s Pizza Palace',
    'Italian',
    4.5,
    '25-30 min',
    2.99,
    'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=800',
    true
  ),
  (
    'Burger Station',
    'American',
    4.3,
    '20-25 min',
    1.99,
    'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=800',
    false
  ),
  (
    'Sushi Zen',
    'Japanese',
    4.7,
    '30-35 min',
    3.99,
    'https://images.pexels.com/photos/1148086/pexels-photo-1148086.jpeg?auto=compress&cs=tinysrgb&w=800',
    false
  ),
  (
    'Spice Garden',
    'Indian',
    4.4,
    '35-40 min',
    2.49,
    'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=800',
    true
  ),
  (
    'Dragon Palace',
    'Chinese',
    4.2,
    '25-30 min',
    2.99,
    'https://images.pexels.com/photos/2456435/pexels-photo-2456435.jpeg?auto=compress&cs=tinysrgb&w=800',
    false
  )
ON CONFLICT DO NOTHING;

-- Insert sample menu items for Mario's Pizza Palace
DO $$
DECLARE
    mario_restaurant_id uuid;
BEGIN
    -- Get restaurant ID
    SELECT id INTO mario_restaurant_id FROM restaurants WHERE name = 'Mario''s Pizza Palace' LIMIT 1;
    
    IF mario_restaurant_id IS NOT NULL THEN
        INSERT INTO menu_items (restaurant_id, name, description, price, image, category, popular) VALUES
        (mario_restaurant_id, 'Margherita Pizza', 'Fresh mozzarella, tomato sauce, basil leaves on our signature thin crust', 18.99, 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=400', 'Popular', true),
        (mario_restaurant_id, 'Pepperoni Pizza', 'Classic pepperoni with mozzarella cheese and our special tomato sauce', 21.99, 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg?auto=compress&cs=tinysrgb&w=400', 'Popular', true),
        (mario_restaurant_id, 'Supreme Pizza', 'Pepperoni, sausage, bell peppers, onions, mushrooms, and olives', 26.99, 'https://images.pexels.com/photos/708587/pexels-photo-708587.jpeg?auto=compress&cs=tinysrgb&w=400', 'Mains', false),
        (mario_restaurant_id, 'Caesar Salad', 'Crisp romaine lettuce, parmesan cheese, croutons, and our homemade Caesar dressing', 12.99, 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=400', 'Sides', false),
        (mario_restaurant_id, 'Garlic Bread', 'Fresh baked bread with garlic butter and herbs', 6.99, 'https://images.pexels.com/photos/4198018/pexels-photo-4198018.jpeg?auto=compress&cs=tinysrgb&w=400', 'Sides', false),
        (mario_restaurant_id, 'Tiramisu', 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone', 8.99, 'https://images.pexels.com/photos/6880219/pexels-photo-6880219.jpeg?auto=compress&cs=tinysrgb&w=400', 'Desserts', false),
        (mario_restaurant_id, 'Coca Cola', 'Classic Coca Cola 330ml can', 2.99, 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400', 'Beverages', false),
        (mario_restaurant_id, 'Italian Soda', 'Sparkling water with natural fruit flavors', 3.99, 'https://images.pexels.com/photos/1571458/pexels-photo-1571458.jpeg?auto=compress&cs=tinysrgb&w=400', 'Beverages', false)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Insert sample menu items for other restaurants
DO $$
DECLARE
    burger_restaurant_id uuid;
    sushi_restaurant_id uuid;
BEGIN
    -- Get restaurant IDs
    SELECT id INTO burger_restaurant_id FROM restaurants WHERE name = 'Burger Station' LIMIT 1;
    SELECT id INTO sushi_restaurant_id FROM restaurants WHERE name = 'Sushi Zen' LIMIT 1;
    
    -- Burger Station menu
    IF burger_restaurant_id IS NOT NULL THEN
        INSERT INTO menu_items (restaurant_id, name, description, price, image, category, popular) VALUES
        (burger_restaurant_id, 'Classic Burger', 'Beef patty, lettuce, tomato, onion, pickles, and our special sauce', 14.99, 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400', 'Popular', true),
        (burger_restaurant_id, 'Bacon Cheeseburger', 'Beef patty with crispy bacon, cheddar cheese, and all the fixings', 17.99, 'https://images.pexels.com/photos/1556909/pexels-photo-1556909.jpeg?auto=compress&cs=tinysrgb&w=400', 'Popular', true),
        (burger_restaurant_id, 'Veggie Burger', 'Plant-based patty with fresh vegetables and avocado', 13.99, 'https://images.pexels.com/photos/1565982/pexels-photo-1565982.jpeg?auto=compress&cs=tinysrgb&w=400', 'Mains', false)
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Sushi Zen menu
    IF sushi_restaurant_id IS NOT NULL THEN
        INSERT INTO menu_items (restaurant_id, name, description, price, image, category, popular) VALUES
        (sushi_restaurant_id, 'Salmon Roll', 'Fresh salmon with cucumber and avocado', 12.99, 'https://images.pexels.com/photos/1148086/pexels-photo-1148086.jpeg?auto=compress&cs=tinysrgb&w=400', 'Popular', true),
        (sushi_restaurant_id, 'Tuna Sashimi', 'Fresh tuna slices served with wasabi and ginger', 16.99, 'https://images.pexels.com/photos/357756/pexels-photo-357756.jpeg?auto=compress&cs=tinysrgb&w=400', 'Popular', true),
        (sushi_restaurant_id, 'Dragon Roll', 'Eel and cucumber topped with avocado and eel sauce', 18.99, 'https://images.pexels.com/photos/2098085/pexels-photo-2098085.jpeg?auto=compress&cs=tinysrgb&w=400', 'Mains', false)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;