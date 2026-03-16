-- 🔧 CORREÇÃO DO TRIGGER DE NOVO USUÁRIO (VERSÃO CORRIGIDA)
-- Execute este SQL no Supabase SQL Editor

-- 1. Remover o trigger antigo (se existir)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Remover e recriar a função do trigger
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
AS $$
DECLARE
  existing_profile profiles%ROWTYPE;
BEGIN
  -- Verificar se o perfil já existe para evitar duplicação
  SELECT * INTO existing_profile
  FROM public.profiles
  WHERE id = NEW.id;
  
  -- Se não existir, criar novo perfil
  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, email, full_name, role, is_active, approval_status)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
      COALESCE(NEW.raw_user_meta_data->>'role', 'provider'),
      FALSE,
      'pending_approval'
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro e continuar
    RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Confirmar que foi criado
SELECT 'Trigger criado com sucesso!' as status;

-- 5. Verificar perfis existentes
SELECT id, email, full_name, role, is_active, approval_status
FROM public.profiles
ORDER BY created_at DESC;
