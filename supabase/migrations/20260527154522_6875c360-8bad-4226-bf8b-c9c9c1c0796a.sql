
CREATE TYPE public.project_type AS ENUM ('pagina', 'saas');

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type project_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  production_url TEXT,
  git_url TEXT,
  author TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth view own projects" ON public.projects FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "auth insert own projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "auth update own projects" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "auth delete own projects" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  changelog TEXT,
  zip_path TEXT NOT NULL,
  zip_size BIGINT,
  git_commit TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.versions TO authenticated;
GRANT ALL ON public.versions TO service_role;
ALTER TABLE public.versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth view own versions" ON public.versions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "auth insert own versions" ON public.versions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "auth update own versions" ON public.versions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "auth delete own versions" ON public.versions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_versions_project ON public.versions(project_id, created_at DESC);
CREATE INDEX idx_projects_user_type ON public.projects(user_id, type, created_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER projects_touch BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('zips', 'zips', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: covers (public read, owner write under {uid}/...)
CREATE POLICY "covers public read" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'covers');

CREATE POLICY "covers owner insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "covers owner update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "covers owner delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

-- zips (auth-only)
CREATE POLICY "zips owner read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'zips' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "zips owner insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'zips' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "zips owner update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'zips' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "zips owner delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'zips' AND (storage.foldername(name))[1] = auth.uid()::text);
