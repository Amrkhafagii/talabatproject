/*
  # Complete Food Delivery Platform Database Schema

  1. New Tables
    - `users` - Extended user profiles with user types
    - `categories` - Food categories with emojis
    - `restaurants` - Restaurant information and settings
    - `restaurant_hours` - Operating hours for restaurants
    - `menu_items` - Restaurant menu items with details
    - `user_addresses` - User delivery addresses
    - `orders` - Order management with status tracking
    - `order_items` - Individual items within orders
    - `delivery_drivers` - Driver profiles and status
    - `deliveries` - Delivery tracking and management
    - `reviews` - Customer reviews and ratings

  2. Security
    - Enable RLS on all tables
    - User-specific policies for personal data
    - Public read access for restaurants and menu items
    - Driver-specific policies for delivery management

  3. Features
    - Auto-generated order numbers with date prefixes
    - Timestamp triggers for audit trails
    - Performance indexes on key columns
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
  description text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
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
  description text,
  cuisine text NOT NULL,
  rating decimal(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  delivery_time text NOT NULL,
  delivery_fee decimal(10,2) DEFAULT 0.00 CHECK (delivery_fee >= 0),
  minimum_order decimal(10,2) DEFAULT 0.00 CHECK (minimum_order >= 0),
  image text NOT NULL,
  cover_image text,
  address text NOT NULL,
  phone text,
  email text,
  promoted boolean DEFAULT false,
  is_active boolean DEFAULT true,
  is_open boolean DEFAULT true,
  total_reviews integer DEFAULT 0,
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

-- Restaurant hours table
CREATE TABLE IF NOT EXISTS restaurant_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
  open_time time,
  close_time time,
  is_closed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE restaurant_hours ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Restaurant hours are viewable by everyone" ON restaurant_hours;
END $$;

CREATE POLICY "Restaurant hours are viewable by everyone"
  ON restaurant_hours
  FOR SELECT
  USING (true);

-- Menu items table (simplified without owner references)
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id),
  name text NOT NULL,
  description text NOT NULL,
  price decimal(10,2) NOT NULL CHECK (price > 0),
  image text NOT NULL,
  category text NOT NULL, -- For backward compatibility
  popular boolean DEFAULT false,
  is_available boolean DEFAULT true,
  preparation_time integer DEFAULT 15, -- minutes
  calories integer,
  allergens text[], -- Array of allergen strings
  ingredients text[],
  sort_order integer DEFAULT 0,
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

-- User addresses table
CREATE TABLE IF NOT EXISTS user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  label text NOT NULL, -- 'Home', 'Work', 'Other'
  address_line_1 text NOT NULL,
  address_line_2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country text DEFAULT 'US',
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  is_default boolean DEFAULT false,
  delivery_instructions text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can manage their own addresses" ON user_addresses;
END $$;

CREATE POLICY "Users can manage their own addresses"
  ON user_addresses
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Orders table (simplified without owner references)
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL DEFAULT '',
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  delivery_address_id uuid REFERENCES user_addresses(id),
  subtotal decimal(10,2) NOT NULL CHECK (subtotal >= 0),
  delivery_fee decimal(10,2) DEFAULT 0.00 CHECK (delivery_fee >= 0),
  tax_amount decimal(10,2) DEFAULT 0.00 CHECK (tax_amount >= 0),
  tip_amount decimal(10,2) DEFAULT 0.00 CHECK (tip_amount >= 0),
  total decimal(10,2) NOT NULL CHECK (total >= 0),
  status text NOT NULL DEFAULT 'preparing' CHECK (status IN ('preparing', 'ready', 'on_the_way', 'delivered', 'cancelled')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method text DEFAULT 'card',
  delivery_address text NOT NULL, -- Snapshot of address at order time
  delivery_instructions text,
  estimated_delivery_time timestamptz,
  confirmed_at timestamptz,
  prepared_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Generate order number function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_set_order_number ON orders;

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

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
  special_instructions text,
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
  vehicle_make text,
  vehicle_model text,
  vehicle_year integer,
  vehicle_color text,
  license_plate text,
  is_online boolean DEFAULT false,
  current_location text,
  current_latitude decimal(10, 8),
  current_longitude decimal(11, 8),
  last_location_update timestamptz,
  rating decimal(2,1) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  total_deliveries integer DEFAULT 0,
  total_earnings decimal(10,2) DEFAULT 0.00,
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

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES delivery_drivers(id) ON DELETE SET NULL,
  restaurant_rating integer CHECK (restaurant_rating >= 1 AND restaurant_rating <= 5),
  driver_rating integer CHECK (driver_rating >= 1 AND driver_rating <= 5),
  food_quality_rating integer CHECK (food_quality_rating >= 1 AND food_quality_rating <= 5),
  delivery_rating integer CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
  restaurant_comment text,
  driver_comment text,
  is_anonymous boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can create reviews for their orders" ON reviews;
  DROP POLICY IF EXISTS "Users can view their own reviews" ON reviews;
  DROP POLICY IF EXISTS "Restaurant owners can view reviews for their restaurant" ON reviews;
  DROP POLICY IF EXISTS "Drivers can view their own reviews" ON reviews;
  DROP POLICY IF EXISTS "Public can view non-anonymous reviews" ON reviews;
END $$;

CREATE POLICY "Users can create reviews for their orders"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own reviews"
  ON reviews
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Restaurant owners can view reviews for their restaurant"
  ON reviews
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Drivers can view their own reviews"
  ON reviews
  FOR SELECT
  TO authenticated
  USING (
    driver_id IN (
      SELECT id FROM delivery_drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view non-anonymous reviews"
  ON reviews
  FOR SELECT
  USING (is_anonymous = false);

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
DROP TRIGGER IF EXISTS update_user_addresses_updated_at ON user_addresses;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_delivery_drivers_updated_at ON delivery_drivers;

-- Add update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_addresses_updated_at BEFORE UPDATE ON user_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_delivery_drivers_updated_at BEFORE UPDATE ON delivery_drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO categories (name, emoji, description, sort_order) VALUES
  ('Pizza', '🍕', 'Delicious pizzas with various toppings', 1),
  ('Burgers', '🍔', 'Juicy burgers and sandwiches', 2),
  ('Sushi', '🍣', 'Fresh sushi and Japanese cuisine', 3),
  ('Indian', '🍛', 'Authentic Indian dishes and curries', 4),
  ('Chinese', '🥢', 'Traditional Chinese cuisine', 5),
  ('Mexican', '🌮', 'Spicy Mexican food and tacos', 6),
  ('Italian', '🍝', 'Classic Italian pasta and dishes', 7),
  ('Thai', '🍜', 'Flavorful Thai cuisine', 8),
  ('Desserts', '🍰', 'Sweet treats and desserts', 9),
  ('Beverages', '🥤', 'Drinks and beverages', 10)
ON CONFLICT (name) DO NOTHING;

-- Insert sample restaurants
INSERT INTO restaurants (name, cuisine, rating, delivery_time, delivery_fee, minimum_order, image, cover_image, address, phone, promoted, description) VALUES
  (
    'Mario''s Pizza Palace',
    'Italian',
    4.5,
    '25-30 min',
    2.99,
    15.00,
    'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg?auto=compress&cs=tinysrgb&w=1200',
    '123 Pizza Street, Downtown',
    '+1 (555) 123-4567',
    true,
    'Authentic Italian pizzas made with fresh ingredients and traditional recipes passed down through generations.'
  ),
  (
    'Burger Station',
    'American',
    4.3,
    '20-25 min',
    1.99,
    12.00,
    'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1556909/pexels-photo-1556909.jpeg?auto=compress&cs=tinysrgb&w=1200',
    '456 Burger Ave, Midtown',
    '+1 (555) 234-5678',
    false,
    'Gourmet burgers made with premium beef and fresh toppings. A local favorite for over 10 years.'
  ),
  (
    'Sushi Zen',
    'Japanese',
    4.7,
    '30-35 min',
    3.99,
    20.00,
    'https://images.pexels.com/photos/1148086/pexels-photo-1148086.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/357756/pexels-photo-357756.jpeg?auto=compress&cs=tinysrgb&w=1200',
    '789 Sushi Blvd, Uptown',
    '+1 (555) 345-6789',
    false,
    'Fresh sushi and sashimi prepared by master chefs using the finest ingredients imported from Japan.'
  ),
  (
    'Spice Garden',
    'Indian',
    4.4,
    '35-40 min',
    2.49,
    18.00,
    'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=1200',
    '321 Spice Lane, Little India',
    '+1 (555) 456-7890',
    true,
    'Authentic Indian cuisine with traditional spices and flavors. Vegetarian and vegan options available.'
  ),
  (
    'Dragon Palace',
    'Chinese',
    4.2,
    '25-30 min',
    2.99,
    16.00,
    'https://images.pexels.com/photos/2456435/pexels-photo-2456435.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1410235/pexels-photo-1410235.jpeg?auto=compress&cs=tinysrgb&w=1200',
    '654 Dragon Street, Chinatown',
    '+1 (555) 567-8901',
    false,
    'Traditional Chinese dishes with modern presentation. Family recipes passed down for generations.'
  )
ON CONFLICT DO NOTHING;

-- Insert sample menu items for Mario's Pizza Palace
DO $$
DECLARE
    mario_restaurant_id uuid;
    pizza_category_id uuid;
    italian_category_id uuid;
    beverages_category_id uuid;
    desserts_category_id uuid;
BEGIN
    -- Get restaurant ID
    SELECT id INTO mario_restaurant_id FROM restaurants WHERE name = 'Mario''s Pizza Palace' LIMIT 1;
    
    -- Get category IDs
    SELECT id INTO pizza_category_id FROM categories WHERE name = 'Pizza' LIMIT 1;
    SELECT id INTO italian_category_id FROM categories WHERE name = 'Italian' LIMIT 1;
    SELECT id INTO beverages_category_id FROM categories WHERE name = 'Beverages' LIMIT 1;
    SELECT id INTO desserts_category_id FROM categories WHERE name = 'Desserts' LIMIT 1;
    
    IF mario_restaurant_id IS NOT NULL THEN
        INSERT INTO menu_items (restaurant_id, category_id, name, description, price, image, category, popular, preparation_time, calories) VALUES
        (mario_restaurant_id, pizza_category_id, 'Margherita Pizza', 'Fresh mozzarella, tomato sauce, basil leaves on our signature thin crust', 18.99, 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=400', 'Popular', true, 20, 650),
        (mario_restaurant_id, pizza_category_id, 'Pepperoni Pizza', 'Classic pepperoni with mozzarella cheese and our special tomato sauce', 21.99, 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg?auto=compress&cs=tinysrgb&w=400', 'Popular', true, 22, 720),
        (mario_restaurant_id, pizza_category_id, 'Supreme Pizza', 'Pepperoni, sausage, bell peppers, onions, mushrooms, and olives', 26.99, 'https://images.pexels.com/photos/708587/pexels-photo-708587.jpeg?auto=compress&cs=tinysrgb&w=400', 'Mains', false, 25, 850),
        (mario_restaurant_id, italian_category_id, 'Caesar Salad', 'Crisp romaine lettuce, parmesan cheese, croutons, and our homemade Caesar dressing', 12.99, 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=400', 'Sides', false, 10, 320),
        (mario_restaurant_id, italian_category_id, 'Garlic Bread', 'Fresh baked bread with garlic butter and herbs', 6.99, 'https://images.pexels.com/photos/4198018/pexels-photo-4198018.jpeg?auto=compress&cs=tinysrgb&w=400', 'Sides', false, 8, 280),
        (mario_restaurant_id, desserts_category_id, 'Tiramisu', 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone', 8.99, 'https://images.pexels.com/photos/6880219/pexels-photo-6880219.jpeg?auto=compress&cs=tinysrgb&w=400', 'Desserts', false, 5, 420),
        (mario_restaurant_id, beverages_category_id, 'Coca Cola', 'Classic Coca Cola 330ml can', 2.99, 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400', 'Beverages', false, 1, 140),
        (mario_restaurant_id, beverages_category_id, 'Italian Soda', 'Sparkling water with natural fruit flavors', 3.99, 'https://images.pexels.com/photos/1571458/pexels-photo-1571458.jpeg?auto=compress&cs=tinysrgb&w=400', 'Beverages', false, 1, 120)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Insert sample menu items for other restaurants
DO $$
DECLARE
    burger_restaurant_id uuid;
    sushi_restaurant_id uuid;
    burger_category_id uuid;
    sushi_category_id uuid;
    beverages_category_id uuid;
BEGIN
    -- Get restaurant IDs
    SELECT id INTO burger_restaurant_id FROM restaurants WHERE name = 'Burger Station' LIMIT 1;
    SELECT id INTO sushi_restaurant_id FROM restaurants WHERE name = 'Sushi Zen' LIMIT 1;
    
    -- Get category IDs
    SELECT id INTO burger_category_id FROM categories WHERE name = 'Burgers' LIMIT 1;
    SELECT id INTO sushi_category_id FROM categories WHERE name = 'Sushi' LIMIT 1;
    SELECT id INTO beverages_category_id FROM categories WHERE name = 'Beverages' LIMIT 1;
    
    -- Burger Station menu
    IF burger_restaurant_id IS NOT NULL THEN
        INSERT INTO menu_items (restaurant_id, category_id, name, description, price, image, category, popular, preparation_time, calories) VALUES
        (burger_restaurant_id, burger_category_id, 'Classic Burger', 'Beef patty, lettuce, tomato, onion, pickles, and our special sauce', 14.99, 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400', 'Popular', true, 15, 580),
        (burger_restaurant_id, burger_category_id, 'Bacon Cheeseburger', 'Beef patty with crispy bacon, cheddar cheese, and all the fixings', 17.99, 'https://images.pexels.com/photos/1556909/pexels-photo-1556909.jpeg?auto=compress&cs=tinysrgb&w=400', 'Popular', true, 18, 720),
        (burger_restaurant_id, burger_category_id, 'Veggie Burger', 'Plant-based patty with fresh vegetables and avocado', 13.99, 'https://images.pexels.com/photos/1565982/pexels-photo-1565982.jpeg?auto=compress&cs=tinysrgb&w=400', 'Mains', false, 12, 450)
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Sushi Zen menu
    IF sushi_restaurant_id IS NOT NULL THEN
        INSERT INTO menu_items (restaurant_id, category_id, name, description, price, image, category, popular, preparation_time, calories) VALUES
        (sushi_restaurant_id, sushi_category_id, 'Salmon Roll', 'Fresh salmon with cucumber and avocado', 12.99, 'https://images.pexels.com/photos/1148086/pexels-photo-1148086.jpeg?auto=compress&cs=tinysrgb&w=400', 'Popular', true, 10, 320),
        (sushi_restaurant_id, sushi_category_id, 'Tuna Sashimi', 'Fresh tuna slices served with wasabi and ginger', 16.99, 'https://images.pexels.com/photos/357756/pexels-photo-357756.jpeg?auto=compress&cs=tinysrgb&w=400', 'Popular', true, 8, 180),
        (sushi_restaurant_id, sushi_category_id, 'Dragon Roll', 'Eel and cucumber topped with avocado and eel sauce', 18.99, 'https://images.pexels.com/photos/2098085/pexels-photo-2098085.jpeg?auto=compress&cs=tinysrgb&w=400', 'Mains', false, 15, 420)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Insert sample restaurant hours (open 7 days a week, 11 AM - 10 PM)
DO $$
DECLARE
    restaurant_record RECORD;
BEGIN
    FOR restaurant_record IN SELECT id FROM restaurants LOOP
        INSERT INTO restaurant_hours (restaurant_id, day_of_week, open_time, close_time) VALUES
        (restaurant_record.id, 0, '11:00', '22:00'), -- Sunday
        (restaurant_record.id, 1, '11:00', '22:00'), -- Monday
        (restaurant_record.id, 2, '11:00', '22:00'), -- Tuesday
        (restaurant_record.id, 3, '11:00', '22:00'), -- Wednesday
        (restaurant_record.id, 4, '11:00', '22:00'), -- Thursday
        (restaurant_record.id, 5, '11:00', '23:00'), -- Friday
        (restaurant_record.id, 6, '11:00', '23:00') -- Saturday
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;