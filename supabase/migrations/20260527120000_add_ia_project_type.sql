-- Adiciona o valor "ia" ao enum project_type, habilitando a categoria IA
-- na Biblioteca (Páginas / SaaS / IA).
--
-- Como aplicar:
--   Supabase Dashboard -> SQL Editor -> cole e rode este arquivo.
--   (idempotente: pode rodar mais de uma vez sem erro)

alter type public.project_type add value if not exists 'ia';
