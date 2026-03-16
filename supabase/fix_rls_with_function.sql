-- 🔧 CORREÇÃO DAS POLÍTICAS RLS - COM FUNÇÃO AUXILIAR
-- Execute este SQL no Supabase SQL Editor para corrigir o erro HTTP 500

-- 1. Criar função auxiliar para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
END;
$$;

-- 2. Conceder permissão para executar a função
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 3. Remover políticas existentes
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- 4. Criar políticas usando a função auxiliar
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Verificar se as políticas foram criadas
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 6. Testar a função (substitua pelo seu ID)
-- SELECT public.is_admin(), auth.uid();
