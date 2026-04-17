-- ============================================================
-- NexusPC — Initial Schema
-- ============================================================

-- Order number sequence
CREATE SEQUENCE IF NOT EXISTS order_seq START 1;

-- ─── Profiles ───────────────────────────────────────────────
CREATE TABLE profiles (
  id               UUID REFERENCES auth.users PRIMARY KEY,
  email            TEXT,
  username         TEXT UNIQUE,
  full_name        TEXT,
  avatar_url       TEXT,
  phone            TEXT,
  role             TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  preferred_locale TEXT DEFAULT 'en',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on sign-up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Categories ─────────────────────────────────────────────
CREATE TABLE categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en         TEXT NOT NULL,
  name_ar         TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  description_en  TEXT,
  description_ar  TEXT,
  image_url       TEXT,
  parent_id       UUID REFERENCES categories(id),
  display_order   INT DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE
);

-- ─── Products ───────────────────────────────────────────────
CREATE TABLE products (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en              TEXT NOT NULL,
  name_ar              TEXT NOT NULL,
  slug                 TEXT UNIQUE NOT NULL,
  description_en       TEXT,
  description_ar       TEXT,
  price                DECIMAL(10,2) NOT NULL,
  compare_price        DECIMAL(10,2),
  stock_qty            INT DEFAULT 0,
  sku                  TEXT UNIQUE,
  brand                TEXT,
  category_id          UUID REFERENCES categories(id),
  specs                JSONB DEFAULT '{}',
  images               TEXT[] DEFAULT '{}',
  is_featured          BOOLEAN DEFAULT FALSE,
  is_active            BOOLEAN DEFAULT TRUE,
  meta_title_en        TEXT,
  meta_title_ar        TEXT,
  meta_description_en  TEXT,
  meta_description_ar  TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Orders ─────────────────────────────────────────────────
CREATE TABLE orders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number   TEXT UNIQUE NOT NULL DEFAULT
                   ('NPC-' || LPAD(nextval('order_seq')::TEXT, 6, '0')),
  user_id        UUID REFERENCES profiles(id),
  status         TEXT DEFAULT 'placed'
                   CHECK (status IN ('placed','confirmed','processing','shipped','delivered','cancelled')),
  full_name      TEXT NOT NULL,
  phone          TEXT NOT NULL,
  wilaya         TEXT NOT NULL,
  commune        TEXT NOT NULL,
  notes          TEXT,
  total          DECIMAL(10,2) NOT NULL,
  items          JSONB DEFAULT '[]',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Cart Items ──────────────────────────────────────────────
CREATE TABLE cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity    INT DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ─── PC Builds ───────────────────────────────────────────────
CREATE TABLE pc_builds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id),
  name        TEXT NOT NULL,
  components  JSONB DEFAULT '{}',
  total_price DECIMAL(10,2) DEFAULT 0,
  is_public   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Reviews ─────────────────────────────────────────────────
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES profiles(id),
  rating      INT CHECK (rating BETWEEN 1 AND 5),
  title       TEXT,
  body        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pc_builds   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews     ENABLE ROW LEVEL SECURITY;

-- Helper: is current user admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- profiles
CREATE POLICY "Users read own profile"   ON profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Trigger inserts profile"  ON profiles FOR INSERT WITH CHECK (TRUE);

-- categories: public read
CREATE POLICY "Public read categories"   ON categories FOR SELECT USING (is_active = TRUE OR is_admin());
CREATE POLICY "Admins manage categories" ON categories FOR ALL USING (is_admin());

-- products: public read active; admins full CRUD
CREATE POLICY "Public read active products" ON products FOR SELECT USING (is_active = TRUE OR is_admin());
CREATE POLICY "Admins manage products"      ON products FOR ALL USING (is_admin());

-- orders: users see own; admins see all; anyone can insert (guest checkout)
CREATE POLICY "Users read own orders"  ON orders FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Anyone can place order" ON orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admins update orders"   ON orders FOR UPDATE USING (is_admin());

-- cart_items: users manage their own
CREATE POLICY "Users manage own cart" ON cart_items FOR ALL USING (auth.uid() = user_id);

-- pc_builds
CREATE POLICY "Users manage own builds"  ON pc_builds FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public builds are public" ON pc_builds FOR SELECT USING (is_public = TRUE);

-- reviews
CREATE POLICY "Public read reviews"      ON reviews FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated can review" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own review"  ON reviews FOR UPDATE USING (auth.uid() = user_id);

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX idx_products_category    ON products(category_id);
CREATE INDEX idx_products_slug        ON products(slug);
CREATE INDEX idx_products_is_active   ON products(is_active);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_orders_user_id       ON orders(user_id);
CREATE INDEX idx_orders_status        ON orders(status);
CREATE INDEX idx_orders_number        ON orders(order_number);
CREATE INDEX idx_cart_user            ON cart_items(user_id);
CREATE INDEX idx_reviews_product      ON reviews(product_id);

-- ─── Seed: Categories ────────────────────────────────────────
INSERT INTO categories (name_en, name_ar, slug, description_en, description_ar, display_order) VALUES
  ('Graphics Cards',  'بطاقات الرسومات',   'gpu',         'NVIDIA & AMD GPUs',             'بطاقات NVIDIA و AMD',              1),
  ('Processors',      'المعالجات',          'cpu',         'Intel & AMD CPUs',              'معالجات Intel و AMD',              2),
  ('Memory (RAM)',    'الذاكرة العشوائية',  'ram',         'DDR4 & DDR5 memory kits',       'مجموعات ذاكرة DDR4 و DDR5',        3),
  ('Storage',         'وحدات التخزين',      'storage',     'NVMe SSD, SATA SSD & HDD',     'أقراص NVMe و SATA والأقراص الصلبة', 4),
  ('Power Supplies',  'وحدات الطاقة',       'psu',         'Modular & semi-modular PSUs',   'وحدات طاقة معيارية',               5),
  ('Cooling',         'التبريد',            'cooling',     'Air coolers, AIOs & fans',      'مبردات هوائية وسائلة',             6),
  ('Cases',           'أكياس الكمبيوتر',   'cases',       'ATX, mATX and ITX cases',       'أكياس ATX و mATX و ITX',           7),
  ('Motherboards',    'اللوحات الأم',       'motherboard', 'Intel & AMD motherboards',      'لوحات أم Intel و AMD',             8);
