export interface Category {
  slug: string;
  name_en: string;
  name_ar: string;
  icon: string;
  description_en: string;
  description_ar: string;
}

export const categories: Category[] = [
  {
    slug: 'gpu',
    name_en: 'Graphics Cards',
    name_ar: 'بطاقات الرسومات',
    icon: 'Monitor',
    description_en: 'NVIDIA & AMD GPUs for gaming and workstation use',
    description_ar: 'بطاقات رسومات NVIDIA و AMD للألعاب والعمل',
  },
  {
    slug: 'cpu',
    name_en: 'Processors',
    name_ar: 'المعالجات',
    icon: 'Cpu',
    description_en: 'Intel Core & AMD Ryzen processors',
    description_ar: 'معالجات Intel Core و AMD Ryzen',
  },
  {
    slug: 'ram',
    name_en: 'Memory (RAM)',
    name_ar: 'الذاكرة العشوائية',
    icon: 'MemoryStick',
    description_en: 'DDR4 & DDR5 memory kits',
    description_ar: 'مجموعات ذاكرة DDR4 و DDR5',
  },
  {
    slug: 'storage',
    name_en: 'Storage',
    name_ar: 'وحدات التخزين',
    icon: 'HardDrive',
    description_en: 'NVMe SSDs, SATA SSDs and HDDs',
    description_ar: 'أقراص NVMe SSD و SATA SSD والأقراص الصلبة',
  },
  {
    slug: 'psu',
    name_en: 'Power Supplies',
    name_ar: 'وحدات الطاقة',
    icon: 'Zap',
    description_en: 'Modular and semi-modular PSUs',
    description_ar: 'وحدات طاقة معيارية وشبه معيارية',
  },
  {
    slug: 'cooling',
    name_en: 'Cooling',
    name_ar: 'التبريد',
    icon: 'Wind',
    description_en: 'Air coolers, AIOs and case fans',
    description_ar: 'مبردات هوائية وسائلة ومراوح الكيس',
  },
  {
    slug: 'cases',
    name_en: 'Cases',
    name_ar: 'أكياس الكمبيوتر',
    icon: 'Box',
    description_en: 'ATX, mATX and ITX cases',
    description_ar: 'أكياس ATX و mATX و ITX',
  },
  {
    slug: 'motherboard',
    name_en: 'Motherboards',
    name_ar: 'اللوحات الأم',
    icon: 'CircuitBoard',
    description_en: 'Intel & AMD compatible motherboards',
    description_ar: 'لوحات أم متوافقة مع Intel و AMD',
  },
];
