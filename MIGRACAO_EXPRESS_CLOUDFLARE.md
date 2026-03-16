# Guia de Migração: Express para Cloudflare Pages Functions

Este guia ajuda a migrar as rotas do seu servidor Express (`server.ts`) para Cloudflare Pages Functions.

## Estrutura de Arquivos

```
functions/
├── _middleware.ts          # Middleware global (CORS, auth, logging)
├── api/
│   ├── health.ts           # GET /api/health
│   ├── records.ts          # GET/POST /api/records
│   └── records/
│       └── [id].ts         # GET/PUT/DELETE /api/records/:id
```

## Comparação de Rotas

### Express → Cloudflare Pages Functions

| Express | Cloudflare Pages Functions |
|---------|----------------------------|
| `app.get('/api/health', handler)` | `functions/api/health.ts` → `onRequestGet()` |
| `app.post('/api/records', handler)` | `functions/api/records.ts` → `onRequestPost()` |
| `app.get('/api/records/:id', handler)` | `functions/api/records/[id].ts` → `onRequestGet()` |
| `app.use(middleware)` | `functions/_middleware.ts` |

## Exemplos de Conversão

### 1. Rota Simples (GET)

**Express:**
```typescript
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});
```

**Cloudflare Pages Function:**
```typescript
// functions/api/health.ts
export async function onRequestGet(): Promise<Response> {
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### 2. Rota com Parâmetros

**Express:**
```typescript
app.get('/api/records/:id', async (req, res) => {
  const { id } = req.params;
  const record = await db.getRecord(id);
  res.json(record);
});
```

**Cloudflare Pages Function:**
```typescript
// functions/api/records/[id].ts
export async function onRequestGet({ params }: {
  params: { id: string }
}): Promise<Response> {
  const { id } = params;
  const record = await db.getRecord(id);
  return new Response(JSON.stringify(record), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### 3. Rota POST com Body

**Express:**
```typescript
app.post('/api/records', async (req, res) => {
  const body = req.body;
  const record = await db.createRecord(body);
  res.status(201).json(record);
});
```

**Cloudflare Pages Function:**
```typescript
// functions/api/records.ts
export async function onRequestPost({ request }: {
  request: Request
}): Promise<Response> {
  const body = await request.json();
  const record = await db.createRecord(body);
  return new Response(JSON.stringify(record), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### 4. Middleware Global

**Express:**
```typescript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  res.header('Access-Control-Allow-Origin', '*');
  next();
});
```

**Cloudflare Pages Function:**
```typescript
// functions/_middleware.ts
export async function onRequest({ request, next }: {
  request: Request;
  next: () => Promise<Response>;
}): Promise<Response> {
  console.log(`${request.method} ${request.url}`);
  
  const response = await next();
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  
  return newResponse;
}
```

## Handlers Disponíveis

Cada function file pode exportar handlers para diferentes métodos HTTP:

```typescript
export async function onRequestGet(context)    // GET
export async function onRequestPost(context)   // POST
export async function onRequestPut(context)    // PUT
export async function onRequestPatch(context)  // PATCH
export async function onRequestDelete(context) // DELETE
export async function onRequestHead(context)   // HEAD
export async function onRequestOptions(context)// OPTIONS
```

## Contexto da Requisição

O objeto `context` contém:

```typescript
interface RequestContext {
  request: Request;        // Objeto Request padrão da Web API
  env: Env;               // Variáveis de ambiente
  params: Record<string, string>; // Parâmetros de rota
  next?: () => Promise<Response>; // Apenas no middleware
}
```

## Variáveis de Ambiente

Configure no painel do Cloudflare ou via `wrangler`:

```bash
# Via CLI
wrangler pages secret put SUPABASE_URL --project-name=sgis
wrangler pages secret put SUPABASE_ANON_KEY --project-name=sgis
```

Ou no dashboard:
1. Workers & Pages > Seu projeto > Settings > Environment Variables

## Supabase Integration

```typescript
import { createClient } from '@supabase/supabase-js';

export async function onRequestGet({ env }: {
  env: { SUPABASE_URL: string; SUPABASE_ANON_KEY: string }
}) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  
  const { data, error } = await supabase
    .from('records')
    .select('*');
  
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## Autenticação

Para proteger rotas, use o middleware:

```typescript
// functions/_middleware.ts
export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  
  // Verificar auth para rotas de API
  if (url.pathname.startsWith('/api/protected')) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }
  }
  
  return next();
}
```

## WebSocket/Socket.io

⚠️ **Cloudflare Pages Functions não suporta WebSocket nativamente.**

Para Socket.io, você tem 3 opções:

1. **Cloudflare Workers** com WebSocket API (requer código customizado)
2. **Serviço separado** para WebSocket (Railway, Render, Pusher, etc.)
3. **Cloudflare Durable Objects** para estado persistente

## Próximos Passos

1. Revise seu `server.ts` e liste todas as rotas
2. Crie os arquivos de functions correspondentes
3. Converta cada rota seguindo os exemplos acima
4. Teste localmente com `wrangler pages dev`
5. Deploy no Cloudflare Pages

## Comandos Úteis

```bash
# Desenvolvimento local
wrangler pages dev -- npm run dev

# Deploy
wrangler pages deploy dist

# Listar secrets
wrangler pages secret list --project-name=sgis
```

## Recursos

- [Cloudflare Pages Functions Docs](https://developers.cloudflare.com/pages/functions/)
- [Migrating from Express](https://developers.cloudflare.com/pages/functions/advanced-mode/)
- [Supabase on Edge Functions](https://supabase.com/docs/guides/functions)
