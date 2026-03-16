# 🔧 Diagnóstico - Problema de Atualização do Dashboard

## Situação Atual

- ✅ Provedor é aprovado no banco de dados
- ✅ Console mostra "Provedor aprovado com sucesso!"
- ❌ Dashboard não atualiza (ainda mostra como pendente)

---

## 📋 Passos para Diagnosticar

### Passo 1: Recarregar e Verificar Logs

1. **Recarregue a aplicação** (pressione **F5**)
2. **Abra o console** (F12)
3. **Clique em aprovar um provedor**
4. **Procure por estes logs:**

```
Tentando aprovar provedor: [ID] Admin ID: [ID]
Provedor aprovado com sucesso!
Carregando dados...
Buscando provedores...
Provedores encontrados: [NÚMERO] [DADOS]
Dados carregados: { records: X, providers: Y, stations: Z }
```

### Passo 2: Verificar o que Aparece

#### Se Aparecer "Carregando dados..."
- ✅ O `onRefresh()` está funcionando
- ✅ O `loadData()` está sendo chamado
- Verifique o próximo log

#### Se Aparecer "Buscando provedores..."
- ✅ O `getProviders()` está sendo chamado
- Verifique o próximo log

#### Se Aparecer "Provedores encontrados: 0 []"
- ❌ **PROBLEMA**: O Supabase não está retornando provedores
- **Causa**: Políticas RLS bloqueando a consulta
- **Solução**: Verificar políticas RLS (abaixo)

#### Se Aparecer "Provedores encontrados: X [...]" mas com approval_status ainda 'pending_approval'
- ❌ **PROBLEMA**: O UPDATE não foi aplicado no banco
- **Causa**: Políticas RLS bloqueando o UPDATE
- **Solução**: Verificar políticas RLS de UPDATE

---

## 🔍 Verificar no Supabase

### 1. Verificar se o UPDATE Funcionou

No **SQL Editor** do Supabase:

```sql
SELECT id, email, full_name, role, is_active, approval_status, approved_by, approved_at
FROM public.profiles
WHERE id = '797595e8-d9cf-4c8b-b251-0044919419c8';
```

**Se `approval_status` ainda for 'pending_approval':**
- O UPDATE não está funcionando
- Verifique as políticas RLS de UPDATE

**Se `approval_status` for 'approved':**
- O UPDATE funcionou
- O problema é no SELECT (RLS bloqueando a leitura)

### 2. Verificar Políticas RLS

```sql
-- Ver todas as políticas da tabela profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';
```

**Políticas necessárias:**
- ✅ `Admins can view all profiles` (SELECT)
- ✅ `Admins can update all profiles` (UPDATE)
- ✅ `Admins can approve providers` (UPDATE)

### 3. Verificar Role do Usuário

```sql
-- Verificar seu role
SELECT id, email, full_name, role, is_active, approval_status
FROM public.profiles
WHERE email = 'seu-email@admin.com';
```

**Se `role` não for 'admin':**
```sql
-- Atualizar para admin
UPDATE public.profiles
SET role = 'admin', is_active = true, approval_status = 'approved'
WHERE email = 'seu-email@admin.com';
```

---

## 🚨 Soluções Possíveis

### Solução 1: Recriar Políticas RLS

Se as políticas estiverem faltando ou incorretas, execute:

```sql
-- Drop políticas existentes
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Recriar políticas corretas
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can approve providers"
  ON public.profiles FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
```

### Solução 2: Verificar se RLS Está Ativo

```sql
-- Verificar se RLS está ativo na tabela profiles
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'profiles';
```

**Se `relrowsecurity` for `false`:**
```sql
-- Ativar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

### Solução 3: Testar UPDATE Manual

```sql
-- Testar UPDATE manual
UPDATE public.profiles
SET 
  is_active = true,
  approval_status = 'approved',
  approved_by = 'c79778b0-75f8-4a03-8510-41ec84b68911'::uuid,
  approved_at = NOW()
WHERE id = '797595e8-d9cf-4c8b-b251-0044919419c8'::uuid
RETURNING *;
```

**Se isso funcionar:**
- O problema está no código React/Supabase client
- Verifique se o adminId está correto

**Se isso não funcionar:**
- O problema está nas políticas RLS
- Execute a Solução 1

---

## 📊 Checklist de Diagnóstico

Recarregue (F5), clique em aprovar, e verifique:

- [ ] Console mostra "Tentando aprovar provedor"
- [ ] Console mostra "Provedor aprovado com sucesso!"
- [ ] Console mostra "Carregando dados..."
- [ ] Console mostra "Buscando provedores..."
- [ ] Console mostra "Provedores encontrados: X [...]"
- [ ] Console mostra "Dados carregados: { ... }"

Copie todos os logs do console e cole aqui para análise!

---

## 🎯 Próximo Passo

**Recarregue a aplicação (F5) e cole aqui os logs que aparecem no console quando você clica em aprovar!**

Isso vai me ajudar a identificar exatamente onde está o problema.
