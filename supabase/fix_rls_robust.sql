-- 🔧 CORREÇÃO FINAL DAS POLÍTICAS RLS - VERSÃO ROBUSTA
-- Execute este SQL no Supabase SQL Editor

-- 1. Remover tudo e começar do zero
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP FUNCTION IF EXISTS public.is_admin();

-- 2. Criar função auxiliar robusta
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Retornar false se não houver usuário autenticado
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se o usuário tem role 'admin'
  RETURN (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
END;
$$;

-- 3. Conceder permissão
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- 4. Criar políticas simples e diretas

-- Política: Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Política: Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Política: Admins podem atualizar todos os perfis
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Verificar políticas
SELECT 
  policyname, 
  cmd,
  substr(qual, 1, 50) as using_clause
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 6. Testar a função (no contexto da aplicação, vai retornar true/false correto)
-- SELECT public.is_admin() as is_admin_result, auth.uid() as current_user_id;
