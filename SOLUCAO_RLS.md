# 🔧 Solução - Erro RLS ao Aprovar Provedor

## Erro Identificado

```
Failed to approve provider: 
Object { code: "PGRST116", details: "The result contains 0 rows", 
message: "Cannot coerce the result to a single JSON object" }
```

## 📋 Causa do Problema

O erro ocorreu porque a função `approveProvider` estava usando `.select().single()` imediatamente após o UPDATE. As políticas RLS (Row Level Security) do Supabase podem bloquear o SELECT após o UPDATE, mesmo que o UPDATE tenha sido bem-sucedido.

### Problema no Código Original

```typescript
// ❌ CÓDIGO COM PROBLEMA
export async function approveProvider(userId: string, adminId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ... })
    .eq('id', userId)
    .select()    // ← Problema: SELECT após UPDATE
    .single();   // ← Problema: Exige exatamente 1 linha

  if (error) throw error;
  return data;
}
```

O UPDATE pode ser bem-sucedido, mas o SELECT subsequente pode retornar 0 linhas devido às políticas RLS, causando o erro `PGRST116`.

---

## ✅ Solução Aplicada

Separei o UPDATE do SELECT em duas operações distintas:

```typescript
// ✅ CÓDIGO CORRIGIDO
export async function approveProvider(userId: string, adminId: string) {
  // Passo 1: UPDATE (sem SELECT)
  const { error } = await supabase
    .from('profiles')
    .update({
      is_active: true,
      approval_status: 'approved',
      approved_by: adminId,
      approved_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) throw error;
  
  // Passo 2: SELECT separado para buscar os dados atualizados
  const { data, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (fetchError) throw fetchError;
  return data;
}
```

### Mesma Correção Aplicada a:

- ✅ `approveProvider()` - Aprovar provedor
- ✅ `rejectProvider()` - Rejeitar provedor
- ✅ `reactivateProvider()` - Reativar provedor

---

## 🔍 Por Que Isso Funciona?

1. **UPDATE é executado primeiro** - As políticas RLS para UPDATE permitem que admins atualizem perfis
2. **SELECT é executado separadamente** - As políticas RLS para SELECT permitem que admins vejam todos os perfis
3. **Separação de responsabilidades** - Cada operação tem suas próprias políticas RLS

---

## 📝 Políticas RLS Relevantes

### Política de UPDATE para Admins
```sql
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
```

### Política de SELECT para Admins
```sql
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
```

---

## 🧪 Como Testar

1. **Recarregar a aplicação** (F5 no navegador)
2. **Fazer login como admin**
3. **Acessar o painel admin**
4. **Ir para "Provedores"**
5. **Tentar aprovar um provedor pendente**

### Resultado Esperado

✅ O provedor deve ser aprovado com sucesso
✅ O status deve mudar para "Aprovado"
✅ Nenhum erro deve aparecer no console

---

## 📊 Resumo das Mudanças

| Arquivo | Função | Mudança |
|---------|--------|---------|
| `src/lib/supabase.ts` | `approveProvider()` | UPDATE e SELECT separados |
| `src/lib/supabase.ts` | `rejectProvider()` | UPDATE e SELECT separados |
| `src/lib/supabase.ts` | `reactivateProvider()` | UPDATE e SELECT separados |

---

## 🎯 Próximos Passos

1. ✅ **Correção aplicada** - Funções foram atualizadas
2. 🔄 **Recarregar aplicação** - Pressione F5 no navegador
3. 🧪 **Testar aprovação** - Tente aprovar um provedor
4. ✅ **Verificar resultado** - Status deve mudar para "Aprovado"

---

## 💡 Dica

Se ainda tiver problemas, verifique no Supabase Dashboard:

1. **Table Editor** → `profiles` → Verifique se as colunas existem
2. **Authentication** → Verifique se o usuário atual tem role `admin`
3. **SQL Editor** → Execute para verificar o role do usuário:

```sql
SELECT id, email, full_name, role, is_active, approval_status 
FROM public.profiles 
WHERE email = 'seu-email@admin.com';
```

---

**Status da Correção**: ✅ Aplicada com sucesso

Recarregue a aplicação (F5) e teste novamente!
