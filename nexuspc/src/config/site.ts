export const siteConfig = {
  name: 'NexusPC',
  description_en: 'Algeria\'s premier gaming PC parts store — GPUs, CPUs, RAM, SSDs and more.',
  description_ar: 'متجر قطع الكمبيوتر الألعاب الأول في الجزائر — بطاقات الرسومات، المعالجات، الذاكرة والمزيد.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  ogImage: '/og.png',
  links: {
    instagram: 'https://instagram.com/nexuspc_dz',
    facebook: 'https://facebook.com/nexuspc.dz',
  },
} as const;
