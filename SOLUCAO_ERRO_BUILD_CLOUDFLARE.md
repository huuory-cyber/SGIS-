# Solução para Erro de Build no Cloudflare Pages

## Problema

O build estava falhando no Cloudflare Pages com o seguinte erro:

```
Error: Cannot find native binding. npm has a bug related to optional dependencies.
```

## Causa Raiz

O problema ocorreu por dois motivos principais:

1. **Versão do Node.js inadequada:** O Cloudflare Pages estava usando Node.js 18.20.8, mas o projeto requer Node.js 20+ devido às seguintes dependências:
   - `@firebase/*` - requer Node.js >=20.0.0
   - `@supabase/*` - requer Node.js >=20.0.0
   - `@tailwindcss/oxide` - requer Node.js >=20
   - `@vitejs/plugin-react` - requer Node.js ^20.19.0 ou >=22.12.0
   - `better-sqlite3` - requer Node.js 20.x, 22.x, 23.x, 24.x, ou 25.x
   - `react-router` - requer Node.js >=20.0.0

2. **Erro do Tailwind CSS oxide:** O pacote `@tailwindcss/oxide` falha ao carregar no Node.js 18 devido à falta de bindings nativos corretos.

## Solução Aplicada

### 1. Arquivos de Versão do Node.js

Criados arquivos para especificar a versão do Node.js:

- **[`.nvmrc`](.nvmrc)** - Para NVM (Node Version Manager)
- **[`.node-version`](.node-version)** - Para ferramentas de auto-deteção

Ambos contêm: `20`

### 2. Configuração no [`package.json`](package.json:8)

Adicionado campo `engines` para especificar a versão mínima:

```json
{
  "engines": {
    "node": ">=20.0.0"
  }
}
```

### 3. Configuração no [`wrangler.toml`](wrangler.toml:14)

Adicionado variável de ambiente para o build:

```toml
[build.environment_variables]
NODE_VERSION = "20"
```

### 4. Configuração no Cloudflare Pages Dashboard

No painel do Cloudflare Pages, configure:

**Environment Variables:**
```
NODE_VERSION=20
```

Ou via interface:
1. Vá para: Workers & Pages > Seu projeto > Settings > Environment variables
2. Adicione: `NODE_VERSION` = `20`

## Como Aplicar a Correção

### Opção 1: Via Dashboard do Cloudflare Pages

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Workers & Pages > Seu projeto > Settings > Environment variables
3. Adicione a variável:
   - **Name:** `NODE_VERSION`
   - **Value:** `20`
4. Clique em "Save"
5. Faça um novo deploy

### Opção 2: Via Wrangler CLI

```bash
# Adicionar variável de ambiente
wrangler pages secret put NODE_VERSION --project-name=sgis-gestao-impacto-social
# Digite: 20
```

### Opção 3: Via .nvmrc (já criado)

O arquivo [`.nvmrc`](.nvmrc) já foi criado e será detectado automaticamente pelo Cloudflare Pages.

## Verificação

Após aplicar a correção, o build deve usar Node.js 20 e os warnings de engine devem desaparecer:

```
Installing nodejs 20.x.x
✓ Node.js 20.x.x installed
```

## Comandos Úteis

```bash
# Verificar versão do Node.js local
node --version

# Verificar versões compatíveis
nvm ls-remote | grep "v20"

# Instalar Node.js 20 via NVM
nvm install 20
nvm use 20

# Testar build localmente
npm install
npm run build

# Deploy com Wrangler
npm run cf:deploy
```

## Recursos Adicionais

- [Cloudflare Pages - Node.js Versions](https://developers.cloudflare.com/pages/platform/build-configuration/#node-js-versions)
- [Node.js Engine Specification](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#engines)
- [NVM Node Version Manager](https://github.com/nvm-sh/nvm)

## Status

✅ Arquivos de configuração criados
✅ Documentação atualizada
⏳ Aguardando novo deploy no Cloudflare Pages para confirmação
