import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// ── Types ────────────────────────────────────────────────────────────────────
type ConvState = 'idle' | 'collecting_name' | 'collecting_wilaya' | 'collecting_commune' | 'confirming';
type Lang = 'ar' | 'fr' | 'en';
interface ConvContext {
  product_id?: string;
  product_name?: string;
  product_price?: number;
  quantity?: number;
  full_name?: string;
  wilaya?: string;
  commune?: string;
  lang?: Lang;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function validateTwilioSignature(authToken: string, url: string, params: Record<string, string>, sig: string): boolean {
  const sortedKeys = Object.keys(params).sort();
  let toSign = url;
  for (const key of sortedKeys) toSign += key + (params[key] ?? '');
  const expected = crypto.createHmac('sha1', authToken).update(toSign).digest('base64');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}

function twiml(message: string, imageUrl?: string): NextResponse {
  const safe = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const media = imageUrl ? `<Media>${imageUrl}</Media>` : '';
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safe}${media}</Message></Response>`,
    { headers: { 'Content-Type': 'text/xml' } },
  );
}

function extractBudget(msg: string): number | null {
  const match = msg.match(/(\d[\d\s]*(?:[.,]\d+)?)\s*(?:da|dzd|dz|دج|دينار)/i);
  if (!match) return null;
  const amount = parseFloat(match[1].replace(/[\s,]/g, ''));
  return isNaN(amount) ? null : amount;
}

function findMostRelevantProduct(text: string, catalog: any[]): any | null {
  let best: any = null;
  let bestScore = 0;
  for (const p of catalog) {
    const name = (p.name_en ?? '').toLowerCase();
    const words = name.split(/\s+/).filter((w: string) => w.length > 2);
    const score = words.reduce((s: number, w: string) => s + (text.toLowerCase().includes(w) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = p; }
  }
  return bestScore >= 2 ? best : null;
}

// Detect language: Arabic script → ar, French keywords → fr, else en
function detectLang(msg: string): Lang {
  if (/[\u0600-\u06FF]/.test(msg)) return 'ar';
  if (/\b(je|tu|il|nous|vous|ils|bonjour|oui|non|merci|veux|acheter|commander|prix|produit|livraison|bghit|wach|chri|nchri|wakha|wah|safi|mzyan|kifach|bezzaf)\b/i.test(msg)) return 'fr';
  return 'en';
}

function detectOrderIntent(msg: string): boolean {
  return /\b(buy|order|purchase|want it|i'?ll take|take it|i want to buy|add to cart)\b/i.test(msg)
    // Arabic
    || /أريد شراء|اشتري|أطلب|طلبية|عايز|بغيت|نشري|نطلب|عاوز/.test(msg)
    // Darija (Latin)
    || /\b(bghit\s+n?chri|bghit\s+n?shri|nchri|nshri|3tini|chri\s+lia|ana\s+bghit|bghit\s+had)\b/i.test(msg)
    // French / Darija French
    || /\b(je\s+veux\s+(acheter|commander|prendre)|commander|acheter|passer\s+commande|je\s+prends)\b/i.test(msg);
}

function detectConfirm(msg: string): boolean {
  const m = msg.trim().toLowerCase();
  return /^(yes|yep|yeah|confirm|ok|okay|sure|yalla|alright)$/.test(m)
    // Arabic
    || /^(نعم|أكيد|موافق|تأكيد|ايوه|اه|صح|تمام|ماشي)$/.test(m)
    // Darija
    || /^(wah|ih|wakha|mzyan|sah|bssah|d'accord|daccord|oui|ouais|confirmer|valider)$/.test(m);
}

function detectCancel(msg: string): boolean {
  const m = msg.trim().toLowerCase();
  return /^(no|nope|cancel|stop|nevermind|nah)$/.test(m)
    // Arabic
    || /^(لا|إلغاء|الغاء|وقف|الغي)$/.test(m)
    // Darija
    || /^(la|safi|ma7ich|ma\s*bghitch|non|annuler|laisser\s+tomber)$/.test(m);
}

// Transcribe WhatsApp voice message via Groq Whisper
async function transcribeVoice(mediaUrl: string, accountSid: string, authToken: string, groqApiKey: string): Promise<string | null> {
  try {
    const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const audioRes = await fetch(mediaUrl, { headers: { 'Authorization': `Basic ${basicAuth}` } });
    if (!audioRes.ok) { console.error('[WA] audio download failed:', audioRes.status); return null; }

    const audioBlob = new Blob([await audioRes.arrayBuffer()], { type: 'audio/ogg' });
    const form = new FormData();
    form.append('file', audioBlob, 'voice.ogg');
    form.append('model', 'whisper-large-v3-turbo');
    form.append('response_format', 'text');
    // Hint helps with Algerian Darija (Arabic/French code-switching)
    form.append('prompt', 'Algerian dialect, may mix Arabic (Darija) and French. Product names like RTX, GPU, CPU, SSD may appear.');

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqApiKey}` },
      body: form,
    });
    if (!res.ok) { console.error('[WA] Whisper error:', await res.text()); return null; }
    const text = (await res.text()).trim();
    console.log('[WA] transcribed:', text);
    return text || null;
  } catch (err) {
    console.error('[WA] transcribe error:', err);
    return null;
  }
}

// ── i18n strings ─────────────────────────────────────────────────────────────
function t(key: string, lang: Lang, vars?: Record<string, string>): string {
  const strings: Record<string, Record<string, string>> = {
    ask_name: {
      ar: 'رائع! ما هو اسمك الكامل؟',
      fr: 'Super ! Quel est votre nom complet ?',
      en: 'Great! What\'s your full name?',
    },
    ask_wilaya: {
      ar: 'شكراً {name}! في أي ولاية تسكن؟',
      fr: 'Merci {name} ! Dans quelle wilaya habitez-vous ?',
      en: 'Thanks {name}! Which wilaya are you in?',
    },
    ask_commune: {
      ar: 'ممتاز! وما هي البلدية أو الحي؟',
      fr: 'Parfait ! Quelle est votre commune/quartier ?',
      en: 'Perfect! Which commune/neighborhood?',
    },
    order_summary: {
      ar: 'ملخص طلبك:\n\n- المنتج: {product}\n- الكمية: {qty}\n- السعر: {price} دج\n- الاسم: {name}\n- الولاية: {wilaya}\n- البلدية: {commune}\n- الدفع: عند الاستلام\n\nتأكيد؟ أرسل *نعم* أو *لا*',
      fr: 'Récapitulatif:\n\n- Produit: {product}\n- Qté: {qty}\n- Prix: {price} DA\n- Nom: {name}\n- Wilaya: {wilaya}\n- Commune: {commune}\n- Paiement: À la livraison\n\nConfirmer ? Répondez *OUI* ou *NON*',
      en: 'Order Summary:\n\n- Product: {product}\n- Qty: {qty}\n- Price: {price} DA\n- Name: {name}\n- Wilaya: {wilaya}\n- Commune: {commune}\n- Payment: Cash on Delivery\n\nConfirm? Reply *YES* or *NO*',
    },
    order_placed: {
      ar: 'تم تأكيد طلبك! 🎉\nرقم الطلب: *{orderNum}*\nسنتواصل معك قريباً.',
      fr: 'Commande confirmée ! 🎉\nNuméro de commande: *{orderNum}*\nNous vous contacterons bientôt.',
      en: 'Order placed! 🎉\nOrder number: *{orderNum}*\nWe\'ll contact you soon.',
    },
    order_cancelled: {
      ar: 'تم إلغاء الطلب. كيف يمكنني مساعدتك؟',
      fr: 'Commande annulée. Comment puis-je vous aider ?',
      en: 'Order cancelled. How can I help you?',
    },
    ask_which_product: {
      ar: 'أي منتج تريد طلبه؟ اذكر اسمه.',
      fr: 'Quel produit souhaitez-vous commander ? Mentionnez son nom.',
      en: 'Which product would you like to order? Please mention its name.',
    },
    voice_error: {
      ar: 'عذراً، ما فهمتش الرسالة الصوتية. أرسل رسالة نصية.',
      fr: 'Désolé, je n\'ai pas compris le message vocal. Envoyez un message texte.',
      en: 'Sorry, I could not understand the voice message. Please send a text message.',
    },
    order_error: {
      ar: 'حدث خطأ في إنشاء الطلب. حاول مجدداً.',
      fr: 'Une erreur s\'est produite. Veuillez réessayer.',
      en: 'Something went wrong creating your order. Please try again.',
    },
    groq_error: {
      ar: 'عذراً، خطأ مؤقت. حاول مجدداً.',
      fr: 'Désolé, erreur temporaire. Veuillez réessayer.',
      en: 'Sorry, a temporary error occurred. Please try again.',
    },
    confirm_again: {
      ar: 'أرسل *نعم* للتأكيد أو *لا* للإلغاء.',
      fr: 'Répondez *OUI* pour confirmer ou *NON* pour annuler.',
      en: 'Reply *YES* to confirm or *NO* to cancel.',
    },
  };
  let str = strings[key]?.[lang] ?? strings[key]?.['fr'] ?? strings[key]?.['en'] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  return str;
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params: Record<string, string> = {};
    formData.forEach((v, k) => { params[k] = v.toString(); });

    const supabase = await createServiceClient();

    // Load settings
    const { data: rows, error: settingsError } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['whatsapp_enabled', 'twilio_account_sid', 'twilio_auth_token', 'whatsapp_bot_name', 'groq_api_key']);

    if (settingsError) console.error('[WA] settings error:', settingsError.message);

    const cfg = Object.fromEntries((rows ?? []).map((r: any) => [r.key, r.value]));
    if (cfg['whatsapp_enabled'] !== 'true') return twiml('');

    const accountSid = cfg['twilio_account_sid'] ?? '';
    const authToken  = cfg['twilio_auth_token']  ?? '';
    const groqApiKey = cfg['groq_api_key'] || process.env.GROQ_API_KEY || '';
    const botName    = cfg['whatsapp_bot_name'] || 'Assistant';

    if (!groqApiKey) return twiml("I'm not set up yet. Please contact the store.");

    if (process.env.TWILIO_VALIDATE_SIGNATURE === 'true' && authToken) {
      const twilioSig = request.headers.get('x-twilio-signature') ?? '';
      if (twilioSig) {
        try {
          if (!validateTwilioSignature(authToken, request.url, params, twilioSig))
            return new NextResponse('Forbidden', { status: 403 });
        } catch { return new NextResponse('Forbidden', { status: 403 }); }
      }
    }

    // ── Handle voice messages ───────────────────────────────────────────────
    const numMedia  = parseInt(params['NumMedia'] ?? '0');
    const mediaType = params['MediaContentType0'] ?? '';
    const mediaUrl  = params['MediaUrl0'] ?? '';
    let userMessage = (params['Body'] ?? '').trim();

    if (numMedia > 0 && mediaType.startsWith('audio/') && mediaUrl) {
      const transcribed = await transcribeVoice(mediaUrl, accountSid, authToken, groqApiKey);
      if (transcribed) { userMessage = transcribed; }
      else { return twiml(/[\u0600-\u06FF]/.test(userMessage) ? t('voice_error', 'ar') : t('voice_error', 'en')); }
    }

    if (!userMessage) return twiml('');

    const fromPhone = (params['From'] ?? '').replace('whatsapp:', '');
    const lang: Lang = detectLang(userMessage);
    const isArabic   = lang === 'ar';

    // ── Load conversation state ─────────────────────────────────────────────
    const { data: convRow } = await supabase
      .from('whatsapp_conversations')
      .select('state, context')
      .eq('phone', fromPhone)
      .maybeSingle();

    const convState: ConvState  = (convRow?.state as ConvState) ?? 'idle';
    const convCtx: ConvContext  = (convRow?.context as ConvContext) ?? {};
    const convLang: Lang = convCtx.lang ?? lang;

    // Helper to persist state
    const saveState = async (state: ConvState, ctx: ConvContext) => {
      await supabase.from('whatsapp_conversations').upsert(
        { phone: fromPhone, state, context: ctx as unknown as import('@/types/database').Json, updated_at: new Date().toISOString() },
        { onConflict: 'phone' },
      );
    };

    // Allow "cancel" from any state
    if (convState !== 'idle' && detectCancel(userMessage)) {
      await saveState('idle', {});
      return twiml(t('order_cancelled', convLang));
    }

    // ── ORDER FLOW ──────────────────────────────────────────────────────────

    if (convState === 'collecting_name') {
      const name = userMessage.trim();
      await saveState('collecting_wilaya', { ...convCtx, full_name: name, lang: convLang });
      return twiml(t('ask_wilaya', convLang, { name }));
    }

    if (convState === 'collecting_wilaya') {
      await saveState('collecting_commune', { ...convCtx, wilaya: userMessage.trim(), lang: convLang });
      return twiml(t('ask_commune', convLang));
    }

    if (convState === 'collecting_commune') {
      const ctx = { ...convCtx, commune: userMessage.trim(), lang: convLang };
      await saveState('confirming', ctx);
      return twiml(t('order_summary', convLang, {
        product: ctx.product_name ?? '',
        qty:     String(ctx.quantity ?? 1),
        price:   Number(ctx.product_price ?? 0).toLocaleString(),
        name:    ctx.full_name ?? '',
        wilaya:  ctx.wilaya ?? '',
        commune: ctx.commune ?? '',
      }));
    }

    if (convState === 'confirming') {
      if (detectConfirm(userMessage)) {
        // Create order in Supabase
        const ctx = convCtx;
        const total = (ctx.product_price ?? 0) * (ctx.quantity ?? 1);
        const items = [{
          product_id: ctx.product_id ?? null,
          name:       ctx.product_name ?? '',
          price:      ctx.product_price ?? 0,
          qty:        ctx.quantity ?? 1,
        }];

        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            full_name:  ctx.full_name ?? '',
            phone:      fromPhone,
            wilaya:     ctx.wilaya ?? '',
            commune:    ctx.commune ?? '',
            total,
            items,
            status:     'placed',
            notes:      'Order placed via WhatsApp',
          })
          .select('order_number')
          .single();

        if (orderError) {
          console.error('[WA] order create error:', orderError.message);
          return twiml(t('order_error', convLang));
        }

        await saveState('idle', {});
        return twiml(t('order_placed', convLang, { orderNum: orderData.order_number }));
      }

      // If not confirm/cancel, remind
      return twiml(t('confirm_again', convLang));
    }

    // ── IDLE: normal chat OR start order flow ────────────────────────────────

    // Fetch product catalog
    const { data: catalog, error: catalogError } = await supabase
      .from('products')
      .select('id, name_en, name_ar, price, stock_qty, description_en, brand, images')
      .eq('is_active', true)
      .limit(50);

    if (catalogError) console.error('[WA] catalog error:', catalogError.message);
    console.log('[WA] catalog fetched:', catalog?.length ?? 0, 'products');

    const products = catalog ?? [];

    // Check order intent
    if (detectOrderIntent(userMessage)) {
      const product = findMostRelevantProduct(userMessage, products);
      if (product) {
        await saveState('collecting_name', {
          product_id:    product.id,
          product_name:  product.name_en,
          product_price: Number(product.price),
          quantity:      1,
          lang,
        });
        return twiml(`${lang === 'ar' ? `سيتم طلب: ${product.name_en} - ${Number(product.price).toLocaleString()} دج\n\n` : `Ordering: ${product.name_en} - ${Number(product.price).toLocaleString()} DA\n\n`}${t('ask_name', lang)}`);
      }
      // Can't identify product, ask which one
      await saveState('collecting_name', { lang });
      return twiml(t('ask_which_product', lang));
    }

    // ── Normal RAG chat ─────────────────────────────────────────────────────
    let filteredProducts = [...products];

    const budget = extractBudget(userMessage);
    if (budget && budget > 0) {
      const inBudget = filteredProducts.filter((p: any) => Number(p.price) <= budget);
      if (inBudget.length) filteredProducts = inBudget;
    }

    const productContext = filteredProducts.length
      ? 'STORE CATALOG (ONLY use these):\n' +
        filteredProducts.map((p: any) => {
          const hasImage = Array.isArray(p.images) && p.images.length > 0;
          return `- ${p.name_en}${p.brand ? ` (${p.brand})` : ''} — ${Number(p.price).toLocaleString()} DA | ${p.stock_qty > 0 ? `In stock (${p.stock_qty})` : 'Out of stock'} | ${hasImage ? 'Image available' : 'No image'}`;
        }).join('\n')
      : 'No products available.';

    const langLabel = lang === 'ar' ? 'Arabic or Darija (Algerian dialect)' : lang === 'fr' ? 'French or Darija mixed with French' : 'English';
    const systemPrompt = `You are ${botName}, a smart WhatsApp shopping assistant for an Algerian online PC parts store.
Language: respond ONLY in ${langLabel}. Match the customer's language exactly — if they mix Arabic and French (Darija), mix it back.
Prices in DA (Algerian Dinars).

CATEGORY KNOWLEDGE:
- GPU/graphics card/كارت شاشة → RTX, RX, Radeon, GeForce, Graphics Card
- CPU/processor/معالج → Intel, Core i3/i5/i7/i9, Ryzen, Processor
- RAM/memory/ذاكرة → DDR4, DDR5, GB RAM
- SSD/HDD/storage/تخزين → SSD, NVMe, HDD
- PSU/power supply/مزود طاقة → Watt, Gold, PSU
- Motherboard/لوحة أم → B550, Z690, ATX, Motherboard
- Cooler/مبرد → Cooler, Fan, AIO
- Monitor/شاشة → Monitor, Hz, 1080p, 4K

RULES:
- ONLY mention catalog products — never invent products or prices.
- For category questions: list ALL matching products.
- For budget questions: recommend best value within budget.
- For order requests: tell the customer to say "I want to buy [product name]" to start ordering.
- For order status: ask for order number (format NPC-XXXXXX).
- Keep replies under 200 words. Use plain dashes for lists.
- Mention image availability per product.

${productContext}`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
        max_tokens: 400,
        temperature: 0.4,
      }),
    });

    if (!groqRes.ok) {
      console.error('[WA] Groq error:', await groqRes.text());
      return twiml(t('groq_error', lang));
    }

    const groqData = await groqRes.json();
    const reply: string = groqData.choices?.[0]?.message?.content?.trim()
      ?? (isArabic ? 'كيف يمكنني مساعدتك؟' : 'How can I help you?');

    // Attach image of most relevant product
    let imageUrl: string | undefined;
    const imgMatch = findMostRelevantProduct(reply, products);
    console.log('[WA] image match:', imgMatch?.name_en, '| images:', JSON.stringify(imgMatch?.images));
    if (imgMatch?.images?.length) {
      imageUrl = imgMatch.images[0];
      console.log('[WA] sending image:', imageUrl);
    }

    return twiml(reply, imageUrl);

  } catch (err) {
    console.error('[WA] webhook error:', err);
    return twiml('Sorry, something went wrong. Please try again.');
  }
}
