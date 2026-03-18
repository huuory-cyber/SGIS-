-- 🔧 CORREÇÃO DAS POLÍTICAS RLS - TABELA AGENTS
-- Execute este SQL no Supabase SQL Editor para corrigir as políticas RLS de agents

-- 1. Primeiro, vamos ver quais políticas já existem
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd
FROM pg_policies 
WHERE tablename = 'agents'
ORDER BY policyname;

-- 2. Remover TODAS as políticas existentes (uma por uma para evitar erros)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'agents'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.agents', policy_record.policyname);
    END LOOP;
END $$;

-- 3. Criar políticas corretas para agents

-- SELECT: Provedores aprovados podem ver seus próprios agentes, admins podem ver todos
CREATE POLICY "Users can view agents"
  ON public.agents FOR SELECT
  USING (
    (provider_id = auth.uid() AND
     (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved') OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- INSERT: Provedores aprovados podem inserir seus próprios agentes, admins podem inserir agentes
CREATE POLICY "Users can insert agents"
  ON public.agents FOR INSERT
  WITH CHECK (
    -- Provedor aprovado: deve inserir com seu próprio provider_id
    (provider_id = auth.uid() AND
     (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved') OR
    -- Admin: pode inserir com qualquer provider_id
    ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  );

-- UPDATE: Provedores aprovados podem atualizar seus próprios agentes, admins podem atualizar todos
CREATE POLICY "Users can update agents"
  ON public.agents FOR UPDATE
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

-- DELETE: Provedores aprovados podem deletar seus próprios agentes, admins podem deletar todos
CREATE POLICY "Users can delete agents"
  ON public.agents FOR DELETE
  USING (
    (provider_id = auth.uid() AND
     (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved') OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- 4. Verificar se as políticas foram criadas corretamente
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
WHERE tablename = 'agents'
ORDER BY policyname;

-- 5. Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Políticas RLS para agents criadas com sucesso!';
END $$;
