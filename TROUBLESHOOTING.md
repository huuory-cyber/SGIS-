# 🔧 Troubleshooting - Aprovação de Provedor

## Problema: "Ainda não acontece nada ao aprovar provedor"

### 📋 Passos para Diagnosticar

---

## Passo 1: Verificar o Console do Navegador

1. Pressione **F12** para abrir as Ferramentas de Desenvolvedor
2. Vá para a aba **Console**
3. Clique no botão de aprovar um provedor
4. **Procure por estas mensagens:**

### Logs Esperados (Sucesso)
```
Tentando aprovar provedor: [ID] Admin ID: [ID]
Provedor aprovado com sucesso!
```

### Logs de Erro (Problema)
```
Failed to approve provider: [ERRO]
```

---

## Passo 2: Verificar se o Usuário é Admin

### No Console do Navegador

Cole este código no console e pressione Enter:

```javascript
// Verificar dados do usuário atual
localStorage.getItem('sb-dqzlongdhxhpdpoizoxj-auth-token')
```

### No Supabase Dashboard

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Table Editor** → `profiles`
4. Procure seu email na tabela
5. **Verifique se a coluna `role` é `admin`**

### SQL para Verificar Role

No **SQL Editor** do Supabase:

```sql
SELECT id, email, full_name, role, is_active, approval_status 
FROM public.profiles 
ORDER BY created_at DESC;
```

---

## Passo 3: Verificar as Colunas no Supabase

### Colunas Necessárias na Tabela `profiles`

No **Table Editor** do Supabase, abra a tabela `profiles` e verifique se estas colunas existem:

- ✅ `approval_status`
- ✅ `rejection_reason`
- ✅ `approved_by`
- ✅ `approved_at`

### Se Alguma Coluna Estiver Faltando

Execute este SQL no **SQL Editor**:

```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending_approval' 
CHECK (approval_status IN ('pending_approval', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
```

---

## Passo 4: Verificar Políticas RLS

### Verificar se as Políticas Existem

No **SQL Editor** do Supabase:

```sql
-- Ver políticas da tabela profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';
```

### Resultado Esperado

Você deve ver políticas como:
- `Admins can update all profiles`
- `Admins can view all profiles`
- `Admins can approve providers`

### Se as Políticas Não Existirem

Execute este SQL no **SQL Editor**:

```sql
-- Política para admins atualizarem perfis
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Política para admins verem todos os perfis
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Política para admins aprovarem provedores
CREATE POLICY "Admins can approve providers"
  ON public.profiles FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
```

---

## Passo 5: Verificar se Há Provedores Pendentes

### No Console do Navegador

```javascript
// Verificar providers carregados
// Abra a aba Console e procure por objetos com "approval_status: 'pending_approval'"
```

### No Supabase Dashboard

```sql
-- Contar provedores pendentes
SELECT COUNT(*) as pending_providers
FROM public.profiles
WHERE approval_status = 'pending_approval';
```

---

## Passo 6: Testar Manualmente no Supabase

### Aprovar Manualmente via SQL

No **SQL Editor** do Supabase:

```sql
-- Substitua [PROVIDER_ID] pelo ID real do provedor
-- Substitua [ADMIN_ID] pelo seu ID de admin

UPDATE public.profiles
SET 
  is_active = true,
  approval_status = 'approved',
  approved_by = '[ADMIN_ID]'::uuid,
  approved_at = NOW()
WHERE id = '[PROVIDER_ID]'::uuid
RETURNING *;
```

Se isso funcionar, o problema está no código React/Supabase client.
Se não funcionar, o problema está nas políticas RLS.

---

## Passo 7: Verificar Permissões do Supabase Client

### No Console do Navegador

```javascript
// Verificar se o Supabase client está configurado
import { supabase } from './src/lib/supabase';

// Verificar sessão atual
const { data } = await supabase.auth.getSession();
console.log('Sessão:', data);

// Verificar usuário atual
const { data: user } = await supabase.auth.getUser();
console.log('Usuário:', user);
```

---

## 🎯 Soluções Comuns

### Problema 1: Usuário Não é Admin

**Solução:**

```sql
-- Atualizar seu usuário para admin
UPDATE public.profiles
SET role = 'admin', is_active = true, approval_status = 'approved'
WHERE email = 'seu-email@example.com';
```

### Problema 2: Colunas Faltando

**Solução:** Execute o SQL do Passo 3

### Problema 3: Políticas RLS Faltando

**Solução:** Execute o SQL do Passo 4

### Problema 4: Schema SQL Não Executado

**Solução:** Execute o schema completo

```sql
-- Copie todo o conteúdo de supabase/schema.sql
-- Cole no SQL Editor do Supabase
-- Execute
```

---

## 📞 Ainda Com Problemas?

### Informações para Coletar

1. **Screenshot do Console** (F12 → Console)
2. **Resultado da Query** do Passo 2
3. **Resultado da Query** do Passo 4
4. **Resultado da Query** do Passo 5

### Teste Rápido

```javascript
// No console do navegador
console.log('Admin ID:', adminId);
console.log('Providers:', providers);
console.log('User:', user);
```

---

## ✅ Checklist

- [ ] Console mostra "Tentando aprovar provedor"
- [ ] Console mostra "Provedor aprovado com sucesso"
- [ ] Usuário tem role = 'admin'
- [ ] Colunas approval_status, approved_by existem
- [ ] Políticas RLS estão ativas
- [ ] Há provedores com approval_status = 'pending_approval'

---

## 🚀 Solução Mais Provável

Se "nada acontece", provavelmente o **usuário atual não é admin** ou as **colunas não foram criadas**.

### Verificação Rápida

No console do navegador, após clicar em aprovar:

1. **Se não aparecer NENHUM log** → O botão não está funcionando (problema React)
2. **Se aparecer "Tentando aprovar" mas nada mais** → Erro silencioso (verifique Network tab)
3. **Se aparecer erro** → Siga as instruções do erro

---

Recarregue a página (F5) e tente novamente!
