# SGIS - Sistema de Gestão de Impacto Social

Sistema completo para gestão de impacto social com integração Supabase, autenticação de usuários e dashboards baseados em roles.

## 📋 Índice

- [Funcionalidades](#funcionalidades)
- [Pré-requisitos](#pré-requisitos)
- [Configuração do Supabase](#configuração-do-supabase)
- [Instalação](#instalação)
- [Estrutura do Sistema](#estrutura-do-sistema)
- [Uso](#uso)

## 🚀 Funcionalidades

### Para Administradores
- **Visão completa do sistema**: Acesso a todos os registros, provedores e postos
- **Gestão de provedores**: Aprovar/desativar contas de provedores
- **Gestão de postos**: Criar e gerenciar postos de atendimento
- **Dashboard completo**: Estatísticas e gráficos de toda a rede
- **Registros ilimitados**: Visualizar e criar registros em qualquer posto

### Para Provedores
- **Dashboard próprio**: Visualizar apenas seus registros e estatísticas
- **Gestão de postos**: Gerenciar seus próprios postos de atendimento
- **Cadastro de agentes**: Adicionar agentes aos seus postos
- **Registros**: Criar e visualizar registros de seus postos

### Para Agentes
- **Interface simplificada**: Focada em coleta de dados
- **Registros**: Criar e visualizar seus próprios registros
- **Dashboard**: Estatísticas básicas de sua atividade

### Formulário Aprimorado
Novos campos adicionados:
- **Informações Pessoais**: Gênero, telefone, email
- **Localização**: Endereço completo
- **Contexto Familiar**: Tamanho da família, dependentes, escolaridade, renda mensal
- **Saúde**: Condições de saúde adicionais
- **Sistema**: Integração completa com postos e agentes

## 📦 Pré-requisitos

- Node.js 18+ instalado
- Conta no [Supabase](https://supabase.com) (grátis)
- Git instalado

## 🔧 Configuração do Supabase

### 1. Criar Projeto Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Faça login ou crie uma conta
4. Clique em "New Project"
5. Preencha:
   - **Name**: `sgis-impacto`
   - **Database Password**: (salve esta senha!)
   - **Region**: Escolha a mais próxima dos seus usuários
6. Aguarde o projeto ser criado (pode levar alguns minutos)

### 2. Executar Schema SQL

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Copie o conteúdo do arquivo `supabase/schema.sql`
4. Cole no editor e clique em **Run** ou pressione `Ctrl+Enter`

Isso criará todas as tabelas necessárias:
- `profiles` (perfis de usuários)
- `stations` (postos de atendimento)
- `agents` (agentes de campo)
- `social_records` (registros de atendimento)

### 3. Configurar Row Level Security (RLS)

O schema SQL já configura as políticas RLS automaticamente. Verifique se foram criadas:

1. Vá em **Authentication** > **Policies**
2. Verifique se existem políticas para:
   - `profiles`
   - `stations`
   - `agents`
   - `social_records`

### 4. Obter Credenciais

1. No painel do Supabase, vá em **Settings** > **API**
2. Copie os seguintes valores:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: A chave pública que começa com `eyJhbGci...`

### 5. Criar Usuário Administrador

1. Vá em **Authentication** > **Users**
2. Clique em **Add user** > **Create new user**
3. Preencha:
   - **Email**: seu@email.com
   - **Password**: (mínimo 6 caracteres)
   - **Auto Confirm User**: ✅ marque esta opção
4. Clique em **Create user**

6. Agora precisamos definir este usuário como admin:
   - Vá em **SQL Editor**
   - Execute:
   ```sql
   UPDATE profiles 
   SET role = 'admin', is_active = TRUE 
   WHERE email = 'seu@email.com';
   ```

## 💻 Instalação

### 1. Clonar o Repositório

```bash
git clone <url-do-repositorio>
cd sgis---gestao-de-impacto-social
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e substitua com suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### 4. Executar em Desenvolvimento

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`

## 🏗️ Estrutura do Sistema

### Roles e Permissões

#### Admin (Administrador)
- Acesso total ao sistema
- Pode visualizar, editar e deletar qualquer registro
- Gerencia provedores (aprovar/desativar)
- Gerencia postos de atendimento
- Visualiza estatísticas globais

#### Provider (Provedor)
- Acesso aos seus próprios registros
- Gerencia seus próprios postos
- Cria agentes para seus postos
- Visualiza estatísticas de sua rede

#### Agent (Agente)
- Acesso limitado ao seu posto
- Cria e visualiza seus próprios registros
- Visualiza estatísticas básicas

### Fluxo de Trabalho

1. **Cadastro**: Provedores se cadastram pelo sistema
2. **Aprovação**: Admin aprova o provedor
3. **Configuração**: Provedor cria postos e agentes
4. **Operação**: Agentes coletam dados no campo
5. **Análise**: Admin e provedores analisam dados nos dashboards

## 📱 Uso

### Primeiro Acesso

1. Acesse `http://localhost:3000`
2. Faça login com o usuário admin criado
3. Você será redirecionado para o dashboard administrativo

### Cadastro de Provedores

1. Como admin, acesse a aba "Provedores"
2. Provedores podem se cadastrar em `/register`
3. Aprovações pendentes aparecem com badge laranja
4. Clique no botão ✓ para aprovar

### Criação de Postos

1. Como provedor, acesse "Postos"
2. Clique em "Novo Posto"
3. Preencha os dados do posto
4. Selecione o provedor responsável

### Coleta de Dados

1. Acesse "Novo Registro"
2. Preencha o formulário completo
3. Selecione o posto e agente responsável
4. Clique em "Finalizar Registro"

### Visualização de Dados

- **Dashboard**: Visão geral com estatísticas
- **Registros**: Lista completa com filtros
- **Detalhes**: Clique em "Ver Detalhes" para informações completas

## 🔒 Segurança

- **Row Level Security**: Cada usuário só vê seus próprios dados
- **Autenticação**: Gerenciada pelo Supabase Auth
- **Validação**: Formulários validados com Zod
- **HTTPS**: Recomendado em produção

## 🚀 Deploy

### Vercel

1. Conecte seu repositório no Vercel
2. Adicione as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy automático!

### Outras Plataformas

Qualquer plataforma que suporte Vite funciona:
- Netlify
- Cloudflare Pages
- AWS Amplify
- Railway

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console
2. Confirme as credenciais do Supabase
3. Verifique se o schema SQL foi executado corretamente

## 📄 Licença

Este projeto é propriedade da organização SGIS.

---

**Desenvolvido com ❤️ para gestão de impacto social**
