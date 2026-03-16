/**
 * Cloudflare Pages Function - Records API
 * 
 * Exemplo de API function com parâmetros dinâmicos
 * Equivalente a rotas Express:
 * - app.get('/api/records/:id', ...)
 * - app.put('/api/records/:id', ...)
 * - app.delete('/api/records/:id', ...)
 * 
 * Acesse: https://seu-dominio.pages.dev/api/records/123
 */

import { createClient } from '@supabase/supabase-js';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string; // Para operações admin
}

interface RequestContext {
  request: Request;
  env: Env;
  params: {
    id?: string;
  };
}

// GET /api/records/:id - Buscar um registro específico
export async function onRequestGet(context: RequestContext): Promise<Response> {
  const { env, params } = context;
  const recordId = params.id;

  if (!recordId) {
    return new Response(JSON.stringify({ error: 'ID não fornecido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

    const { data, error } = await supabase
      .from('records')
      .select('*')
      .eq('id', recordId)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Registro não encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60', // Cache por 60 segundos
      },
    });
  } catch (error) {
    console.error('Erro ao buscar registro:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// PUT /api/records/:id - Atualizar um registro
export async function onRequestPut(context: RequestContext): Promise<Response> {
  const { env, params, request } = context;
  const recordId = params.id;

  if (!recordId) {
    return new Response(JSON.stringify({ error: 'ID não fornecido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

    const { data, error } = await supabase
      .from('records')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao atualizar registro:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// DELETE /api/records/:id - Deletar um registro
export async function onRequestDelete(context: RequestContext): Promise<Response> {
  const { env, params } = context;
  const recordId = params.id;

  if (!recordId) {
    return new Response(JSON.stringify({ error: 'ID não fornecido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

    const { error } = await supabase
      .from('records')
      .delete()
      .eq('id', recordId);

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ message: 'Registro deletado com sucesso' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao deletar registro:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// OPTIONS para CORS
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Allow': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
