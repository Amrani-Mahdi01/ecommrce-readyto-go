'use server';

import { getAIConfig } from '@/app/actions/settings';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL    = 'llama-3.3-70b-versatile';

export interface GenerateDescriptionInput {
  name_en: string;
  name_ar: string;
  brand: string;
  category: string;
  price: string;
  specs?: string;
}

export interface GenerateDescriptionResult {
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  error?: string;
}

export async function generateProductDescription(
  input: GenerateDescriptionInput,
): Promise<GenerateDescriptionResult> {
  const { enabled, apiKey } = await getAIConfig();
  if (!enabled) return { name_en: '', name_ar: '', description_en: '', description_ar: '', error: 'AI is disabled' };
  if (!apiKey) return { name_en: '', name_ar: '', description_en: '', description_ar: '', error: 'Groq API key not configured' };

  const { name_en, name_ar, brand, category, price, specs } = input;

  const specsBlock = specs?.trim()
    ? `- Tech Specs (provided by admin — USE THESE EXACTLY, do not invent anything beyond them):\n${specs.trim()}`
    : `- Tech Specs: not provided — only mention what can be confidently inferred from the product name. Skip any spec you are not certain about.`;

  const prompt = `You are a senior e-commerce SEO copywriter specializing in PC hardware. You write for a store in Algeria.

Product details:
- Name (EN): ${name_en}
- Name (AR): ${name_ar || ''}
- Brand: ${brand || 'N/A'}
- Category: ${category}
- Price: ${price ? price + ' DZD' : 'N/A'}
${specsBlock}

TASK 1 — TITLE:
- name_en: Clean SEO title. Include brand + exact model + category keyword. Max 70 chars. Title Case.
- name_ar: Natural Arabic product title, brand/model stays in Latin. Max 70 chars.

TASK 2 — DESCRIPTION (HTML):
Structure for BOTH languages:
1. One <p> opening: what this product is, its standout strength, who it's for. Be specific — use the actual product name and real specs.
2. One <ul> with 4–6 <li> items: each must state a concrete spec or benefit using the numbers/values from the specs provided. Use <strong> around the spec value. Example: <li><strong>6 Cores / 12 Threads</strong> — handles gaming and streaming simultaneously without bottlenecking.</li>
3. One closing <p>: ideal use case, what to pair it with, value proposition for the price.

Hard rules:
- NEVER write vague filler: banned phrases include "enhanced performance", "improved speeds", "efficient processing", "powerful experience", "high-performance computing".
- Every bullet must contain a real number or concrete fact — no bullet without a spec.
- English: 130–180 words. Direct, knowledgeable, zero fluff.
- Arabic: Same structure. Native Arabic tech writing — NOT a word-for-word translation. Natural vocabulary used by Arabic PC builders.
- Both descriptions must include the product name and brand as natural SEO keywords.

Return ONLY valid JSON, no markdown, no code fences:
{"name_en":"...","name_ar":"...","description_en":"...","description_ar":"..."}`;

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 2400,
      }),
    });

    if (!res.ok) {
      if (res.status === 429) {
        return { name_en: '', name_ar: '', description_en: '', description_ar: '', error: 'Rate limit reached — please wait a moment and try again.' };
      }
      const err = await res.json().catch(() => null);
      const msg = err?.error?.message ?? `HTTP ${res.status}`;
      return { name_en: '', name_ar: '', description_en: '', description_ar: '', error: `Groq: ${msg}` };
    }

    const json = await res.json();
    const text: string = json?.choices?.[0]?.message?.content ?? '';

    // Extract the first {...} block — handles extra text, code fences, or trailing content
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON object found in AI response');

    const parsed = JSON.parse(match[0]) as { name_en: string; name_ar: string; description_en: string; description_ar: string };
    return {
      name_en: parsed.name_en ?? '',
      name_ar: parsed.name_ar ?? '',
      description_en: parsed.description_en ?? '',
      description_ar: parsed.description_ar ?? '',
    };
  } catch (e: any) {
    return { name_en: '', name_ar: '', description_en: '', description_ar: '', error: e?.message ?? 'Unknown error' };
  }
}

// ── AI PC Build ─────────────────────────────────────────────────────────────

export type BuildPurpose = 'gaming' | 'office';

export interface SlimProduct {
  id: string;
  name: string;
  price: number;
}

export interface PCBuildInput {
  budget: number;
  purpose: BuildPurpose;
  productsBySlot: Record<string, SlimProduct[]>;
}

export interface PCBuildResult {
  selections: Partial<Record<string, string>>; // slot → product id
  reasons: Partial<Record<string, string>>;    // slot → one-line reason
  total: number;
  summary: string;
  error?: string;
}

export async function generatePCBuild(input: PCBuildInput): Promise<PCBuildResult> {
  const { enabled, apiKey } = await getAIConfig();
  const empty: PCBuildResult = { selections: {}, reasons: {}, total: 0, summary: '' };
  if (!enabled) return { ...empty, error: 'AI is disabled' };
  if (!apiKey) return { ...empty, error: 'Groq API key not configured' };

  const { budget, purpose, productsBySlot } = input;

  const purposeGuide: Record<BuildPurpose, string> = {
    gaming: 'Prioritize GPU (40–50% of budget) and CPU. RAM 16GB minimum. NVMe SSD. Then PSU, cooler, case.',
    office: 'Focus on CPU and RAM — a fast, reliable workstation. GPU is LOW priority: only add a GPU if significant budget (20,000 DZD+) remains after CPU, motherboard, RAM, PSU, storage, cooler, and case are all covered. If budget is tight, skip GPU entirely.',
  };

  // Build the catalog block
  const catalogLines: string[] = [];
  for (const [slot, products] of Object.entries(productsBySlot)) {
    if (!products.length) continue;
    catalogLines.push(`\n${slot.toUpperCase()}:`);
    products.forEach(p => {
      catalogLines.push(`  ${p.id} | ${p.name} | ${p.price.toLocaleString()} DZD`);
    });
  }

  const prompt = `You are an expert PC builder for a hardware store in Algeria.

BUILD REQUIREMENTS:
- Budget: ${budget.toLocaleString()} DZD (HARD LIMIT — total must not exceed this)
- Purpose: ${purpose.toUpperCase()}
- Budget allocation guide: ${purposeGuide[purpose]}

AVAILABLE COMPONENTS (format: id | name | price):
${catalogLines.join('\n')}

COMPATIBILITY RULES (strictly enforce):
- Intel LGA1700 CPU → must pick LGA1700 motherboard (B660, Z690, Z790)
- AMD AM4 CPU → must pick AM4 motherboard (B550, X570)
- AMD AM5 CPU → must pick AM5 motherboard (B650, X670)
- DDR5 RAM → only pair with DDR5 motherboard (B650, Z790)
- DDR4 RAM → only pair with DDR4 motherboard (B660, B550)
- PSU wattage must cover GPU TDP + CPU TDP + 150W headroom (RTX 4070 needs 750W, RTX 4060 needs 650W, RX 6600 needs 550W)
- Never pick RAM or motherboard without also picking a CPU
- Never pick a GPU without also picking a PSU

BUILD STRATEGY — follow this exactly:

PHASE 1 — CORE (always fill these first, in this order, before anything else):
  Step 1: cpu        ← pick first, everything depends on it
  Step 2: motherboard ← must be compatible with chosen CPU socket
  Step 3: ram        ← must be compatible with motherboard (DDR4 or DDR5)
  Step 4: psu        ← must have enough wattage for the whole system
  Step 5: storage    ← at least one drive for the OS

A PC without ALL 5 core components is not bootable. Never skip a core component to buy a GPU or case.
If the budget cannot cover all 5 core components, fill as many as possible in order 1→5 and stop.

PHASE 2 — EXTRAS (only add these if budget remains after Phase 1):
  For gaming: gpu → cooler → case
  For office: cooler → case → gpu (GPU is LAST for office — only add if 20,000+ DZD remains after everything else)

SMART EXAMPLES:
- Budget 100,000 DZD gaming: pick Ryzen 5 5600X (28k) + MSI B550 (26k) + Corsair 16GB DDR4 (11k) + Seasonic 650W (19k) + WD 500GB (9k) = 93k → remaining 7k not enough for GPU so skip it. Total: 93,000 DZD.
- Budget 40,000 DZD: pick cheapest CPU (28k) + cheapest RAM (11k) = 39k. No room for motherboard so skip. Or repick cheaper combo.
- Never do: CPU + GPU with no motherboard or RAM. That is NOT a valid build.

INSTRUCTIONS:
1. Follow Phase 1 strictly before considering any Phase 2 components.
2. For each slot you pick, verify the running total stays ≤ ${budget.toLocaleString()} DZD before adding it.
3. Write a one-sentence reason for each selected slot.
4. Write a 1-sentence summary of what this build can do.
5. It is perfectly fine to return only 2–3 components if budget is tight — just always prioritize the core.

Return ONLY valid JSON, no markdown, no extra text:
{
  "selections": { "cpu": "id", "motherboard": "id", "gpu": "id", "ram": "id", "storage": "id", "psu": "id", "case": "id", "cooler": "id" },
  "reasons": { "cpu": "reason", "motherboard": "reason", "gpu": "reason", "ram": "reason", "storage": "reason", "psu": "reason", "case": "reason", "cooler": "reason" },
  "total": 123456,
  "summary": "Overall build summary sentence"
}`;

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1200,
      }),
    });

    if (!res.ok) {
      if (res.status === 429) return { ...empty, error: 'Rate limit reached — wait a moment and try again.' };
      const err = await res.json().catch(() => null);
      return { ...empty, error: `Groq: ${err?.error?.message ?? `HTTP ${res.status}`}` };
    }

    const json = await res.json();
    const text: string = json?.choices?.[0]?.message?.content ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in AI response');

    const parsed = JSON.parse(match[0]) as PCBuildResult;
    return {
      selections: parsed.selections ?? {},
      reasons:    parsed.reasons ?? {},
      total:      parsed.total ?? 0,
      summary:    parsed.summary ?? '',
    };
  } catch (e: any) {
    return { ...empty, error: e?.message ?? 'Unknown error' };
  }
}
