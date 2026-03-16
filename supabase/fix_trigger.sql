-- 🔧 CORREÇÃO DO TRIGGER DE NOVO USUÁRIO
-- Execute este SQL no Supabase SQL Editor para corrigir problemas de registro

-- 1. Verificar o trigger atual
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM pg_trigger
WHERE event_object_table = 'users';

-- 2. Remover o trigger antigo (se existir)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Recriar a função do trigger com tratamento de erros melhor
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
    -- Log do erro (opcional)
    RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Verificar se o trigger foi criado
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM pg_trigger
WHERE event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created';

-- 6. Teste manual de inserção (opcional - descomente para testar)
-- INSERT INTO auth.users (id, email, raw_user_meta_data)
-- VALUES (
--   gen_random_uuid(),
--   'test@example.com',
--   '{"full_name": "Test User", "role": "provider"}'::jsonb
-- )
-- ON CONFLICT (id) DO NOTHING;
