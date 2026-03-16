# Como Corrigir o Erro de RLS no Storage

## Problema

Ao tentar fazer upload de imagens, aparece o erro:
```
Error uploading image: StorageApiError: new row violates row-level security policy
```

## Solução

### Passo 1: Acessar o Supabase SQL Editor

1. Vá para [https://app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**

### Passo 2: Executar o Script de Correção

1. Abra o arquivo [`supabase/fix_storage_rls.sql`](supabase/fix_storage_rls.sql)
2. Copie todo o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)

### Passo 3: Verificar se Funcionou

Após executar o script, você deve ver uma mensagem de sucesso.

### Passo 4: Testar o Upload

1. Volte para a aplicação
2. Tente fazer upload de uma imagem novamente
3. O upload deve funcionar corretamente agora

## O Que o Script Faz

O script [`fix_storage_rls.sql`](supabase/fix_storage_rls.sql) faz o seguinte:

1. **Torna o bucket público**: Permite que as imagens sejam visualizadas
2. **Remove políticas antigas**: Remove todas as políticas RLS existentes
3. **Cria novas políticas**:
   - **Admins podem fazer upload**: Administradores podem fazer upload de qualquer imagem
   - **Providers aprovados podem fazer upload**: Provedores com status `approved` podem fazer upload
   - **Admins podem deletar**: Administradores podem deletar qualquer imagem
   - **Providers podem deletar suas imagens**: Providers só podem deletar suas próprias imagens
   - **Usuários autenticados podem visualizar**: Qualquer usuário logado pode ver as imagens

## Verificação das Políticas

Para verificar se as políticas foram criadas corretamente, execute no SQL Editor:

```sql
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%social-records-images%';
```

Você deve ver as seguintes políticas:
- `Authenticated users can view images` (SELECT)
- `Admins can upload images` (INSERT)
- `Approved providers can upload images` (INSERT)
- `Admins can delete images` (DELETE)
- `Providers can delete their images` (DELETE)

## Solução Alternativa (Manual)

Se preferir fazer manualmente, execute estes comandos no SQL Editor:

```sql
-- Tornar o bucket público
UPDATE storage.buckets 
SET public = true 
WHERE id = 'social-records-images';

-- Permitir que admins façam upload
CREATE POLICY "Admins can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'social-records-images' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
```

## Ainda Com Problemas?

Se após executar o script o problema persistir:

1. Verifique se você está logado como admin
2. Verifique se seu perfil tem `role = 'admin'` na tabela `profiles`
3. Verifique se o bucket `social-records-images` existe
4. Tente fazer logout e login novamente

Para verificar seu perfil:

```sql
SELECT id, email, full_name, role, is_active, approval_status
FROM profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'seu-email@admin.com');
```
