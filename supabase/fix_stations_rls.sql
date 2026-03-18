-- 🔧 CORREÇÃO DAS POLÍTICAS RLS - TABELA STATIONS
-- Execute este SQL no Supabase SQL Editor para corrigir as políticas RLS de stations

-- 1. Remover políticas existentes de stations que podem estar causando problemas
DROP POLICY IF EXISTS "Approved providers can view their own stations" ON public.stations;
DROP POLICY IF EXISTS "Approved providers can insert their own stations" ON public.stations;
DROP POLICY IF EXISTS "Approved providers can update their own stations" ON public.stations;
DROP POLICY IF EXISTS "Admins can view all stations" ON public.stations;
DROP POLICY IF EXISTS "Admins can insert stations" ON public.stations;
DROP POLICY IF EXISTS "Admins can update all stations" ON public.stations;
DROP POLICY IF EXISTS "Admins can delete all stations" ON public.stations;

-- 2. Criar políticas corretas para stations

-- SELECT: Provedores aprovados podem ver seus próprios postos, admins podem ver todos
CREATE POLICY "Users can view stations"
  ON public.stations FOR SELECT
  USING (
    (provider_id = auth.uid() AND
     (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved') OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- INSERT: Provedores aprovados podem inserir seus próprios postos, admins podem inserir postos
CREATE POLICY "Users can insert stations"
  ON public.stations FOR INSERT
  WITH CHECK (
    -- Provedor aprovado: deve inserir com seu próprio provider_id
    (provider_id = auth.uid() AND
     (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved') OR
    -- Admin: pode inserir com qualquer provider_id
    ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  );

-- UPDATE: Provedores aprovados podem atualizar seus próprios postos, admins podem atualizar todos
CREATE POLICY "Users can update stations"
  ON public.stations FOR UPDATE
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

-- DELETE: Provedores aprovados podem deletar seus próprios postos, admins podem deletar todos
CREATE POLICY "Users can delete stations"
  ON public.stations FOR DELETE
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
WHERE tablename = 'stations'
ORDER BY policyname;

-- 4. Testar se o INSERT funciona (descomente e substitua pelos valores reais para testar)
-- INSERT INTO public.stations (name, neighborhood, locality, provider_id)
-- VALUES ('Teste Posto', 'Centro', 'Zona 1', auth.uid()::uuid)
-- RETURNING id, name, provider_id;
