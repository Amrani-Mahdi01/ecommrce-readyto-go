-- ============================================================
-- NexusPC — Schema + Seed
-- Run after 000_reset.sql
-- ============================================================

-- ── Sequences ────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS order_seq START 1;

-- ── Profiles ─────────────────────────────────────────────────
CREATE TABLE profiles (
  id         UUID REFERENCES auth.users PRIMARY KEY,
  email      TEXT,
  full_name  TEXT,
  phone      TEXT,
  role       TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Categories ───────────────────────────────────────────────
CREATE TABLE categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en       TEXT NOT NULL,
  name_ar       TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  display_order INT DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE
);

-- ── Products ─────────────────────────────────────────────────
CREATE TABLE products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en        TEXT NOT NULL,
  name_ar        TEXT NOT NULL,
  slug           TEXT UNIQUE NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  price          DECIMAL(10,2) NOT NULL,
  compare_price  DECIMAL(10,2),
  stock_qty      INT DEFAULT 0,
  brand          TEXT,
  category_id    UUID REFERENCES categories(id),
  specs          JSONB DEFAULT '{}',
  images         TEXT[] DEFAULT '{}',
  is_featured    BOOLEAN DEFAULT FALSE,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Orders ───────────────────────────────────────────────────
CREATE TABLE orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL DEFAULT
               ('NPC-' || LPAD(nextval('order_seq')::TEXT, 6, '0')),
  user_id      UUID REFERENCES profiles(id),
  status       TEXT DEFAULT 'placed'
               CHECK (status IN ('placed','confirmed','processing','shipped','delivered','cancelled')),
  full_name    TEXT NOT NULL,
  phone        TEXT NOT NULL,
  wilaya       TEXT NOT NULL,
  commune      TEXT NOT NULL,
  notes        TEXT,
  total        DECIMAL(10,2) NOT NULL,
  items        JSONB DEFAULT '[]',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Cart Items ───────────────────────────────────────────────
CREATE TABLE cart_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity   INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ── Triggers ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile row when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (true);

-- categories (public read)
CREATE POLICY "categories_select" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_all"    ON categories FOR ALL    USING (is_admin());

-- products (public read active; admins full CRUD)
CREATE POLICY "products_select" ON products FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY "products_all"    ON products FOR ALL    USING (is_admin());

-- orders
CREATE POLICY "orders_select" ON orders FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_update" ON orders FOR UPDATE USING (is_admin());

-- cart
CREATE POLICY "cart_all" ON cart_items FOR ALL USING (auth.uid() = user_id);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX idx_products_category   ON products(category_id);
CREATE INDEX idx_products_slug       ON products(slug);
CREATE INDEX idx_products_is_active  ON products(is_active);
CREATE INDEX idx_products_featured   ON products(is_featured);
CREATE INDEX idx_orders_user         ON orders(user_id);
CREATE INDEX idx_orders_status       ON orders(status);
CREATE INDEX idx_orders_number       ON orders(order_number);
CREATE INDEX idx_cart_user           ON cart_items(user_id);

-- ── Seed: Categories ─────────────────────────────────────────
INSERT INTO categories (name_en, name_ar, slug, display_order) VALUES
  ('Graphics Cards', 'بطاقات الرسومات',  'gpu',         1),
  ('Processors',     'المعالجات',         'cpu',         2),
  ('Memory (RAM)',   'الذاكرة العشوائية', 'ram',         3),
  ('Storage',        'وحدات التخزين',     'storage',     4),
  ('Power Supplies', 'وحدات الطاقة',      'psu',         5),
  ('Cooling',        'التبريد',           'cooling',     6),
  ('Cases',          'الهياكل',           'cases',       7),
  ('Motherboards',   'اللوحات الأم',      'motherboard', 8);
