-- 🔧 DESABILITAR TRIGGER TEMPORARIAMENTE PARA PERMITIR REGISTRO
-- Execute este SQL no Supabase SQL Editor

-- 1. Remover o trigger que está causando erro
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Confirmar que foi removido
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    RAISE NOTICE 'Trigger removido com sucesso. Registro agora funcionará sem trigger.';
  END IF;
END $$;

-- 3. Verificar perfis existentes
SELECT id, email, full_name, role, is_active, approval_status
FROM public.profiles
ORDER BY created_at DESC;

-- 4. Instruções para criar admin manualmente (se necessário)
-- Descomente e execute para criar um admin manualmente:
--
-- INSERT INTO public.profiles (id, email, full_name, role, is_active, approval_status)
-- VALUES (
--   'SEU-UUID-AQUI'::uuid,
--   'seu-email@admin.com',
--   'Admin User',
--   'admin',
--   true,
--   'approved'
-- );
--
-- Para gerar um UUID:
-- SELECT gen_random_uuid();
