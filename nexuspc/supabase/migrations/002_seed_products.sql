-- ============================================================
-- NexusPC — Sample Products Seed
-- ============================================================

-- GPUs
INSERT INTO products (name_en, name_ar, slug, description_en, description_ar, price, compare_price, stock_qty, brand, category_id, specs, images, is_featured, is_active) VALUES
(
  'NVIDIA GeForce RTX 4070 12GB',
  'كرت شاشة NVIDIA GeForce RTX 4070 بذاكرة 12 جيجا',
  'rtx-4070-12gb',
  'The RTX 4070 delivers excellent 1440p gaming performance with DLSS 3 and ray tracing support.',
  'يقدم RTX 4070 أداءً ممتازاً في الألعاب بدقة 1440p مع دعم DLSS 3 وتتبع الأشعة.',
  89000, 99000, 5, 'NVIDIA',
  (SELECT id FROM categories WHERE slug = 'gpu'),
  '{"Memory": "12GB GDDR6X", "Memory Bus": "192-bit", "Boost Clock": "2610 MHz", "TDP": "200W", "Outputs": "3x DisplayPort 1.4, 1x HDMI 2.1"}',
  '{}', true, true
),
(
  'AMD Radeon RX 7800 XT 16GB',
  'كرت شاشة AMD Radeon RX 7800 XT بذاكرة 16 جيجا',
  'rx-7800-xt-16gb',
  'Excellent 1440p gaming card with 16GB GDDR6 and AMD FSR 3 support.',
  'كرت شاشة ممتاز للألعاب بدقة 1440p مع 16 جيجا GDDR6 ودعم AMD FSR 3.',
  75000, 82000, 8, 'AMD',
  (SELECT id FROM categories WHERE slug = 'gpu'),
  '{"Memory": "16GB GDDR6", "Memory Bus": "256-bit", "Boost Clock": "2430 MHz", "TDP": "263W", "Outputs": "1x HDMI 2.1, 3x DisplayPort 2.1"}',
  '{}', true, true
),
(
  'NVIDIA GeForce RTX 4060 8GB',
  'كرت شاشة NVIDIA GeForce RTX 4060 بذاكرة 8 جيجا',
  'rtx-4060-8gb',
  'Great 1080p gaming GPU with efficient Ada Lovelace architecture and DLSS 3.',
  'كرت شاشة ممتاز للألعاب بدقة 1080p مع معمارية Ada Lovelace الفعّالة.',
  52000, 58000, 12, 'NVIDIA',
  (SELECT id FROM categories WHERE slug = 'gpu'),
  '{"Memory": "8GB GDDR6", "Memory Bus": "128-bit", "Boost Clock": "2460 MHz", "TDP": "115W", "Outputs": "3x DisplayPort 1.4a, 1x HDMI 2.1"}',
  '{}', false, true
),
(
  'AMD Radeon RX 7600 8GB',
  'كرت شاشة AMD Radeon RX 7600 بذاكرة 8 جيجا',
  'rx-7600-8gb',
  'Budget-friendly 1080p gaming with RDNA 3 architecture.',
  'كرت شاشة اقتصادي للألعاب بدقة 1080p مع معمارية RDNA 3.',
  38000, 42000, 15, 'AMD',
  (SELECT id FROM categories WHERE slug = 'gpu'),
  '{"Memory": "8GB GDDR6", "Memory Bus": "128-bit", "Boost Clock": "2655 MHz", "TDP": "165W"}',
  '{}', false, true
),

-- CPUs
(
  'AMD Ryzen 5 7600X',
  'معالج AMD Ryzen 5 7600X',
  'ryzen-5-7600x',
  '6-core AM5 processor with excellent gaming performance and PCIe 5.0 support.',
  'معالج سداسي النواة AM5 مع أداء ممتاز في الألعاب ودعم PCIe 5.0.',
  29000, 33000, 10, 'AMD',
  (SELECT id FROM categories WHERE slug = 'cpu'),
  '{"Cores": "6", "Threads": "12", "Base Clock": "4.7 GHz", "Boost Clock": "5.3 GHz", "TDP": "105W", "Socket": "AM5", "Cache": "38MB"}',
  '{}', true, true
),
(
  'Intel Core i5-13600K',
  'معالج Intel Core i5-13600K',
  'i5-13600k',
  '14-core (6P+8E) powerhouse for gaming and productivity at a great price.',
  'معالج من 14 نواة للألعاب والإنتاجية بسعر ممتاز.',
  35000, 40000, 7, 'Intel',
  (SELECT id FROM categories WHERE slug = 'cpu'),
  '{"Cores": "14 (6P+8E)", "Threads": "20", "Base Clock": "3.5 GHz", "Boost Clock": "5.1 GHz", "TDP": "125W", "Socket": "LGA1700", "Cache": "44MB"}',
  '{}', true, true
),
(
  'AMD Ryzen 7 7700X',
  'معالج AMD Ryzen 7 7700X',
  'ryzen-7-7700x',
  '8-core AM5 processor, perfect for gaming and content creation.',
  'معالج ثماني النواة AM5 مثالي للألعاب وإنشاء المحتوى.',
  45000, 50000, 6, 'AMD',
  (SELECT id FROM categories WHERE slug = 'cpu'),
  '{"Cores": "8", "Threads": "16", "Base Clock": "4.5 GHz", "Boost Clock": "5.4 GHz", "TDP": "105W", "Socket": "AM5", "Cache": "40MB"}',
  '{}', false, true
),
(
  'Intel Core i3-13100F',
  'معالج Intel Core i3-13100F',
  'i3-13100f',
  'Budget gaming CPU, 4 cores, great for entry-level builds.',
  'معالج اقتصادي للألعاب، 4 أنوية، مثالي للبناء الاقتصادي.',
  14000, 16000, 20, 'Intel',
  (SELECT id FROM categories WHERE slug = 'cpu'),
  '{"Cores": "4", "Threads": "8", "Base Clock": "3.4 GHz", "Boost Clock": "4.5 GHz", "TDP": "58W", "Socket": "LGA1700"}',
  '{}', false, true
),

-- RAM
(
  'Corsair Vengeance DDR5 32GB (2x16GB) 5600MHz',
  'ذاكرة Corsair Vengeance DDR5 32 جيجا بتردد 5600 ميجاهرتز',
  'corsair-vengeance-ddr5-32gb-5600',
  'High-performance DDR5 kit for AM5 and LGA1700 platforms.',
  'كيت ذاكرة DDR5 عالي الأداء لمنصتي AM5 و LGA1700.',
  18000, 21000, 14, 'Corsair',
  (SELECT id FROM categories WHERE slug = 'ram'),
  '{"Capacity": "32GB (2x16GB)", "Type": "DDR5", "Speed": "5600MHz", "Latency": "CL36", "Voltage": "1.25V"}',
  '{}', true, true
),
(
  'Kingston Fury Beast DDR4 16GB (2x8GB) 3200MHz',
  'ذاكرة Kingston Fury Beast DDR4 16 جيجا بتردد 3200 ميجاهرتز',
  'kingston-fury-ddr4-16gb-3200',
  'Reliable DDR4 gaming memory with aggressive heatspreader design.',
  'ذاكرة DDR4 موثوقة للألعاب مع تصميم مبدد حرارة قوي.',
  9500, 11000, 22, 'Kingston',
  (SELECT id FROM categories WHERE slug = 'ram'),
  '{"Capacity": "16GB (2x8GB)", "Type": "DDR4", "Speed": "3200MHz", "Latency": "CL16", "Voltage": "1.35V"}',
  '{}', false, true
),
(
  'G.Skill Trident Z5 RGB DDR5 32GB 6000MHz',
  'ذاكرة G.Skill Trident Z5 RGB DDR5 32 جيجا بتردد 6000 ميجاهرتز',
  'gskill-trident-z5-ddr5-32gb-6000',
  'Premium RGB DDR5 memory with stunning aesthetics and top-tier performance.',
  'ذاكرة DDR5 فاخرة مع إضاءة RGB رائعة وأداء من الدرجة الأولى.',
  24000, 28000, 8, 'G.Skill',
  (SELECT id FROM categories WHERE slug = 'ram'),
  '{"Capacity": "32GB (2x16GB)", "Type": "DDR5", "Speed": "6000MHz", "Latency": "CL30", "Voltage": "1.35V"}',
  '{}', true, true
),

-- Storage
(
  'Samsung 990 Pro NVMe SSD 1TB',
  'قرص سامسونج 990 Pro NVMe بسعة 1 تيرابايت',
  'samsung-990-pro-1tb',
  'Blazing fast PCIe 4.0 NVMe SSD with sequential read speeds up to 7450 MB/s.',
  'قرص NVMe PCIe 4.0 فائق السرعة مع سرعات قراءة تصل إلى 7450 ميجابايت/ثانية.',
  16000, 18500, 18, 'Samsung',
  (SELECT id FROM categories WHERE slug = 'storage'),
  '{"Capacity": "1TB", "Interface": "PCIe 4.0 NVMe", "Read Speed": "7450 MB/s", "Write Speed": "6900 MB/s", "Form Factor": "M.2 2280"}',
  '{}', true, true
),
(
  'WD Black SN850X NVMe SSD 1TB',
  'قرص WD Black SN850X NVMe بسعة 1 تيرابايت',
  'wd-black-sn850x-1tb',
  'Gaming-optimized PCIe 4.0 SSD with predictive loading technology.',
  'قرص SSD PCIe 4.0 محسّن للألعاب مع تقنية التحميل التنبؤي.',
  17500, 20000, 10, 'Western Digital',
  (SELECT id FROM categories WHERE slug = 'storage'),
  '{"Capacity": "1TB", "Interface": "PCIe 4.0 NVMe", "Read Speed": "7300 MB/s", "Write Speed": "6600 MB/s", "Form Factor": "M.2 2280"}',
  '{}', false, true
),
(
  'Seagate Barracuda HDD 2TB',
  'قرص سيجيت باراكودا الصلب بسعة 2 تيرابايت',
  'seagate-barracuda-2tb',
  '2TB 7200RPM hard drive for mass storage at an affordable price.',
  'قرص صلب 2 تيرابايت بسرعة 7200 دورة/دقيقة للتخزين الضخم بسعر معقول.',
  7500, 8500, 25, 'Seagate',
  (SELECT id FROM categories WHERE slug = 'storage'),
  '{"Capacity": "2TB", "Interface": "SATA III", "RPM": "7200", "Cache": "256MB", "Form Factor": "3.5\""}',
  '{}', false, true
),

-- PSU
(
  'Corsair RM850x 850W 80+ Gold',
  'مزود طاقة Corsair RM850x 850 واط 80+ ذهبي',
  'corsair-rm850x-850w',
  'Fully modular 850W PSU with 80+ Gold efficiency and quiet operation.',
  'مزود طاقة معياري بالكامل 850 واط مع كفاءة 80+ ذهبي وتشغيل هادئ.',
  22000, 25000, 9, 'Corsair',
  (SELECT id FROM categories WHERE slug = 'psu'),
  '{"Wattage": "850W", "Efficiency": "80+ Gold", "Modular": "Fully Modular", "Fan Size": "135mm", "Warranty": "10 years"}',
  '{}', true, true
),
(
  'Seasonic Focus GX-650 650W 80+ Gold',
  'مزود طاقة Seasonic Focus GX-650 واط 80+ ذهبي',
  'seasonic-focus-gx-650w',
  'Highly reliable 650W fully modular PSU from Seasonic with 10-year warranty.',
  'مزود طاقة موثوق 650 واط معياري بالكامل من Seasonic بضمان 10 سنوات.',
  17000, 19000, 12, 'Seasonic',
  (SELECT id FROM categories WHERE slug = 'psu'),
  '{"Wattage": "650W", "Efficiency": "80+ Gold", "Modular": "Fully Modular", "Fan Size": "120mm", "Warranty": "10 years"}',
  '{}', false, true
),

-- Cooling
(
  'Noctua NH-D15 CPU Air Cooler',
  'مبرد هوائي Noctua NH-D15 للمعالج',
  'noctua-nh-d15',
  'The legendary dual-tower air cooler, competing with 280mm AIOs.',
  'مبرد هوائي أسطوري ذو برجين ينافس مبردات الماء بحجم 280 مم.',
  13500, 15000, 7, 'Noctua',
  (SELECT id FROM categories WHERE slug = 'cooling'),
  '{"Type": "Air Cooler", "TDP Support": "250W+", "Fans": "2x NF-A15 140mm", "Height": "165mm", "Socket Support": "AM4/AM5/LGA1700"}',
  '{}', true, true
),
(
  'ARCTIC Liquid Freezer III 240 AIO',
  'مبرد سائل ARCTIC Liquid Freezer III بحجم 240 مم',
  'arctic-liquid-freezer-iii-240',
  '240mm all-in-one liquid cooler with excellent performance and low noise.',
  'مبرد سائل all-in-one بحجم 240 مم مع أداء ممتاز وضوضاء منخفضة.',
  12000, 14000, 11, 'ARCTIC',
  (SELECT id FROM categories WHERE slug = 'cooling'),
  '{"Type": "AIO Liquid Cooler", "Radiator Size": "240mm", "Fans": "2x 120mm P12", "Pump Speed": "800-2000 RPM", "Socket Support": "AM4/AM5/LGA1700"}',
  '{}', false, true
),

-- Cases
(
  'Lian Li PC-O11 Dynamic EVO ATX Case',
  'كيس Lian Li PC-O11 Dynamic EVO ATX',
  'lian-li-o11-dynamic-evo',
  'Iconic dual-chamber case with stunning tempered glass and excellent airflow.',
  'كيس ذو غرفتين مع زجاج مقسى رائع وتدفق هواء ممتاز.',
  19000, 22000, 6, 'Lian Li',
  (SELECT id FROM categories WHERE slug = 'cases'),
  '{"Form Factor": "ATX/mATX/ITX", "Material": "Aluminum + Tempered Glass", "Drive Bays": "2x 2.5\", 2x 3.5\"", "Fan Support": "Up to 10x 120mm", "Dimensions": "465 x 285 x 459mm"}',
  '{}', true, true
),
(
  'NZXT H510 Flow ATX Mid Tower',
  'كيس NZXT H510 Flow برج ATX متوسط',
  'nzxt-h510-flow',
  'Clean minimalist design with perforated front panel for maximum airflow.',
  'تصميم بسيط وأنيق مع لوحة أمامية مثقبة لتدفق هواء أقصى.',
  11000, 13000, 9, 'NZXT',
  (SELECT id FROM categories WHERE slug = 'cases'),
  '{"Form Factor": "ATX/mATX", "Material": "Steel + Tempered Glass", "Drive Bays": "2x 2.5\", 1x 3.5\"", "Fan Support": "3x 120mm or 2x 140mm front, 1x 120mm rear", "Dimensions": "428 x 210 x 460mm"}',
  '{}', false, true
),

-- Motherboards
(
  'ASUS ROG Strix B650E-F Gaming WiFi',
  'لوحة أم ASUS ROG Strix B650E-F Gaming WiFi',
  'asus-rog-b650e-f-gaming-wifi',
  'Premium AM5 motherboard with PCIe 5.0, DDR5 support and ROG aesthetics.',
  'لوحة أم AM5 فاخرة مع PCIe 5.0 ودعم DDR5 وتصميم ROG.',
  32000, 37000, 5, 'ASUS',
  (SELECT id FROM categories WHERE slug = 'motherboard'),
  '{"Socket": "AM5", "Chipset": "B650E", "Memory": "DDR5 up to 128GB", "PCIe": "PCIe 5.0 x16", "Storage": "2x M.2 PCIe 5.0, 2x M.2 PCIe 4.0", "WiFi": "WiFi 6E"}',
  '{}', true, true
),
(
  'MSI MAG B760M Mortar WiFi DDR4',
  'لوحة أم MSI MAG B760M Mortar WiFi DDR4',
  'msi-mag-b760m-mortar-wifi',
  'Solid mATX LGA1700 board supporting DDR4 with WiFi 6E.',
  'لوحة أم mATX متينة LGA1700 تدعم DDR4 مع WiFi 6E.',
  18000, 21000, 8, 'MSI',
  (SELECT id FROM categories WHERE slug = 'motherboard'),
  '{"Socket": "LGA1700", "Chipset": "B760", "Memory": "DDR4 up to 128GB", "PCIe": "PCIe 4.0 x16", "Storage": "2x M.2 PCIe 4.0", "WiFi": "WiFi 6E"}',
  '{}', false, true
);

-- Confirm
SELECT name_en, price, brand FROM products ORDER BY category_id, price;
