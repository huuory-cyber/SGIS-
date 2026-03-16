/**
 * Cloudflare Pages Functions - Middleware
 * Este arquivo intercepta todas as requisições antes de chegar às páginas estáticas
 * 
 * Útil para:
 * - Autenticação
 * - CORS
 * - Logging
 * - Redirecionamentos
 */

export interface Env {
  // Supabase credentials (configure no Cloudflare dashboard)
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  // Outras variáveis de ambiente
}

export async function onRequest(context: {
  request: Request;
  next: () => Promise<Response>;
  env: Env;
}) {
  const { request, next, env } = context;

  // Log da requisição
  console.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`);

  // CORS headers (se necessário)
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Responder a preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Adicionar headers CORS à resposta
  const response = await next();
  const newResponse = new Response(response.body, response);
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });

  return newResponse;
}
