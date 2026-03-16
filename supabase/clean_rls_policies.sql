-- 🔧 LIMPEZA COMPLETA DAS POLÍTICAS RLS - PERFIS
-- Execute este SQL no Supabase SQL Editor

-- 1. Remover TODAS as políticas existentes da tabela profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "SGIS_Security_Policy_V2" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- 2. Criar políticas limpas e corretas

-- Política: Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Política: Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Política: Admins podem atualizar todos os perfis
-- IMPORTANTE: Com WITH CHECK para permitir a atualização
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- 3. Verificar se as políticas foram criadas corretamente
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd,
  substr(qual, 1, 80) as using_clause,
  substr(with_check, 1, 80) as with_check_clause
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 4. Testar o UPDATE manualmente (descomente para testar)
-- UPDATE public.profiles
-- SET 
--   is_active = true,
--   approval_status = 'approved',
--   approved_by = 'c79778b0-75f8-4a03-8510-41ec84b68911'::uuid,
--   approved_at = NOW()
-- WHERE id = '797595e8-d9cf-4c8b-b251-0044919419c8'::uuid
-- RETURNING id, email, approval_status, is_active, approved_by;
