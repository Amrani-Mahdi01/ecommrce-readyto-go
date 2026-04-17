export interface Product {
  id: string;
  name_en: string;
  name_ar: string;
  slug: string;
  description_en: string | null;
  description_ar: string | null;
  price: number;
  compare_price: number | null;
  stock_qty: number;
  sku: string | null;
  brand: string | null;
  category_id: string | null;
  specs: Record<string, string | number | boolean>;
  images: string[];
  is_featured: boolean;
  is_active: boolean;
  meta_title_en: string | null;
  meta_title_ar: string | null;
  meta_description_en: string | null;
  meta_description_ar: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductWithCategory extends Product {
  categories: {
    id: string;
    name_en: string;
    name_ar: string;
    slug: string;
  } | null;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
}

export interface ProductFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
  sort?: 'featured' | 'price_asc' | 'price_desc' | 'newest' | 'top_rated';
  page?: number;
}
