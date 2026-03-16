# Deploy no Cloudflare Pages - SGIS

## Configuração do Framework Preset

No painel do Cloudflare Pages, configure:

**Framework Preset:** `Vite`

**Build Settings:**
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** `/` (ou deixe em branco para usar a raiz do projeto)
- **Node.js version:** `20` (importante: o projeto requer Node.js 20+)

**Environment Variables:**
Configure estas variáveis no Cloudflare Pages Dashboard:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
NODE_VERSION=20
```

⚠️ **Importante:** Este projeto requer **Node.js 20+** devido às dependências (@firebase, @supabase, @tailwindcss/oxide, react-router, etc.). O Cloudflare Pages usa Node.js 18 por padrão, então você deve especificar a versão 20.

## Passo a Passo para Deploy

### Opção 1: Deploy via GitHub (Recomendado)

1. **Conectar repositório GitHub:**
   - Vá para [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Acesse: Workers & Pages > Create application > Pages > Connect to Git
   - Selecione seu repositório `sgis---gestão-de-impacto-social`

2. **Configurar build:**
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`

3. **Adicionar variáveis de ambiente:**
   - Settings > Environment variables
   - Adicione as variáveis listadas acima

4. **Deploy:**
   - Clique em "Save and Deploy"
   - O Cloudflare fará deploy automático a cada push no branch main

### Opção 2: Deploy via Wrangler CLI

1. **Instalar Wrangler:**
```bash
npm install -g wrangler
```

2. **Login no Cloudflare:**
```bash
wrangler login
```

3. **Build do projeto:**
```bash
npm run build
```

4. **Deploy:**
```bash
wrangler pages deploy dist --project-name=sgis-gestao-impacto-social
```

### Opção 3: Deploy via Direct Upload

1. **Build do projeto:**
```bash
npm install
npm run build
```

2. **Upload no Dashboard:**
   - Vá para [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Workers & Pages > Create application > Pages > Upload assets
   - Faça upload da pasta `dist`

## Observações Importantes

### Backend/Express Server
Seu projeto atual usa um servidor Express (`server.ts`). O Cloudflare Pages é focado em sites estáticos/SSG. Para o backend, você tem 3 opções:

**Opção A: Cloudflare Pages Functions (Recomendado)**
- Converta suas rotas Express para Cloudflare Pages Functions
- Crie arquivos em `functions/api/[...].ts`

**Opção B: Cloudflare Workers**
- Migrar o Express para Cloudflare Workers
- Melhor performance e edge computing

**Opção C: Backend Separado**
- Mantenha o Express em outro serviço (Railway, Render, etc.)
- Configure CORS para o domínio do Cloudflare Pages

### Variáveis de Ambiente
- Prefixe variáveis de frontend com `VITE_` (ex: `VITE_SUPABASE_URL`)
- Variáveis de backend (sem `VITE_`) ficam expostas no cliente - use apenas para dados públicos

### Supabase
- Configure as políticas RLS no Supabase para segurança
- Use Service Role Keys apenas no backend (nunca no frontend)

## Comandos Úteis

```bash
# Build local para teste
npm run build

# Preview local do build
npm run preview

# Deploy via Wrangler
wrangler pages deploy dist

# Ver logs do deploy
wrangler pages deployment list --project-name=sgis-gestao-impacto-social
```

## Suporte

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Vite on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/vite/)
