-- One Key API Gateway Database Schema

-- Users table for authentication
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data (no direct SELECT policy - use edge functions)
CREATE POLICY "Users can read own profile via authenticated session"
  ON public.users FOR SELECT
  USING (false);

-- Providers table (Gemini, Groq, OpenAI, etc.)
CREATE TABLE public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  base_url TEXT,
  priority INTEGER NOT NULL DEFAULT 1,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on providers
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read providers
CREATE POLICY "Authenticated users can read providers"
  ON public.providers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage providers"
  ON public.providers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- API Keys table
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'exhausted')),
  priority INTEGER NOT NULL DEFAULT 1,
  requests_today INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on api_keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Only allow authenticated users to manage keys
CREATE POLICY "Authenticated users can read api_keys"
  ON public.api_keys FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage api_keys"
  ON public.api_keys FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Request logs table
CREATE TABLE public.request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'POST',
  status_code INTEGER,
  latency_ms INTEGER,
  request_size INTEGER,
  response_size INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on request_logs
ALTER TABLE public.request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read logs"
  ON public.request_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert logs"
  ON public.request_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Settings table for gateway configuration
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage settings"
  ON public.settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_providers_updated_at
  BEFORE UPDATE ON public.providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin user (password: admin - bcrypt hashed)
INSERT INTO public.users (username, password_hash, email)
VALUES ('admin', '$2a$10$rBV2JDeWw3wS.U8zL1sHoO4rXZMwmJMxj.hQ/Xt7N5yQzJU8N8.Hy', 'admin@onekey.local');

-- Insert default providers
INSERT INTO public.providers (name, slug, base_url, priority) VALUES
  ('Google Gemini', 'gemini', 'https://generativelanguage.googleapis.com', 1),
  ('Groq', 'groq', 'https://api.groq.com', 2),
  ('OpenAI Compatible', 'openai', 'https://api.openai.com', 3),
  ('Anthropic', 'anthropic', 'https://api.anthropic.com', 4);

-- Insert default settings
INSERT INTO public.settings (key, value) VALUES
  ('rotation_strategy', '"round-robin"'),
  ('failover_delay_ms', '0'),
  ('max_retries', '3'),
  ('quota_check_interval_seconds', '60'),
  ('auto_disable_exhausted', 'true'),
  ('log_retention_days', '30');