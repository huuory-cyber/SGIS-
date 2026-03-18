-- 🔧 CORREÇÃO DAS POLÍTICAS RLS - PROVEDORES E ADMINISTRADORES
-- Execute este SQL no Supabase SQL Editor para corrigir as políticas RLS

-- 1. Remover políticas existentes de social_records que podem estar causando problemas
DROP POLICY IF EXISTS "Approved providers can view their own records" ON public.social_records;
DROP POLICY IF EXISTS "Approved providers can insert their own records" ON public.social_records;
DROP POLICY IF EXISTS "Approved providers can update their own records" ON public.social_records;
DROP POLICY IF EXISTS "Approved providers can delete their own records" ON public.social_records;
DROP POLICY IF EXISTS "Admins can view all records" ON public.social_records;
DROP POLICY IF EXISTS "Admins can insert records" ON public.social_records;
DROP POLICY IF EXISTS "Admins can update all records" ON public.social_records;
DROP POLICY IF EXISTS "Admins can delete all records" ON public.social_records;
DROP POLICY IF EXISTS "Approved providers can insert records" ON public.social_records;

-- 2. Criar políticas corretas para social_records

-- SELECT: Provedores aprovados podem ver seus próprios registros, admins podem ver todos
CREATE POLICY "Approved providers can view their own records"
  ON public.social_records FOR SELECT
  USING (
    (provider_id = auth.uid() AND
     (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved') OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- INSERT: Provedores aprovados podem inserir seus próprios registros, admins podem inserir registros
CREATE POLICY "Users can insert records"
  ON public.social_records FOR INSERT
  WITH CHECK (
    -- Provedor aprovado: deve inserir com seu próprio provider_id
    (provider_id = auth.uid() AND
     (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved') OR
    -- Admin: pode inserir com qualquer provider_id (inclusive o seu próprio)
    ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  );

-- UPDATE: Provedores aprovados podem atualizar seus próprios registros, admins podem atualizar todos
CREATE POLICY "Users can update records"
  ON public.social_records FOR UPDATE
  USING (
    (provider_id = auth.uid() AND
     (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved') OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (provider_id = auth.uid() AND
     (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved') OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- DELETE: Provedores aprovados podem deletar seus próprios registros, admins podem deletar todos
CREATE POLICY "Users can delete records"
  ON public.social_records FOR DELETE
  USING (
    (provider_id = auth.uid() AND
     (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved') OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- 3. Verificar se as políticas foram criadas corretamente
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd,
  substr(qual, 1, 100) as using_clause,
  substr(with_check, 1, 100) as with_check_clause
FROM pg_policies 
WHERE tablename = 'social_records'
ORDER BY policyname;

-- 4. Testar se o UPDATE funciona (descomente e substitua pelos IDs reais para testar)
-- UPDATE public.social_records
-- SET 
--   name = 'Nome Atualizado Teste',
--   situation = 'Estável'
-- WHERE id = 'SEU_RECORD_ID'::uuid
--   AND provider_id = auth.uid()
-- RETURNING id, name, situation;

-- 5. Testar se o DELETE funciona (descomente e substitua pelos IDs reais para testar)
-- DELETE FROM public.social_records
-- WHERE id = 'SEU_RECORD_ID'::uuid
--   AND provider_id = auth.uid()
-- RETURNING id, name;
