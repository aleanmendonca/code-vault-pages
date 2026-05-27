
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP POLICY IF EXISTS "covers public read" ON storage.objects;
-- Covers continuam acessíveis via URL pública (bucket public=true),
-- mas listagem via API só pelo dono.
CREATE POLICY "covers owner list" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);
