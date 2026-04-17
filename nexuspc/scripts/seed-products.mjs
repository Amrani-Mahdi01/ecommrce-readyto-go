import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cujglzjhjjlcthiljnhj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1amdsempoampsY3RoaWxqbmhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjE2OTk5NCwiZXhwIjoyMDkxNzQ1OTk0fQ.QUXzUs1PrgQu5WnG9qdh7IhnRV8vHCPfBjIJLLxpdBY'
);

const CAT = {
  gpu:         'feac65d6-f020-4e85-8a9f-357922c63583',
  cpu:         '653e021c-44d9-4c6f-945d-2e3c8e4b7ce4',
  ram:         'b4efaa18-8e9d-4edf-a468-4dd0536decdb',
  storage:     '89f9b558-d7d4-4ed6-986a-0320ea625f25',
  psu:         '2301a1e0-24f6-4f64-99a0-7bec569dbe33',
  cooling:     'edcfef0c-080d-4a7a-a8da-b1db41485e55',
  cases:       '13d7bc87-ab7d-401b-a92d-7ef7aa3a8ae6',
  motherboard: 'acc30967-cd7c-41a9-b4a7-19e8c5861754',
};

function slug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const products = [
  // ── GPUs ──────────────────────────────────────────────────────────────
  {
    name_en: 'NVIDIA GeForce RTX 4060 8GB GDDR6',
    name_ar: 'كارت شاشة NVIDIA GeForce RTX 4060 8GB GDDR6',
    brand: 'NVIDIA', category_id: CAT.gpu,
    price: 85000, compare_price: 92000, stock_qty: 8, is_featured: true,
    description_en: '<p>The <strong>RTX 4060</strong> is built on NVIDIA\'s Ada Lovelace architecture, delivering smooth 1080p and capable 1440p gaming with <strong>8GB GDDR6</strong> VRAM and hardware ray tracing support.</p><ul><li><strong>3072 CUDA Cores</strong> — solid rasterization for competitive gaming</li><li><strong>DLSS 3</strong> — AI frame generation for higher FPS at no quality loss</li><li><strong>TDP: 115W</strong> — extremely power-efficient for its performance tier</li><li><strong>PCIe 4.0 x16</strong> — compatible with modern Intel and AMD platforms</li></ul><p>Ideal for 1080p high-refresh gaming. Pairs perfectly with an i5-12400F or Ryzen 5 5600X in mid-range builds.</p>',
    description_ar: '<p>بُنيت <strong>RTX 4060</strong> على معمارية Ada Lovelace من NVIDIA، وتقدم أداءً سلساً في دقة 1080p مع دعم تتبع الأشعة و<strong>8GB GDDR6</strong> من الذاكرة المخصصة.</p><ul><li><strong>3072 نواة CUDA</strong> — أداء rasterization ممتاز للألعاب التنافسية</li><li><strong>DLSS 3</strong> — توليد الإطارات بالذكاء الاصطناعي لمزيد من FPS</li><li><strong>استهلاك: 115W فقط</strong> — كفاءة طاقة استثنائية</li><li><strong>PCIe 4.0 x16</strong> — متوافقة مع منصات Intel وAMD الحديثة</li></ul><p>الخيار المثالي لألعاب 1080p بمعدل إطارات مرتفع، تتناسب مع معالج i5-12400F أو Ryzen 5 5600X.</p>',
  },
  {
    name_en: 'NVIDIA GeForce RTX 4070 12GB GDDR6X',
    name_ar: 'كارت شاشة NVIDIA GeForce RTX 4070 12GB GDDR6X',
    brand: 'NVIDIA', category_id: CAT.gpu,
    price: 145000, compare_price: 158000, stock_qty: 5, is_featured: true,
    description_en: '<p>The <strong>RTX 4070</strong> targets 1440p gaming at high refresh rates, packing <strong>12GB GDDR6X</strong> VRAM and the full Ada Lovelace feature set including DLSS 3 and Frame Generation.</p><ul><li><strong>5888 CUDA Cores</strong> — handles 1440p ultra settings with ease</li><li><strong>12GB GDDR6X @ 192-bit</strong> — ample VRAM for modern AAA titles</li><li><strong>TDP: 200W</strong> — efficient performance per watt</li><li><strong>AV1 encode/decode</strong> — ideal for content creators and streamers</li></ul><p>Best suited for 1440p 165Hz setups. Pairs well with an i7-13700K or Ryzen 7 7700X.</p>',
    description_ar: '<p><strong>RTX 4070</strong> مصممة لألعاب 1440p بمعدل إطارات مرتفع، مع <strong>12GB GDDR6X</strong> ودعم DLSS 3 وتوليد الإطارات.</p><ul><li><strong>5888 نواة CUDA</strong> — تتعامل مع إعدادات Ultra في 1440p بسهولة</li><li><strong>12GB GDDR6X / 192-bit</strong> — ذاكرة وفيرة للألعاب الحديثة</li><li><strong>استهلاك: 200W</strong> — كفاءة عالية مقارنة بالأداء</li><li><strong>ترميز AV1</strong> — مثالية للمصممين وصانعي المحتوى</li></ul><p>الخيار الأمثل لشاشات 1440p 165Hz. تناسب معالج i7-13700K أو Ryzen 7 7700X.</p>',
  },
  {
    name_en: 'AMD Radeon RX 6600 8GB GDDR6',
    name_ar: 'كارت شاشة AMD Radeon RX 6600 8GB GDDR6',
    brand: 'AMD', category_id: CAT.gpu,
    price: 55000, compare_price: 62000, stock_qty: 12,
    description_en: '<p>The <strong>RX 6600</strong> is AMD\'s value champion for 1080p gaming, delivering competitive frame rates on RDNA 2 architecture with <strong>8GB GDDR6</strong> and excellent driver support.</p><ul><li><strong>1792 Stream Processors</strong> on RDNA 2 architecture</li><li><strong>8GB GDDR6 / 128-bit</strong> — sufficient for 1080p ultra settings</li><li><strong>TDP: 132W</strong> — runs cool and quiet with a basic 550W PSU</li><li><strong>Smart Access Memory (SAM)</strong> — extra performance on AMD platforms</li></ul><p>Great value pick for budget 1080p gaming builds under 120.000 DZD.</p>',
    description_ar: '<p><strong>RX 6600</strong> هي بطل القيمة من AMD لألعاب 1080p، تقدم معدلات إطارات تنافسية على معمارية RDNA 2 مع <strong>8GB GDDR6</strong>.</p><ul><li><strong>1792 Stream Processor</strong> على معمارية RDNA 2</li><li><strong>8GB GDDR6 / 128-bit</strong> — كافية لإعدادات Ultra في 1080p</li><li><strong>استهلاك: 132W</strong> — تعمل بهدوء مع مزود طاقة 550W</li><li><strong>Smart Access Memory</strong> — أداء إضافي على منصة AMD</li></ul><p>اختيار ممتاز للبنيات الاقتصادية دون 120.000 دج.</p>',
  },
  {
    name_en: 'AMD Radeon RX 7600 8GB GDDR6',
    name_ar: 'كارت شاشة AMD Radeon RX 7600 8GB GDDR6',
    brand: 'AMD', category_id: CAT.gpu,
    price: 72000, stock_qty: 7,
    description_en: '<p>Built on <strong>RDNA 3</strong> architecture, the <strong>RX 7600</strong> brings AMD\'s latest generation efficiency to the mainstream segment with strong 1080p and entry-level 1440p performance.</p><ul><li><strong>2048 Stream Processors</strong> — RDNA 3 for better performance per watt</li><li><strong>8GB GDDR6 / 128-bit</strong> — handles modern titles at 1080p high</li><li><strong>TDP: 165W</strong> — fits in compact builds</li><li><strong>DisplayPort 2.1</strong> — future-proof display connectivity</li></ul><p>Solid mid-range GPU for gamers looking to upgrade from older cards.</p>',
    description_ar: '<p>مبنية على معمارية <strong>RDNA 3</strong>، تجلب <strong>RX 7600</strong> كفاءة الجيل الجديد من AMD مع أداء قوي في 1080p.</p><ul><li><strong>2048 Stream Processor</strong> — RDNA 3 لأداء أفضل لكل وات</li><li><strong>8GB GDDR6 / 128-bit</strong> — تتعامل مع الألعاب الحديثة بدقة 1080p</li><li><strong>استهلاك: 165W</strong> — مناسبة للهياكل المدمجة</li><li><strong>DisplayPort 2.1</strong> — اتصال شاشة مستقبلي</li></ul><p>كارت شاشة متوسط الرتبة ممتاز للترقية من البطاقات القديمة.</p>',
  },

  // ── CPUs ──────────────────────────────────────────────────────────────
  {
    name_en: 'Intel Core i5-12400F Processor',
    name_ar: 'معالج Intel Core i5-12400F',
    brand: 'Intel', category_id: CAT.cpu,
    price: 32000, compare_price: 38000, stock_qty: 15, is_featured: true,
    description_en: '<p>The <strong>Intel Core i5-12400F</strong> is the go-to mid-range CPU for gaming builds on a budget, delivering strong single-core performance on the Alder Lake architecture without integrated graphics.</p><ul><li><strong>6 Cores / 12 Threads</strong> — handles gaming, streaming and multitasking simultaneously</li><li><strong>Base: 2.5 GHz / Boost: 4.4 GHz</strong> — excellent gaming responsiveness</li><li><strong>18MB Intel Smart Cache</strong> — reduces latency in fast-paced titles</li><li><strong>TDP: 65W</strong> — runs cool with any aftermarket cooler</li><li><strong>Socket: LGA 1700</strong> — compatible with B660, H670, Z690 motherboards</li></ul><p>Best value CPU for gaming in Algeria right now. No iGPU so a dedicated GPU is required. Pairs perfectly with B660 motherboards.</p>',
    description_ar: '<p><strong>Intel Core i5-12400F</strong> هو المعالج المتوسط المثالي لبنيات الألعاب الاقتصادية، يقدم أداءً أحادي النواة قوياً على معمارية Alder Lake دون رسوميات مدمجة.</p><ul><li><strong>6 أنوية / 12 خيط</strong> — يتعامل مع الألعاب والبث والمهام المتعددة معاً</li><li><strong>قاعدة: 2.5 GHz / تعزيز: 4.4 GHz</strong> — استجابة ممتازة في الألعاب</li><li><strong>18MB Intel Smart Cache</strong> — يقلل الكمون في الألعاب السريعة</li><li><strong>TDP: 65W</strong> — يعمل بهدوء مع أي مبرد aftermarket</li><li><strong>Socket: LGA 1700</strong> — متوافق مع لوحات B660 وH670 وZ690</li></ul><p>أفضل قيمة للمعالجات في الجزائر حالياً. يتطلب كارت شاشة مستقل. يتناسب مع لوحات B660.</p>',
  },
  {
    name_en: 'Intel Core i7-13700K Processor',
    name_ar: 'معالج Intel Core i7-13700K',
    brand: 'Intel', category_id: CAT.cpu,
    price: 82000, compare_price: 92000, stock_qty: 6, is_featured: true,
    description_en: '<p>The <strong>Intel Core i7-13700K</strong> is a powerhouse Raptor Lake processor combining 8 P-cores and 8 E-cores for unmatched multitasking, content creation and gaming performance.</p><ul><li><strong>16 Cores (8P+8E) / 24 Threads</strong> — dominates content creation and heavy multitasking</li><li><strong>P-Core Boost: 5.4 GHz</strong> — one of the highest single-core clocks available</li><li><strong>30MB Intel Smart Cache</strong> — massive cache for latency-sensitive workloads</li><li><strong>TDP: 125W (253W PL2)</strong> — requires a high-end Z790 board and 240mm+ AIO</li><li><strong>Socket: LGA 1700</strong> — compatible with Z690 and Z790 motherboards</li></ul><p>The top pick for high-end gaming and streaming simultaneously. Requires a Z790 motherboard and robust cooling solution.</p>',
    description_ar: '<p><strong>Intel Core i7-13700K</strong> معالج Raptor Lake قوي يجمع بين 8 أنوية P و8 أنوية E لأداء لا مثيل له في المهام المتعددة وإنشاء المحتوى والألعاب.</p><ul><li><strong>16 نواة (8P+8E) / 24 خيط</strong> — يتفوق في إنشاء المحتوى والمهام الثقيلة</li><li><strong>تعزيز P-Core: 5.4 GHz</strong> — من أعلى ترددات النواة المفردة المتاحة</li><li><strong>30MB Intel Smart Cache</strong> — ذاكرة ضخمة للمهام الحساسة للكمون</li><li><strong>TDP: 125W (253W PL2)</strong> — يتطلب لوحة Z790 عالية الجودة ومبرد AIO 240mm+</li><li><strong>Socket: LGA 1700</strong> — متوافق مع لوحات Z690 وZ790</li></ul><p>الخيار الأول للألعاب عالية المستوى والبث المتزامن. يتطلب لوحة Z790 وتبريداً قوياً.</p>',
  },
  {
    name_en: 'AMD Ryzen 5 5600X Processor',
    name_ar: 'معالج AMD Ryzen 5 5600X',
    brand: 'AMD', category_id: CAT.cpu,
    price: 28000, compare_price: 34000, stock_qty: 18,
    description_en: '<p>The <strong>AMD Ryzen 5 5600X</strong> remains one of the best gaming CPUs ever made, offering exceptional single-core performance on the Zen 3 architecture with a manageable 65W TDP.</p><ul><li><strong>6 Cores / 12 Threads</strong> — effortless 1080p and 1440p gaming performance</li><li><strong>Base: 3.7 GHz / Boost: 4.6 GHz</strong> — snappy responsiveness in competitive titles</li><li><strong>35MB Total Cache (L2+L3)</strong> — Zen 3\'s massive cache advantage</li><li><strong>TDP: 65W</strong> — runs on any 500-series AM4 board with basic cooler</li><li><strong>Socket: AM4</strong> — huge motherboard ecosystem, great value options available</li></ul><p>Perfect for budget AM4 builds. Compatible with all 500-series motherboards. Wraith Stealth cooler included.</p>',
    description_ar: '<p><strong>AMD Ryzen 5 5600X</strong> لا يزال من أفضل معالجات الألعاب على الإطلاق، يقدم أداءً استثنائياً للنواة المفردة على معمارية Zen 3 باستهلاك 65W فقط.</p><ul><li><strong>6 أنوية / 12 خيط</strong> — أداء سلس في الألعاب بدقة 1080p و1440p</li><li><strong>قاعدة: 3.7 GHz / تعزيز: 4.6 GHz</strong> — استجابة سريعة في الألعاب التنافسية</li><li><strong>35MB Cache إجمالي (L2+L3)</strong> — ميزة الذاكرة المخبئية الضخمة من Zen 3</li><li><strong>TDP: 65W</strong> — يعمل على أي لوحة AM4 من الجيل الخامس بمبرد بسيط</li><li><strong>Socket: AM4</strong> — منظومة واسعة من اللوحات الأم بأسعار مناسبة</li></ul><p>مثالي لبنيات AM4 الاقتصادية. يشمل مبرد Wraith Stealth.</p>',
  },
  {
    name_en: 'AMD Ryzen 7 7700X Processor',
    name_ar: 'معالج AMD Ryzen 7 7700X',
    brand: 'AMD', category_id: CAT.cpu,
    price: 68000, compare_price: 78000, stock_qty: 9,
    description_en: '<p>The <strong>AMD Ryzen 7 7700X</strong> brings Zen 4 architecture to the mainstream with DDR5 support, PCIe 5.0, and blistering single-core performance that rivals Intel\'s best.</p><ul><li><strong>8 Cores / 16 Threads</strong> — ideal for gaming and content creation simultaneously</li><li><strong>Base: 4.5 GHz / Boost: 5.4 GHz</strong> — class-leading clock speeds on Zen 4</li><li><strong>40MB Total Cache</strong> — larger L2 cache for improved gaming latency</li><li><strong>TDP: 105W</strong> — requires a 240mm AIO or high-end air cooler</li><li><strong>Socket: AM5</strong> — future-proof platform with DDR5 and PCIe 5.0 support</li></ul><p>The best Ryzen for high-end AM5 gaming builds. Pairs with X670E or B650 motherboards.</p>',
    description_ar: '<p><strong>AMD Ryzen 7 7700X</strong> يجلب معمارية Zen 4 للمستخدمين العاديين مع دعم DDR5 وPCIe 5.0 وأداء نواة مفردة يضاهي أفضل معالجات Intel.</p><ul><li><strong>8 أنوية / 16 خيط</strong> — مثالي للألعاب وإنشاء المحتوى في آنٍ واحد</li><li><strong>قاعدة: 4.5 GHz / تعزيز: 5.4 GHz</strong> — تردد عالٍ رائد على Zen 4</li><li><strong>40MB Cache إجمالي</strong> — L2 Cache أكبر لتقليل الكمون في الألعاب</li><li><strong>TDP: 105W</strong> — يتطلب مبرد AIO 240mm أو مبرد هوائي متقدم</li><li><strong>Socket: AM5</strong> — منصة مستقبلية تدعم DDR5 وPCIe 5.0</li></ul><p>الأفضل لبنيات AM5 عالية المستوى. يتناسب مع لوحات X670E أو B650.</p>',
  },

  // ── RAM ───────────────────────────────────────────────────────────────
  {
    name_en: 'Corsair Vengeance 16GB DDR4 3200MHz (2x8GB)',
    name_ar: 'ذاكرة Corsair Vengeance 16GB DDR4 3200MHz',
    brand: 'Corsair', category_id: CAT.ram,
    price: 11000, compare_price: 14000, stock_qty: 25, is_featured: true,
    description_en: '<p>The <strong>Corsair Vengeance 16GB DDR4 3200MHz</strong> kit is the staple RAM choice for AM4 and LGA1700 builds, offering reliable dual-channel performance at an accessible price point.</p><ul><li><strong>16GB (2×8GB)</strong> — dual-channel configuration for maximum bandwidth</li><li><strong>3200MHz CL16</strong> — sweet spot for DDR4 gaming performance</li><li><strong>XMP 2.0 support</strong> — one-click overclock in BIOS</li><li><strong>Low-profile heatspreader</strong> — clears most CPU air coolers</li></ul><p>Compatible with all DDR4 platforms including AM4 (Ryzen 3000/5000) and LGA1700 (Intel 12th/13th Gen).</p>',
    description_ar: '<p>كيت <strong>Corsair Vengeance 16GB DDR4 3200MHz</strong> هو الخيار الأساسي للذاكرة في بنيات AM4 وLGA1700، يقدم أداء dual-channel موثوقاً بسعر مناسب.</p><ul><li><strong>16GB (2×8GB)</strong> — تكوين dual-channel لأقصى عرض نطاق ترددي</li><li><strong>3200MHz CL16</strong> — النقطة المثلى لأداء DDR4 في الألعاب</li><li><strong>دعم XMP 2.0</strong> — رفع تردد تلقائي بنقرة واحدة في الـBIOS</li><li><strong>مشتت حرارة منخفض الارتفاع</strong> — يناسب معظم مبردات الهواء</li></ul><p>متوافق مع جميع منصات DDR4 بما فيها AM4 وLGA1700.</p>',
  },
  {
    name_en: 'Kingston Fury Beast 32GB DDR4 3200MHz (2x16GB)',
    name_ar: 'ذاكرة Kingston Fury Beast 32GB DDR4 3200MHz',
    brand: 'Kingston', category_id: CAT.ram,
    price: 21000, compare_price: 25000, stock_qty: 14,
    description_en: '<p>The <strong>Kingston Fury Beast 32GB DDR4</strong> kit delivers ample memory for content creation, 3D rendering, and heavy multitasking without breaking the bank.</p><ul><li><strong>32GB (2×16GB)</strong> — future-proofs your build for memory-intensive workloads</li><li><strong>3200MHz CL16</strong> — optimized for AMD and Intel platforms</li><li><strong>Intel XMP 2.0 / AMD EXPO ready</strong> — plug-and-play overclocking</li><li><strong>Plug N Play auto-overclocking</strong> — detects platform and sets optimal settings</li></ul><p>Recommended for video editors, 3D artists, and streamers running multiple applications simultaneously.</p>',
    description_ar: '<p>كيت <strong>Kingston Fury Beast 32GB DDR4</strong> يوفر ذاكرة كافية لإنشاء المحتوى والتصيير ثلاثي الأبعاد والمهام المتعددة الثقيلة.</p><ul><li><strong>32GB (2×16GB)</strong> — يضمن مستقبل بنيتك للمهام كثيفة الذاكرة</li><li><strong>3200MHz CL16</strong> — محسّن لمنصات AMD وIntel</li><li><strong>XMP 2.0 / AMD EXPO جاهز</strong> — رفع تردد تلقائي plug-and-play</li><li><strong>كشف تلقائي للمنصة</strong> — يضبط الإعدادات المثلى تلقائياً</li></ul><p>موصى به لمحرري الفيديو والمصممين ثلاثيي الأبعاد وصانعي المحتوى.</p>',
  },
  {
    name_en: 'G.Skill Ripjaws S5 16GB DDR5 5600MHz (2x8GB)',
    name_ar: 'ذاكرة G.Skill Ripjaws S5 16GB DDR5 5600MHz',
    brand: 'G.Skill', category_id: CAT.ram,
    price: 19000, stock_qty: 10,
    description_en: '<p>The <strong>G.Skill Ripjaws S5 DDR5 5600MHz</strong> kit is designed for next-gen AM5 and Intel 12th/13th Gen platforms, offering a significant bandwidth leap over DDR4.</p><ul><li><strong>16GB (2×8GB)</strong> — dual-channel DDR5 for optimal gaming bandwidth</li><li><strong>5600MHz CL36</strong> — fast DDR5 speed with tight timings</li><li><strong>Intel XMP 3.0 / AMD EXPO</strong> — easy one-click profile activation</li><li><strong>On-die ECC</strong> — improved memory reliability and stability</li></ul><p>Required for AM5 (Ryzen 7000) builds and compatible with Intel 13th Gen Z790 boards.</p>',
    description_ar: '<p>كيت <strong>G.Skill Ripjaws S5 DDR5 5600MHz</strong> مصمم لمنصات AM5 وIntel الجيل الثالث عشر، يقدم قفزة كبيرة في عرض النطاق الترددي مقارنة بـDDR4.</p><ul><li><strong>16GB (2×8GB)</strong> — dual-channel DDR5 لأقصى عرض نطاق في الألعاب</li><li><strong>5600MHz CL36</strong> — سرعة DDR5 مرتفعة مع توقيتات ضيقة</li><li><strong>XMP 3.0 / AMD EXPO</strong> — تفعيل ملف تعريف بنقرة واحدة</li><li><strong>On-die ECC</strong> — موثوقية واستقرار أفضل للذاكرة</li></ul><p>ضروري لبنيات AM5 (Ryzen 7000) ومتوافق مع لوحات Z790 من Intel الجيل الثالث عشر.</p>',
  },

  // ── STORAGE ───────────────────────────────────────────────────────────
  {
    name_en: 'Samsung 970 EVO Plus 1TB NVMe SSD',
    name_ar: 'قرص Samsung 970 EVO Plus 1TB NVMe SSD',
    brand: 'Samsung', category_id: CAT.storage,
    price: 18000, compare_price: 22000, stock_qty: 20, is_featured: true,
    description_en: '<p>The <strong>Samsung 970 EVO Plus 1TB</strong> is a flagship PCIe 3.0 NVMe SSD that delivers blazing sequential speeds and best-in-class reliability backed by Samsung\'s 5-year warranty.</p><ul><li><strong>Sequential Read: 3,500 MB/s / Write: 3,300 MB/s</strong> — dramatically faster than SATA SSDs</li><li><strong>1TB storage</strong> — fits your OS, games library, and project files</li><li><strong>V-NAND TLC with Samsung DRAM cache</strong> — consistent performance under sustained load</li><li><strong>M.2 2280 (PCIe 3.0 x4)</strong> — fits all modern motherboards</li></ul><p>Excellent choice for OS drives and game storage. 5-year manufacturer warranty included.</p>',
    description_ar: '<p><strong>Samsung 970 EVO Plus 1TB</strong> هو SSD NVMe رائد من نوع PCIe 3.0 يقدم سرعات تسلسلية مذهلة وموثوقية لا مثيل لها مدعومة بضمان 5 سنوات من Samsung.</p><ul><li><strong>قراءة: 3,500 MB/s / كتابة: 3,300 MB/s</strong> — أسرع بكثير من SATA SSD</li><li><strong>1TB تخزين</strong> — يكفي لنظام التشغيل ومكتبة الألعاب وملفات المشاريع</li><li><strong>V-NAND TLC مع DRAM Cache</strong> — أداء ثابت تحت الأحمال المستمرة</li><li><strong>M.2 2280 (PCIe 3.0 x4)</strong> — يتناسب مع جميع اللوحات الأم الحديثة</li></ul><p>خيار ممتاز لأقراص نظام التشغيل وتخزين الألعاب. يشمل ضمان 5 سنوات.</p>',
  },
  {
    name_en: 'WD Black SN770 500GB NVMe SSD',
    name_ar: 'قرص WD Black SN770 500GB NVMe SSD',
    brand: 'WD', category_id: CAT.storage,
    price: 9000, compare_price: 11000, stock_qty: 22,
    description_en: '<p>The <strong>WD Black SN770 500GB</strong> is a high-performance PCIe 4.0 NVMe SSD that punches well above its price, offering Gen4 speeds without a DRAM cache premium.</p><ul><li><strong>Sequential Read: 5,150 MB/s / Write: 4,900 MB/s</strong> — full PCIe 4.0 performance</li><li><strong>500GB</strong> — perfect for OS and primary game installs</li><li><strong>M.2 2280 (PCIe 4.0 x4)</strong> — requires PCIe 4.0 slot (Ryzen 5000+ or Intel 12th Gen+)</li><li><strong>No DRAM cache</strong> — relies on HMB for cost efficiency</li></ul><p>Best budget PCIe 4.0 SSD available. Ideal for a fast Windows boot drive.</p>',
    description_ar: '<p><strong>WD Black SN770 500GB</strong> هو SSD NVMe عالي الأداء من نوع PCIe 4.0 يقدم أداءً استثنائياً مقارنة بسعره.</p><ul><li><strong>قراءة: 5,150 MB/s / كتابة: 4,900 MB/s</strong> — أداء PCIe 4.0 كامل</li><li><strong>500GB</strong> — مثالي لنظام التشغيل وتثبيت الألعاب الأساسية</li><li><strong>M.2 2280 (PCIe 4.0 x4)</strong> — يتطلب فتحة PCIe 4.0</li><li><strong>بدون DRAM Cache</strong> — يعتمد على HMB للكفاءة الاقتصادية</li></ul><p>أفضل SSD اقتصادي من نوع PCIe 4.0. مثالي كقرص تشغيل سريع.</p>',
  },
  {
    name_en: 'Seagate Barracuda 2TB 7200RPM HDD',
    name_ar: 'قرص Seagate Barracuda 2TB HDD',
    brand: 'Seagate', category_id: CAT.storage,
    price: 7500, stock_qty: 30,
    description_en: '<p>The <strong>Seagate Barracuda 2TB</strong> is the reliable mass storage solution for games, backups, and media libraries, offering large capacity at an unbeatable price-per-GB.</p><ul><li><strong>2TB capacity</strong> — stores 50+ AAA games alongside your files</li><li><strong>7200 RPM</strong> — faster than 5400 RPM budget drives</li><li><strong>256MB cache buffer</strong> — smooth sequential transfers</li><li><strong>SATA III 6Gb/s</strong> — compatible with every motherboard</li></ul><p>Use alongside an NVMe SSD for the best combo: fast boot/game drive + large bulk storage.</p>',
    description_ar: '<p><strong>Seagate Barracuda 2TB</strong> هو حل التخزين الضخم الموثوق للألعاب والنسخ الاحتياطية ومكتبات الوسائط.</p><ul><li><strong>سعة 2TB</strong> — يخزن 50+ لعبة AAA إلى جانب ملفاتك</li><li><strong>7200 RPM</strong> — أسرع من محركات 5400 RPM الاقتصادية</li><li><strong>ذاكرة تخزين مؤقت 256MB</strong> — نقل تسلسلي سلس</li><li><strong>SATA III 6Gb/s</strong> — متوافق مع كل لوحة أم</li></ul><p>استخدمه مع SSD NVMe للحصول على أفضل توليفة: قرص تشغيل سريع + تخزين ضخم.</p>',
  },

  // ── PSU ───────────────────────────────────────────────────────────────
  {
    name_en: 'Corsair RM750x 750W 80+ Gold Fully Modular PSU',
    name_ar: 'مزود طاقة Corsair RM750x 750W 80+ Gold',
    brand: 'Corsair', category_id: CAT.psu,
    price: 24000, compare_price: 28000, stock_qty: 12, is_featured: true,
    description_en: '<p>The <strong>Corsair RM750x 750W</strong> is a fully modular 80+ Gold PSU renowned for ultra-quiet operation and rock-solid reliability, suitable for mid-to-high-end builds.</p><ul><li><strong>750W continuous output</strong> — handles RTX 4070 + i7-13700K with headroom</li><li><strong>80+ Gold certified</strong> — up to 92% efficiency, lower electricity bills</li><strong>Fully modular</strong> — only attach cables you need for a cleaner build</li><li><strong>Zero RPM fan mode</strong> — completely silent under light loads</li><li><strong>10-year warranty</strong> — Corsair\'s industry-leading guarantee</li></ul><p>The safe, long-term PSU choice for any serious gaming or workstation build.</p>',
    description_ar: '<p><strong>Corsair RM750x 750W</strong> هو مزود طاقة 80+ Gold معياري الكابلات بالكامل، معروف بهدوئه الاستثنائي وموثوقيته العالية.</p><ul><li><strong>750W خرج مستمر</strong> — يدعم RTX 4070 + i7-13700K بهامش أمان</li><li><strong>شهادة 80+ Gold</strong> — كفاءة تصل إلى 92%، وفر في الكهرباء</li><li><strong>كابلات معيارية بالكامل</strong> — ركّب الكابلات التي تحتاجها فقط لبنية أنظف</li><li><strong>وضع Zero RPM</strong> — صامت تماماً تحت الأحمال الخفيفة</li><li><strong>ضمان 10 سنوات</strong> — الضمان الأطول في الصناعة</li></ul><p>الخيار الآمن طويل الأمد لأي بنية ألعاب أو محطة عمل جادة.</p>',
  },
  {
    name_en: 'Seasonic Focus GX-650 650W 80+ Gold Fully Modular PSU',
    name_ar: 'مزود طاقة Seasonic Focus GX-650 650W 80+ Gold',
    brand: 'Seasonic', category_id: CAT.psu,
    price: 19000, stock_qty: 10,
    description_en: '<p>The <strong>Seasonic Focus GX-650</strong> brings Japanese capacitor quality and 80+ Gold efficiency to mid-range builds needing a dependable 650W fully modular supply.</p><ul><li><strong>650W continuous output</strong> — perfect for RTX 4060 + i5-12400F builds</li><li><strong>80+ Gold certified</strong> — ≥90% efficiency at 50% load</li><li><strong>Fully modular</strong> — clean cable management with no excess</li><li><strong>Hybrid Fan Control</strong> — fanless mode at loads below 30%</li><li><strong>10-year warranty</strong> — Seasonic\'s legendary reliability guarantee</li></ul><p>Recommended for builds with power draw between 350–550W. Great pairing with mid-range GPUs.</p>',
    description_ar: '<p><strong>Seasonic Focus GX-650</strong> يجلب جودة المكثفات اليابانية وكفاءة 80+ Gold لبنيات الفئة المتوسطة التي تحتاج إلى مزود طاقة موثوق 650W.</p><ul><li><strong>650W خرج مستمر</strong> — مثالي لبنيات RTX 4060 + i5-12400F</li><li><strong>شهادة 80+ Gold</strong> — كفاءة ≥90% عند 50% من الحمل</li><li><strong>كابلات معيارية بالكامل</strong> — إدارة كابلات نظيفة بدون زوائد</li><li><strong>تحكم هجين بالمروحة</strong> — وضع بدون مروحة عند أحمال أقل من 30%</li><li><strong>ضمان 10 سنوات</strong> — ضمان Seasonic الأسطوري</li></ul><p>موصى به للبنيات ذات استهلاك 350–550W. توليفة رائعة مع GPUs متوسطة المستوى.</p>',
  },

  // ── COOLING ───────────────────────────────────────────────────────────
  {
    name_en: 'Noctua NH-D15 Dual Tower CPU Air Cooler',
    name_ar: 'مبرد هواء Noctua NH-D15 Dual Tower',
    brand: 'Noctua', category_id: CAT.cooling,
    price: 15500, compare_price: 18000, stock_qty: 8,
    description_en: '<p>The <strong>Noctua NH-D15</strong> is the gold standard of CPU air cooling, competing with 280mm AIOs while running whisper-quiet thanks to dual NF-A15 fans.</p><ul><li><strong>Dual NF-A15 140mm fans</strong> — class-leading airflow with minimal noise</li><li><strong>TDP: up to 250W</strong> — handles overclocked i7-13700K and Ryzen 7 7700X</li><li><strong>Height: 165mm</strong> — fits most full and mid-tower cases</li><li><strong>Supports LGA1700, AM4, AM5</strong> — universal platform compatibility</li></ul><p>The last air cooler you\'ll ever need to buy. Backed by Noctua\'s 6-year warranty.</p>',
    description_ar: '<p><strong>Noctua NH-D15</strong> هو المعيار الذهبي لتبريد الهواء للمعالجات، ينافس مبردات AIO 280mm بصوت خافت جداً بفضل مرواحي NF-A15.</p><ul><li><strong>مرواحتا NF-A15 140mm</strong> — تدفق هواء رائد مع ضوضاء ضئيلة</li><li><strong>TDP: يصل إلى 250W</strong> — يتعامل مع i7-13700K المرفوع التردد و Ryzen 7 7700X</li><li><strong>الارتفاع: 165mm</strong> — يناسب معظم هياكل mid وfull tower</li><li><strong>يدعم LGA1700 وAM4 وAM5</strong> — توافق شامل مع المنصات</li></ul><p>آخر مبرد هواء ستحتاج لشرائه. مدعوم بضمان 6 سنوات من Noctua.</p>',
  },
  {
    name_en: 'DeepCool AK620 Dual Tower CPU Air Cooler',
    name_ar: 'مبرد هواء DeepCool AK620 Dual Tower',
    brand: 'DeepCool', category_id: CAT.cooling,
    price: 8500, stock_qty: 15,
    description_en: '<p>The <strong>DeepCool AK620</strong> delivers near-Noctua NH-D15 thermal performance at roughly half the price, making it the best value dual-tower air cooler on the market.</p><ul><li><strong>Dual 120mm fans with 6 heat pipes</strong> — exceptional heat dissipation</li><li><strong>TDP: up to 260W</strong> — sufficient for most non-overclocked flagship CPUs</li><li><strong>Height: 160mm</strong> — clears most mid-tower cases</li><li><strong>Supports LGA1700, AM4, AM5</strong> — wide platform support included</li></ul><p>Outstanding value for mid-to-high-end builds. Competes with AIOs at a fraction of the cost.</p>',
    description_ar: '<p><strong>DeepCool AK620</strong> يقدم أداءً حرارياً قريباً من Noctua NH-D15 بنصف السعر تقريباً، مما يجعله أفضل مبرد هواء ذو برجين من حيث القيمة.</p><ul><li><strong>مروحتان 120mm مع 6 heat pipes</strong> — تبديد حرارة استثنائي</li><li><strong>TDP: يصل إلى 260W</strong> — يكفي لمعظم المعالجات الرائدة دون رفع تردد</li><li><strong>الارتفاع: 160mm</strong> — يناسب معظم هياكل mid-tower</li><li><strong>يدعم LGA1700 وAM4 وAM5</strong> — دعم واسع للمنصات مدرج</li></ul><p>قيمة استثنائية للبنيات المتوسطة والعالية. ينافس مبردات AIO بكسر سعرها.</p>',
  },
  {
    name_en: 'NZXT Kraken X63 280mm AIO Liquid Cooler',
    name_ar: 'مبرد سائل NZXT Kraken X63 280mm',
    brand: 'NZXT', category_id: CAT.cooling,
    price: 29000, compare_price: 34000, stock_qty: 6,
    description_en: '<p>The <strong>NZXT Kraken X63 280mm</strong> combines powerful liquid cooling with RGB aesthetics, featuring a pump head LCD display and dual 140mm Aer P fans for top-tier thermal performance.</p><ul><li><strong>280mm radiator with 2×140mm fans</strong> — superior heat dissipation for high-TDP CPUs</li><li><strong>Infinity Mirror pump head</strong> — premium RGB aesthetics with CAM software control</li><li><strong>TDP: up to 300W</strong> — tames i7-13700K and Ryzen 9 7950X under load</li><li><strong>Supports LGA1700, AM4, AM5</strong> — broad platform compatibility</li></ul><p>The premium choice for builders who want both maximum cooling and visual impact.</p>',
    description_ar: '<p><strong>NZXT Kraken X63 280mm</strong> يجمع بين التبريد السائل القوي والجماليات RGB، مع شاشة LCD على رأس المضخة ومروحتي 140mm Aer P.</p><ul><li><strong>مبرد 280mm مع 2×140mm مروحة</strong> — تبديد حرارة متفوق للمعالجات ذات TDP العالي</li><li><strong>رأس مضخة Infinity Mirror</strong> — جماليات RGB متميزة مع التحكم عبر برنامج CAM</li><li><strong>TDP: يصل إلى 300W</strong> — يروّض i7-13700K وRyzen 9 7950X تحت الحمل</li><li><strong>يدعم LGA1700 وAM4 وAM5</strong> — توافق واسع مع المنصات</li></ul><p>الخيار المتميز للمبنيين الذين يريدون أقصى تبريد وتأثيراً بصرياً.</p>',
  },

  // ── CASES ─────────────────────────────────────────────────────────────
  {
    name_en: 'NZXT H510 ATX Mid-Tower Case',
    name_ar: 'هيكل NZXT H510 ATX Mid-Tower',
    brand: 'NZXT', category_id: CAT.cases,
    price: 12500, compare_price: 15000, stock_qty: 10,
    description_en: '<p>The <strong>NZXT H510</strong> is a sleek, minimalist ATX mid-tower that set the standard for clean cable management and modern PC aesthetics, with a tempered glass side panel.</p><ul><li><strong>ATX mid-tower</strong> — fits ATX, mATX, and ITX motherboards</li><li><strong>Tempered glass side panel</strong> — showcases your build\'s components</li><li><strong>Cable management bar + routing channels</strong> — effortless clean builds</li><li><strong>2× pre-installed 120mm fans</strong> — adequate airflow out of the box</li><li><strong>Max GPU length: 381mm</strong> — fits all current-gen graphics cards</li></ul><p>Ideal for builders prioritizing aesthetics and clean cable management.</p>',
    description_ar: '<p><strong>NZXT H510</strong> هيكل ATX mid-tower أنيق بتصميم بسيط وضع معياراً لإدارة الكابلات النظيفة وجماليات الحاسوب الحديث، مع لوح جانبي من الزجاج المقسى.</p><ul><li><strong>ATX mid-tower</strong> — يستوعب لوحات ATX وmATX وITX</li><li><strong>لوح جانبي من الزجاج المقسى</strong> — يعرض مكونات بنيتك بشكل أنيق</li><li><strong>شريط إدارة الكابلات + قنوات التوجيه</strong> — بنيات نظيفة بجهد قليل</li><li><strong>مروحتان 120mm مثبتتان مسبقاً</strong> — تدفق هواء مناسب من الصندوق</li><li><strong>أقصى طول GPU: 381mm</strong> — يناسب جميع كروت الشاشة الحالية</li></ul><p>مثالي للمبنيين الذين يولون الأولوية للجماليات وإدارة الكابلات النظيفة.</p>',
  },
  {
    name_en: 'Fractal Design Meshify C ATX Mid-Tower Case',
    name_ar: 'هيكل Fractal Design Meshify C ATX Mid-Tower',
    brand: 'Fractal Design', category_id: CAT.cases,
    price: 14500, stock_qty: 8,
    description_en: '<p>The <strong>Fractal Design Meshify C</strong> is an airflow-focused ATX mid-tower with an angular mesh front panel that maximizes air intake while maintaining a compact footprint.</p><ul><li><strong>Angular mesh front panel</strong> — exceptional airflow for heat-generating components</li><li><strong>ATX mid-tower, compact form factor</strong> — smaller than most ATX cases</li><li><strong>2× pre-installed 120mm Dynamic X2 fans</strong> — quiet and efficient included fans</li><li><strong>Max GPU length: 315mm</strong> — fits all mainstream GPUs including RTX 4070</li><li><strong>Support for 360mm radiator</strong> — liquid cooling ready</li></ul><p>Best choice for builders with high-TDP components who need optimal airflow.</p>',
    description_ar: '<p><strong>Fractal Design Meshify C</strong> هيكل ATX mid-Tower يركز على تدفق الهواء مع واجهة أمامية شبكية زاوية تزيد من تناول الهواء مع الحفاظ على بصمة مدمجة.</p><ul><li><strong>واجهة أمامية شبكية زاوية</strong> — تدفق هواء استثنائي للمكونات عالية الحرارة</li><li><strong>ATX mid-tower، شكل مدمج</strong> — أصغر من معظم هياكل ATX</li><li><strong>مروحتان Dynamic X2 120mm مثبتتان مسبقاً</strong> — هادئتان وفعّالتان</li><li><strong>أقصى طول GPU: 315mm</strong> — يناسب كل GPUs السائدة بما فيها RTX 4070</li><li><strong>دعم مبرد 360mm</strong> — جاهز للتبريد السائل</li></ul><p>الخيار الأفضل للمبنيين ذوي المكونات عالية TDP الذين يحتاجون إلى تدفق هواء مثالي.</p>',
  },

  // ── MOTHERBOARDS ──────────────────────────────────────────────────────
  {
    name_en: 'ASUS Prime B660M-A DDR4 mATX Motherboard',
    name_ar: 'لوحة أم ASUS Prime B660M-A DDR4 mATX',
    brand: 'ASUS', category_id: CAT.motherboard,
    price: 22000, compare_price: 26000, stock_qty: 11,
    description_en: '<p>The <strong>ASUS Prime B660M-A</strong> is a reliable mATX motherboard for Intel 12th/13th Gen LGA1700 processors, offering solid VRM performance and DDR4 support at a compelling price.</p><ul><li><strong>Socket: LGA 1700</strong> — compatible with Intel 12th and 13th Gen Core processors</li><li><strong>DDR4 support up to 4800MHz</strong> — 4 DIMM slots, max 128GB RAM</li><li><strong>PCIe 4.0 x16 + M.2 NVMe slot</strong> — modern storage and GPU connectivity</li><li><strong>mATX form factor</strong> — fits compact mid-tower and mini-tower cases</li><li><strong>Realtek 2.5GbE LAN</strong> — fast wired networking included</li></ul><p>Perfect budget board for i5-12400F and i5-13400F builds. Solid for gaming and everyday use.</p>',
    description_ar: '<p><strong>ASUS Prime B660M-A</strong> لوحة أم mATX موثوقة لمعالجات Intel الجيل الثاني عشر والثالث عشر LGA1700، تقدم أداء VRM جيداً ودعم DDR4 بسعر مناسب.</p><ul><li><strong>Socket: LGA 1700</strong> — متوافقة مع معالجات Intel الجيل الثاني عشر والثالث عشر</li><li><strong>DDR4 حتى 4800MHz</strong> — 4 فتحات DIMM، حتى 128GB ذاكرة</li><li><strong>PCIe 4.0 x16 + فتحة M.2 NVMe</strong> — اتصال حديث للتخزين وكارت الشاشة</li><li><strong>شكل mATX</strong> — يناسب هياكل mid-tower وmini-tower المدمجة</li><li><strong>Realtek 2.5GbE LAN</strong> — شبكة سلكية سريعة مدرجة</li></ul><p>لوحة اقتصادية مثالية لبنيات i5-12400F وi5-13400F. ممتازة للألعاب والاستخدام اليومي.</p>',
  },
  {
    name_en: 'MSI MAG B550 TOMAHAWK ATX Motherboard',
    name_ar: 'لوحة أم MSI MAG B550 TOMAHAWK ATX',
    brand: 'MSI', category_id: CAT.motherboard,
    price: 26000, compare_price: 31000, stock_qty: 9,
    description_en: '<p>The <strong>MSI MAG B550 TOMAHAWK</strong> is a feature-rich ATX motherboard for AMD AM4 Ryzen 3000/5000 processors, combining robust power delivery with excellent connectivity.</p><ul><li><strong>Socket: AM4</strong> — compatible with Ryzen 3000, 4000, and 5000 series</li><li><strong>DDR4 support up to 4400MHz (OC)</strong> — 4 DIMM slots, max 128GB</li><li><strong>PCIe 4.0 x16 + dual M.2 NVMe slots</strong> — fast storage for OS and games</li><li><strong>2.5GbE Intel LAN + WiFi ready header</strong> — network flexibility</li><li><strong>12+2 phase VRM</strong> — handles Ryzen 7 5800X overclocking with ease</li></ul><p>The definitive B550 board for AMD Ryzen 5000 builds. Excellent long-term value.</p>',
    description_ar: '<p><strong>MSI MAG B550 TOMAHAWK</strong> لوحة أم ATX غنية بالميزات لمعالجات AMD AM4 Ryzen 3000/5000، تجمع بين إمداد الطاقة القوي والاتصال الممتاز.</p><ul><li><strong>Socket: AM4</strong> — متوافقة مع Ryzen 3000 و4000 و5000</li><li><strong>DDR4 حتى 4400MHz (OC)</strong> — 4 فتحات DIMM، حتى 128GB</li><li><strong>PCIe 4.0 x16 + فتحتا M.2 NVMe</strong> — تخزين سريع لنظام التشغيل والألعاب</li><li><strong>2.5GbE Intel LAN + رأس WiFi</strong> — مرونة في الشبكة</li><li><strong>مراحل طاقة VRM 12+2</strong> — يتعامل مع رفع تردد Ryzen 7 5800X بسهولة</li></ul><p>اللوحة النهائية من B550 لبنيات AMD Ryzen 5000. قيمة ممتازة على المدى البعيد.</p>',
  },
  {
    name_en: 'Gigabyte B650 AORUS Elite AX ATX Motherboard',
    name_ar: 'لوحة أم Gigabyte B650 AORUS Elite AX ATX',
    brand: 'Gigabyte', category_id: CAT.motherboard,
    price: 45000, compare_price: 52000, stock_qty: 5,
    description_en: '<p>The <strong>Gigabyte B650 AORUS Elite AX</strong> is a premium AM5 motherboard designed for Ryzen 7000 processors, delivering PCIe 5.0 storage, DDR5, Wi-Fi 6E, and robust 16+2+2 power stages.</p><ul><li><strong>Socket: AM5</strong> — future-proof platform for Ryzen 7000 series</li><li><strong>DDR5 support up to 7600MHz (OC)</strong> — 4 DIMM slots, max 192GB</li><li><strong>PCIe 5.0 M.2 slot</strong> — ready for next-gen storage speeds</li><li><strong>Wi-Fi 6E + 2.5GbE LAN</strong> — wired and wireless premium networking</li><li><strong>16+2+2 phase VRM</strong> — powers Ryzen 9 7950X without throttling</li></ul><p>The best value AM5 board for Ryzen 7 7700X and Ryzen 9 builds targeting performance longevity.</p>',
    description_ar: '<p><strong>Gigabyte B650 AORUS Elite AX</strong> لوحة أم AM5 متميزة مصممة لمعالجات Ryzen 7000، تقدم تخزين PCIe 5.0 وDDR5 وWi-Fi 6E ومراحل طاقة 16+2+2 قوية.</p><ul><li><strong>Socket: AM5</strong> — منصة مستقبلية لسلسلة Ryzen 7000</li><li><strong>DDR5 حتى 7600MHz (OC)</strong> — 4 فتحات DIMM، حتى 192GB</li><li><strong>فتحة M.2 PCIe 5.0</strong> — جاهزة لسرعات التخزين من الجيل القادم</li><li><strong>Wi-Fi 6E + 2.5GbE LAN</strong> — شبكة سلكية ولاسلكية متميزة</li><li><strong>مراحل طاقة VRM 16+2+2</strong> — تغذي Ryzen 9 7950X دون تقليل التردد</li></ul><p>أفضل لوحة AM5 بقيمة ممتازة لبنيات Ryzen 7 7700X وRyzen 9.</p>',
  },
];

async function seed() {
  console.log(`Inserting ${products.length} products...`);
  let success = 0, fail = 0;

  for (const p of products) {
    const { error } = await supabase.from('products').insert({
      name_en: p.name_en,
      name_ar: p.name_ar,
      slug: slug(p.name_en),
      description_en: p.description_en ?? null,
      description_ar: p.description_ar ?? null,
      price: p.price,
      compare_price: p.compare_price ?? null,
      stock_qty: p.stock_qty,
      brand: p.brand,
      category_id: p.category_id,
      is_featured: p.is_featured ?? false,
      is_active: true,
      images: [],
    });

    if (error) {
      console.error(`✗ ${p.name_en}: ${error.message}`);
      fail++;
    } else {
      console.log(`✓ ${p.name_en}`);
      success++;
    }
  }

  console.log(`\nDone: ${success} inserted, ${fail} failed.`);
}

seed();
