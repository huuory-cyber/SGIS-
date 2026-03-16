-- 🔧 CORREÇÃO FINAL DAS POLÍTICAS RLS - PERMITIR REGISTRO
-- Execute este SQL no Supabase SQL Editor

-- 1. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- 2. Criar política para permitir que novos usuários insiram seu próprio perfil
-- IMPORTANTE: Esta política é necessária para o registro funcionar
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 3. Recriar as políticas de SELECT
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- 4. Recriar as políticas de UPDATE
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Verificar políticas criadas
SELECT 
  policyname, 
  cmd,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || substr(with_check, 1, 50)
    ELSE 'USING: ' || substr(qual, 1, 50)
  END as clause
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 6. Teste manual de inserção (opcional)
-- INSERT INTO public.profiles (id, email, full_name, role, is_active, approval_status)
-- VALUES (
--   gen_random_uuid(),
--   'teste@exemplo.com',
--   'Teste',
--   'provider',
--   false,
--   'pending_approval'
-- )
-- RETURNING *;
