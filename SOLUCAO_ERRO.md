# 🔧 Solução Rápida - Erro de Coluna Ausente

## Problema

```
Failed to approve provider: 
Could not find the 'approved_by' column of 'profiles' in the schema cache
```

## Causa

O schema SQL atualizado ainda não foi executado no Supabase. As novas colunas (`approved_by`, `approved_at`, `approval_status`, `rejection_reason`) não existem no banco de dados.

---

## ✅ Solução Passo a Passo

### Passo 1: Acessar o Supabase Dashboard

1. Abra o navegador e acesse: https://supabase.com/dashboard
2. Faça login
3. Clique no seu projeto `dqzlongdhxhpdpoizoxj`

### Passo 2: Abrir o SQL Editor

1. No menu lateral esquerdo, clique em **SQL Editor** (ícone de terminal)
2. Clique em **New query** para criar uma nova consulta

### Passo 3: Copiar e Executar o Schema

1. Abra o arquivo `supabase/schema.sql` no VS Code
2. Selecione todo o conteúdo (Ctrl + A)
3. Copie (Ctrl + C)
4. Cole no SQL Editor do Supabase (Ctrl + V)
5. Clique no botão **Run** (ou pressione Ctrl + Enter)

### Passo 4: Verificar o Resultado

Após executar, você deve ver:
```
Success. No rows returned
```

### Passo 5: Recarregar a Aplicação

1. Volte para o navegador onde a aplicação está rodando
2. Pressione **F5** para recarregar a página
3. Tente aprovar um provedor novamente

---

## 🚨 Se Ainda Tiver Erro

### Opção A: Executar Apenas as Alterações Necessárias

Se preferir executar apenas as alterações necessárias, cole este SQL no Supabase:

```sql
-- Adicionar novas colunas à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending_approval' 
CHECK (approval_status IN ('pending_approval', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Adicionar novas colunas à tabela social_records
ALTER TABLE public.social_records
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS image_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced' 
CHECK (sync_status IN ('pending', 'synced', 'conflict')),
ADD COLUMN IF NOT EXISTS offline_created BOOLEAN DEFAULT FALSE;
```

### Opção B: Verificar as Colunas

Para verificar se as colunas foram criadas:

1. No Supabase Dashboard, clique em **Table Editor**
2. Clique na tabela `profiles`
3. Verifique se as colunas existem:
   - ✅ `approval_status`
   - ✅ `rejection_reason`
   - ✅ `approved_by`
   - ✅ `approved_at`

---

## 📝 Resumo

| Ação | Comando/Local |
|------|---------------|
| Abrir Supabase | https://supabase.com/dashboard |
| SQL Editor | Menu lateral → SQL Editor → New query |
| Arquivo SQL | `supabase/schema.sql` |
| Executar | Botão **Run** ou Ctrl + Enter |
| Recarregar App | F5 no navegador |

---

## ✅ Após Executar o Schema

Depois de executar o schema SQL com sucesso:

1. ✅ As novas colunas estarão disponíveis
2. ✅ O sistema de aprovação funcionará
3. ✅ Upload de imagens funcionará
4. ✅ Todas as funcionalidades estarão ativas

---

**Precisa de ajuda?** Consulte o guia completo: [`GUIA_CONFIGURACAO.md`](GUIA_CONFIGURACAO.md)
