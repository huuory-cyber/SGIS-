/**
 * Cloudflare Pages Function - Health Check
 * 
 * Esta é uma API function que roda na edge do Cloudflare
 * Equivalente a uma rota Express: app.get('/api/health', ...)
 * 
 * Acesse: https://seu-dominio.pages.dev/api/health
 */

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  environment: string;
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { env } = context;

  const healthData: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'production',
  };

  return new Response(JSON.stringify(healthData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

// Suporte para outros métodos HTTP
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Allow': 'GET, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
