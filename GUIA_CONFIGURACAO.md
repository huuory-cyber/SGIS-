# Guia de Configuração - SGIS
## Como Configurar Variáveis de Ambiente e Executar o Schema SQL

Este guia fornece instruções passo a passo para configurar o seu ambiente e executar as migrações do banco de dados.

---

## 📋 Índice

1. [Configurar Variáveis de Ambiente](#1-configurar-variáveis-de-ambiente)
2. [Executar Schema SQL no Supabase](#2-executar-schema-sql-no-supabase)
3. [Criar Bucket de Storage](#3-criar-bucket-de-storage)
4. [Verificar Configuração](#4-verificar-configuração)
5. [Solução de Problemas](#5-solução-de-problemas)

---

## 1. Configurar Variáveis de Ambiente

### Passo 1.1: Localizar o Arquivo .env

O arquivo `.env` está na raiz do projeto:
```
e:/sgis---gestão-de-impacto-social/.env
```

### Passo 1.2: Editar o Arquivo .env

Abra o arquivo `.env` em um editor de texto e adicione a seguinte linha:

```env
# Chave de criptografia para dados sensíveis
# Gere uma chave segura e única para produção
VITE_ENCRYPTION_KEY=sgis-encrypt-2024-sua-chave-secreta-aqui
```

### Passo 1.3: Gerar uma Chave de Criptografia Segura

Para produção, use uma chave forte. Você pode gerar uma usando:

```bash
# No PowerShell (Windows)
$bytes = New-Object byte[] 32
(New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
$key = [System.Convert]::ToBase64String($bytes)
Write-Host $key
```

Ou use uma ferramenta online como:
- https://randomkeygen.com/
- https://www.random.org/strings/

### Passo 1.4: Exemplo Completo do Arquivo .env

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui

# Encryption Key (NOVO - Adicione esta linha)
VITE_ENCRYPTION_KEY=sua-chave-de-criptografia-segura-aqui
```

⚠️ **IMPORTANTE**: Nunca commit o arquivo `.env` para o repositório Git!

---

## 2. Executar Schema SQL no Supabase

### Passo 2.1: Acessar o Supabase Dashboard

1. Acesse https://supabase.com/dashboard
2. Faça login com sua conta
3. Selecione o seu projeto SGIS

### Passo 2.2: Abrir o SQL Editor

1. No menu lateral, clique em **SQL Editor**
2. Clique em **New Query** para criar uma nova consulta

### Passo 2.3: Copiar e Executar o Schema

1. Abra o arquivo [`supabase/schema.sql`](supabase/schema.sql) no seu editor de código
2. Copie todo o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione `Ctrl + Enter`)

### Passo 2.4: Verificar Resultados

Após executar, você deve ver uma mensagem de sucesso:
```
Success. No rows returned
```

### Passo 2.5: Executar por Partes (Opcional)

Se preferir executar em partes, separe o schema.sql em:

#### Parte 1: Extensões e Tabelas
```sql
-- Execute até o final das definições das tabelas (linha ~82)
-- Inclui: profiles, stations, agents, social_records
```

#### Parte 2: Índices
```sql
-- Execute os comandos CREATE INDEX (linhas ~83-94)
```

#### Parte 3: Funções e Triggers
```sql
-- Execute as funções e triggers (linhas ~95-114)
```

#### Parte 4: RLS Policies
```sql
-- Execute todas as políticas RLS (linhas ~115-238)
```

---

## 3. Criar Bucket de Storage

### Passo 3.1: Acessar o Storage

1. No Supabase Dashboard, clique em **Storage**
2. Clique em **Create a new bucket**

### Passo 3.2: Configurar o Bucket

Preencha as informações:

| Campo | Valor |
|-------|-------|
| Name | `social-records-images` |
| Public bucket | ❌ Desmarcado (privado) |
| File size limit | `5242880` (5MB) |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp` |

### Passo 3.3: Configurar Políticas RLS para Storage

No SQL Editor, execute:

```sql
-- Permitir que usuários autenticados vejam imagens
CREATE POLICY "Authenticated users can view images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'social-records-images');

-- Permitir que provedores aprovados façam upload
CREATE POLICY "Providers can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'social-records-images' AND
  (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved'
);

-- Permitir que provedores deletem suas próprias imagens
CREATE POLICY "Providers can delete their images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'social-records-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 4. Verificar Configuração

### Passo 4.1: Verificar Variáveis de Ambiente

No seu projeto, execute:

```bash
# Verificar se as variáveis estão carregadas
npm run dev
```

Se não houver erros de variáveis de ambiente, a configuração está correta.

### Passo 4.2: Verificar Tabelas no Supabase

1. No Supabase Dashboard, clique em **Table Editor**
2. Verifique se as seguintes tabelas existem:
   - ✅ `profiles`
   - ✅ `stations`
   - ✅ `agents`
   - ✅ `social_records`

### Passo 4.3: Verificar Novas Colunas

Na tabela `profiles`, verifique se as novas colunas existem:
- ✅ `approval_status`
- ✅ `rejection_reason`
- ✅ `approved_by`
- ✅ `approved_at`

Na tabela `social_records`, verifique:
- ✅ `image_urls`
- ✅ `image_count`
- ✅ `sync_status`
- ✅ `offline_created`

### Passo 4.4: Verificar Bucket de Storage

1. No Supabase Dashboard, clique em **Storage**
2. Verifique se o bucket `social-records-images` aparece na lista

---

## 5. Solução de Problemas

### Problema 1: Erro "VITE_ENCRYPTION_KEY is not defined"

**Solução:**
```bash
# Certifique-se de que o arquivo .env existe
ls .env

# Se não existir, copie do exemplo
cp .env.example .env

# Edite o arquivo e adicione a chave
notepad .env  # Windows
# ou
nano .env     # Linux/Mac
```

### Problema 2: Erro ao executar schema.sql

**Solução:**
- Verifique se você tem permissões de administrador no Supabase
- Execute por partes conforme mostrado no Passo 2.5
- Verifique o log de erros no Supabase para detalhes

### Problema 3: Bucket de Storage não funciona

**Solução:**
```sql
-- Verifique se o bucket existe
SELECT * FROM storage.buckets WHERE id = 'social-records-images';

-- Se não existir, crie novamente
INSERT INTO storage.buckets (id, name, public)
VALUES ('social-records-images', 'social-records-images', false);
```

### Problema 4: RLS Policies bloqueando acesso

**Solução:**
```sql
-- Verificar políticas da tabela profiles
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Verificar políticas da tabela social_records
SELECT * FROM pg_policies WHERE tablename = 'social_records';
```

### Problema 5: Erro de CORS no Storage

**Solução:**
No Supabase Dashboard:
1. Vá em **Storage**
2. Clique no bucket `social-records-images`
3. Vá em **Configuration**
4. Em **CORS allowed origins**, adicione:
   ```
   http://localhost:5173
   ```
5. Clique em **Save**

---

## 📝 Checklist de Configuração

Use este checklist para garantir que tudo está configurado:

- [ ] Arquivo `.env` criado e configurado
- [ ] `VITE_ENCRYPTION_KEY` adicionada ao `.env`
- [ ] Schema SQL executado no Supabase
- [ ] Tabelas verificadas (profiles, stations, agents, social_records)
- [ ] Novas colunas verificadas nas tabelas
- [ ] Bucket `social-records-images` criado
- [ ] Políticas RLS do Storage configuradas
- [ ] CORS configurado para o Storage
- [ ] Aplicação inicia sem erros

---

## 🚀 Próximos Passos Após Configuração

1. **Testar o Registro de Provedor**
   - Acesse a página de registro
   - Crie um novo provedor
   - Verifique se aparece como "pending_approval"

2. **Aprovar um Provedor**
   - Acesse o painel admin
   - Vá em "Provedores"
   - Aprove o provedor pendente

3. **Testar Upload de Imagens**
   - Crie um novo registro social
   - Faça upload de 1-2 imagens
   - Verifique se foram comprimidas

4. **Testar Funcionalidade Offline**
   - Desconecte a internet
   - Crie um registro
   - Reconecte e verifique a sincronização

5. **Testar Exportação**
   - Exporte um registro para PDF
   - Exporte uma lista para Excel

---

## 📞 Ajuda Adicional

Se encontrar problemas:

1. **Documentação Supabase**: https://supabase.com/docs
2. **Documentação Vite**: https://vitejs.dev/guide/env-and-mode.html
3. **Verifique os logs**: Console do navegador e terminal do VS Code

---

**Última Atualização**: 12-01-2025  
**Versão**: 1.0
