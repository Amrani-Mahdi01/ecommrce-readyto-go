-- WhatsApp conversation state for order flow
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  phone        TEXT PRIMARY KEY,
  state        TEXT NOT NULL DEFAULT 'idle',
  context      JSONB NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON whatsapp_conversations
  FOR ALL USING (true) WITH CHECK (true);
