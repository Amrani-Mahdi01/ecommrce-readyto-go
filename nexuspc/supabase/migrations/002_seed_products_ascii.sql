-- Run AFTER categories are inserted
-- Arabic names/descriptions can be updated later via admin panel

INSERT INTO products (name_en, name_ar, slug, description_en, description_ar, price, compare_price, stock_qty, brand, category_id, specs, images, is_featured, is_active) VALUES

-- GPUs
('NVIDIA GeForce RTX 4070 12GB', 'RTX 4070 12GB', 'rtx-4070-12gb',
 'Excellent 1440p gaming with DLSS 3 and ray tracing.', 'RTX 4070 للالعاب',
 89000, 99000, 5, 'NVIDIA', (SELECT id FROM categories WHERE slug='gpu'),
 '{"Memory":"12GB GDDR6X","Bus":"192-bit","Boost":"2610MHz","TDP":"200W"}', '{}', true, true),

('AMD Radeon RX 7800 XT 16GB', 'RX 7800 XT 16GB', 'rx-7800-xt-16gb',
 '1440p gaming card with 16GB GDDR6 and FSR 3.', 'RX 7800 XT للالعاب',
 75000, 82000, 8, 'AMD', (SELECT id FROM categories WHERE slug='gpu'),
 '{"Memory":"16GB GDDR6","Bus":"256-bit","Boost":"2430MHz","TDP":"263W"}', '{}', true, true),

('NVIDIA GeForce RTX 4060 8GB', 'RTX 4060 8GB', 'rtx-4060-8gb',
 'Great 1080p GPU with Ada Lovelace architecture.', 'RTX 4060 للالعاب',
 52000, 58000, 12, 'NVIDIA', (SELECT id FROM categories WHERE slug='gpu'),
 '{"Memory":"8GB GDDR6","Bus":"128-bit","Boost":"2460MHz","TDP":"115W"}', '{}', false, true),

('AMD Radeon RX 7600 8GB', 'RX 7600 8GB', 'rx-7600-8gb',
 'Budget 1080p gaming with RDNA 3.', 'RX 7600 للالعاب',
 38000, 42000, 15, 'AMD', (SELECT id FROM categories WHERE slug='gpu'),
 '{"Memory":"8GB GDDR6","Bus":"128-bit","Boost":"2655MHz","TDP":"165W"}', '{}', false, true),

-- CPUs
('AMD Ryzen 5 7600X', 'Ryzen 5 7600X', 'ryzen-5-7600x',
 '6-core AM5 processor, great for gaming.', 'معالج Ryzen 5 7600X',
 29000, 33000, 10, 'AMD', (SELECT id FROM categories WHERE slug='cpu'),
 '{"Cores":"6","Threads":"12","Base":"4.7GHz","Boost":"5.3GHz","TDP":"105W","Socket":"AM5"}', '{}', true, true),

('Intel Core i5-13600K', 'i5-13600K', 'i5-13600k',
 '14-core gaming and productivity powerhouse.', 'معالج i5-13600K',
 35000, 40000, 7, 'Intel', (SELECT id FROM categories WHERE slug='cpu'),
 '{"Cores":"14","Threads":"20","Base":"3.5GHz","Boost":"5.1GHz","TDP":"125W","Socket":"LGA1700"}', '{}', true, true),

('AMD Ryzen 7 7700X', 'Ryzen 7 7700X', 'ryzen-7-7700x',
 '8-core AM5, perfect for gaming and content creation.', 'معالج Ryzen 7 7700X',
 45000, 50000, 6, 'AMD', (SELECT id FROM categories WHERE slug='cpu'),
 '{"Cores":"8","Threads":"16","Base":"4.5GHz","Boost":"5.4GHz","TDP":"105W","Socket":"AM5"}', '{}', false, true),

('Intel Core i3-13100F', 'i3-13100F', 'i3-13100f',
 'Budget 4-core CPU for entry-level gaming builds.', 'معالج i3-13100F',
 14000, 16000, 20, 'Intel', (SELECT id FROM categories WHERE slug='cpu'),
 '{"Cores":"4","Threads":"8","Base":"3.4GHz","Boost":"4.5GHz","TDP":"58W","Socket":"LGA1700"}', '{}', false, true),

-- RAM
('Corsair Vengeance DDR5 32GB 5600MHz', 'Corsair Vengeance DDR5 32GB', 'corsair-vengeance-ddr5-32gb',
 'High-performance DDR5 for AM5 and LGA1700.', 'ذاكرة DDR5 32GB',
 18000, 21000, 14, 'Corsair', (SELECT id FROM categories WHERE slug='ram'),
 '{"Capacity":"32GB (2x16GB)","Type":"DDR5","Speed":"5600MHz","Latency":"CL36"}', '{}', true, true),

('Kingston Fury Beast DDR4 16GB 3200MHz', 'Kingston Fury DDR4 16GB', 'kingston-fury-ddr4-16gb',
 'Reliable DDR4 gaming memory kit.', 'ذاكرة DDR4 16GB',
 9500, 11000, 22, 'Kingston', (SELECT id FROM categories WHERE slug='ram'),
 '{"Capacity":"16GB (2x8GB)","Type":"DDR4","Speed":"3200MHz","Latency":"CL16"}', '{}', false, true),

('G.Skill Trident Z5 DDR5 32GB 6000MHz', 'G.Skill Trident Z5 DDR5 32GB', 'gskill-trident-z5-ddr5-32gb',
 'Premium RGB DDR5 with top-tier performance.', 'ذاكرة DDR5 32GB فاخرة',
 24000, 28000, 8, 'G.Skill', (SELECT id FROM categories WHERE slug='ram'),
 '{"Capacity":"32GB (2x16GB)","Type":"DDR5","Speed":"6000MHz","Latency":"CL30"}', '{}', true, true),

-- Storage
('Samsung 990 Pro NVMe SSD 1TB', 'Samsung 990 Pro 1TB', 'samsung-990-pro-1tb',
 'PCIe 4.0 NVMe SSD, up to 7450 MB/s read.', 'قرص SSD سامسونج 1TB',
 16000, 18500, 18, 'Samsung', (SELECT id FROM categories WHERE slug='storage'),
 '{"Capacity":"1TB","Interface":"PCIe 4.0 NVMe","Read":"7450 MB/s","Write":"6900 MB/s","Form":"M.2 2280"}', '{}', true, true),

('WD Black SN850X NVMe SSD 1TB', 'WD Black SN850X 1TB', 'wd-black-sn850x-1tb',
 'Gaming-optimized PCIe 4.0 SSD.', 'قرص SSD WD Black 1TB',
 17500, 20000, 10, 'Western Digital', (SELECT id FROM categories WHERE slug='storage'),
 '{"Capacity":"1TB","Interface":"PCIe 4.0 NVMe","Read":"7300 MB/s","Write":"6600 MB/s","Form":"M.2 2280"}', '{}', false, true),

('Seagate Barracuda HDD 2TB', 'Seagate Barracuda 2TB', 'seagate-barracuda-2tb',
 '2TB 7200RPM hard drive for mass storage.', 'قرص صلب 2TB',
 7500, 8500, 25, 'Seagate', (SELECT id FROM categories WHERE slug='storage'),
 '{"Capacity":"2TB","Interface":"SATA III","RPM":"7200","Cache":"256MB","Form":"3.5 inch"}', '{}', false, true),

-- PSU
('Corsair RM850x 850W 80+ Gold', 'Corsair RM850x 850W', 'corsair-rm850x-850w',
 'Fully modular 850W PSU, 80+ Gold.', 'مزود طاقة 850W ذهبي',
 22000, 25000, 9, 'Corsair', (SELECT id FROM categories WHERE slug='psu'),
 '{"Wattage":"850W","Efficiency":"80+ Gold","Modular":"Fully Modular","Warranty":"10 years"}', '{}', true, true),

('Seasonic Focus GX-650 650W 80+ Gold', 'Seasonic Focus GX 650W', 'seasonic-focus-gx-650w',
 'Reliable 650W fully modular PSU with 10-year warranty.', 'مزود طاقة 650W ذهبي',
 17000, 19000, 12, 'Seasonic', (SELECT id FROM categories WHERE slug='psu'),
 '{"Wattage":"650W","Efficiency":"80+ Gold","Modular":"Fully Modular","Warranty":"10 years"}', '{}', false, true),

-- Cooling
('Noctua NH-D15 CPU Air Cooler', 'Noctua NH-D15', 'noctua-nh-d15',
 'Legendary dual-tower air cooler competing with 280mm AIOs.', 'مبرد هوائي Noctua NH-D15',
 13500, 15000, 7, 'Noctua', (SELECT id FROM categories WHERE slug='cooling'),
 '{"Type":"Air Cooler","TDP":"250W+","Fans":"2x 140mm","Height":"165mm","Socket":"AM4/AM5/LGA1700"}', '{}', true, true),

('ARCTIC Liquid Freezer III 240 AIO', 'ARCTIC Liquid Freezer 240', 'arctic-liquid-freezer-iii-240',
 '240mm AIO liquid cooler with excellent performance.', 'مبرد سائل 240mm',
 12000, 14000, 11, 'ARCTIC', (SELECT id FROM categories WHERE slug='cooling'),
 '{"Type":"AIO","Radiator":"240mm","Fans":"2x 120mm","Socket":"AM4/AM5/LGA1700"}', '{}', false, true),

-- Cases
('Lian Li PC-O11 Dynamic EVO ATX', 'Lian Li O11 Dynamic EVO', 'lian-li-o11-dynamic-evo',
 'Iconic dual-chamber case with tempered glass.', 'كيس Lian Li O11',
 19000, 22000, 6, 'Lian Li', (SELECT id FROM categories WHERE slug='cases'),
 '{"Form":"ATX/mATX/ITX","Material":"Aluminum + Tempered Glass","Fans":"Up to 10x 120mm"}', '{}', true, true),

('NZXT H510 Flow ATX Mid Tower', 'NZXT H510 Flow', 'nzxt-h510-flow',
 'Clean minimalist design with great airflow.', 'كيس NZXT H510 Flow',
 11000, 13000, 9, 'NZXT', (SELECT id FROM categories WHERE slug='cases'),
 '{"Form":"ATX/mATX","Material":"Steel + Tempered Glass","Fans":"3x 120mm front"}', '{}', false, true),

-- Motherboards
('ASUS ROG Strix B650E-F Gaming WiFi', 'ASUS ROG B650E-F', 'asus-rog-b650e-f-gaming-wifi',
 'Premium AM5 board with PCIe 5.0 and DDR5.', 'لوحة AM5 ASUS ROG',
 32000, 37000, 5, 'ASUS', (SELECT id FROM categories WHERE slug='motherboard'),
 '{"Socket":"AM5","Chipset":"B650E","Memory":"DDR5","PCIe":"5.0 x16","WiFi":"WiFi 6E"}', '{}', true, true),

('MSI MAG B760M Mortar WiFi DDR4', 'MSI MAG B760M Mortar', 'msi-mag-b760m-mortar-wifi',
 'Solid mATX LGA1700 board with DDR4 and WiFi 6E.', 'لوحة LGA1700 MSI MAG',
 18000, 21000, 8, 'MSI', (SELECT id FROM categories WHERE slug='motherboard'),
 '{"Socket":"LGA1700","Chipset":"B760","Memory":"DDR4","PCIe":"4.0 x16","WiFi":"WiFi 6E"}', '{}', false, true);

-- Verify
SELECT p.name_en, p.price, c.slug as category
FROM products p
JOIN categories c ON c.id = p.category_id
ORDER BY c.slug, p.price;
