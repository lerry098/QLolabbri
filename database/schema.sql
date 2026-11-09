BEGIN;
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  corporate_id varchar(64) NOT NULL,
  user_id varchar(64) NOT NULL,
  name text NOT NULL,
  email varchar(254) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (corporate_id,user_id)
);
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('corporate','giro')),
  reference_number varchar(32) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS corporate_registrations (
  id uuid PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reference_number varchar(32) NOT NULL UNIQUE REFERENCES applications(reference_number),
  company_name text NOT NULL,
  business_type text NOT NULL,
  contact_email varchar(254) NOT NULL,
  product_type text,
  status text NOT NULL DEFAULT 'Diajukan' CHECK (status IN ('Diajukan','Dalam Peninjauan','Membutuhkan Perbaikan','Disetujui','Selesai')),
  details jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS giro_registrations (
  id uuid PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reference_number varchar(32) NOT NULL UNIQUE REFERENCES applications(reference_number),
  company_name text NOT NULL,
  business_type text NOT NULL,
  contact_email varchar(254) NOT NULL,
  product_type text NOT NULL CHECK (product_type IN ('Giro Rupiah','Giro Valas')),
  status text NOT NULL DEFAULT 'Diajukan' CHECK (status IN ('Diajukan','Dalam Peninjauan','Membutuhkan Perbaikan','Disetujui','Selesai')),
  details jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tracking_events (
  id uuid PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('Diajukan','Dalam Peninjauan','Membutuhkan Perbaikan','Disetujui','Selesai')),
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS news (
  id text PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  summary text NOT NULL,
  image_url text NOT NULL,
  category text NOT NULL,
  content jsonb NOT NULL,
  published_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS recovery_requests (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
CREATE TABLE IF NOT EXISTS sessions (
  sid varchar PRIMARY KEY,
  sess json NOT NULL,
  expire timestamptz(6) NOT NULL
);

-- Older versions stored UTC values without an offset. Preserve those instants
-- when upgrading, and leave an already migrated column unchanged on reruns.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sessions'
      AND column_name = 'expire' AND data_type = 'timestamp without time zone'
  ) THEN
    ALTER TABLE public.sessions ALTER COLUMN expire TYPE timestamptz(6)
      USING expire AT TIME ZONE 'UTC';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_application(p_record jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  event_record jsonb;
BEGIN
  INSERT INTO applications (id, owner_id, kind, reference_number)
  VALUES (
    (p_record->>'id')::uuid,
    (p_record->>'ownerId')::uuid,
    p_record->>'kind',
    p_record->>'referenceNumber'
  );

  IF p_record->>'kind' = 'corporate' THEN
    INSERT INTO corporate_registrations (
      id, owner_id, reference_number, company_name, business_type,
      contact_email, product_type, status, details, created_at, updated_at
    )
    VALUES (
      (p_record->>'id')::uuid,
      (p_record->>'ownerId')::uuid,
      p_record->>'referenceNumber',
      p_record->>'companyName',
      p_record->>'businessType',
      p_record->>'contactEmail',
      NULLIF(p_record->>'productType', ''),
      p_record->>'status',
      p_record - 'events',
      (p_record->>'createdAt')::timestamptz,
      (p_record->>'updatedAt')::timestamptz
    );
  ELSIF p_record->>'kind' = 'giro' THEN
    INSERT INTO giro_registrations (
      id, owner_id, reference_number, company_name, business_type,
      contact_email, product_type, status, details, created_at, updated_at
    )
    VALUES (
      (p_record->>'id')::uuid,
      (p_record->>'ownerId')::uuid,
      p_record->>'referenceNumber',
      p_record->>'companyName',
      p_record->>'businessType',
      p_record->>'contactEmail',
      p_record->>'productType',
      p_record->>'status',
      p_record - 'events',
      (p_record->>'createdAt')::timestamptz,
      (p_record->>'updatedAt')::timestamptz
    );
  ELSE
    RAISE EXCEPTION 'Unsupported application kind';
  END IF;

  FOR event_record IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_record->'events', '[]'::jsonb))
  LOOP
    INSERT INTO tracking_events (id, application_id, status, description, created_at)
    VALUES (
      (event_record->>'id')::uuid,
      (p_record->>'id')::uuid,
      event_record->>'status',
      event_record->>'description',
      (event_record->>'createdAt')::timestamptz
    );
  END LOOP;
END;
$$;

CREATE INDEX IF NOT EXISTS sessions_expire_idx ON sessions(expire);
CREATE INDEX IF NOT EXISTS applications_owner_idx ON applications(owner_id);
CREATE INDEX IF NOT EXISTS corporate_owner_created_idx ON corporate_registrations(owner_id,created_at DESC);
CREATE INDEX IF NOT EXISTS giro_owner_created_idx ON giro_registrations(owner_id,created_at DESC);
CREATE INDEX IF NOT EXISTS tracking_application_created_idx ON tracking_events(application_id,created_at);
CREATE INDEX IF NOT EXISTS news_published_idx ON news(published_at DESC);
CREATE INDEX IF NOT EXISTS recovery_user_created_idx ON recovery_requests(user_id,created_at DESC);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE giro_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
-- Data access is server-only; the server's Supabase secret key bypasses RLS.
REVOKE ALL ON users,applications,corporate_registrations,giro_registrations,tracking_events,news,recovery_requests,sessions FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_application(jsonb) FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON users,applications,corporate_registrations,giro_registrations,tracking_events,news,recovery_requests,sessions TO service_role;
GRANT EXECUTE ON FUNCTION public.create_application(jsonb) TO service_role;
COMMIT;
