# SGIS - Sistema de Gestão de Impacto Social
## Resumo da Implementação: Controle de Acesso Avançado e Relatórios Automatizados

Este documento resume todas as funcionalidades avançadas implementadas para o Sistema de Gestão de Impacto Social (SGIS).

---

## 📋 Índice

1. [Sistema de Gestão de Provedores (RBAC & Fluxo de Aprovação)](#1-sistema-de-gestão-de-provedores-rbac--fluxo-de-aprovação)
2. [Upload de Imagens com Compressão](#2-upload-de-imagens-com-compressão)
3. [Agregação de Dados e Relatórios](#3-agregação-de-dados-e-relatórios)
4. [Funcionalidade de Exportação](#4-funcionalidade-de-exportação)
5. [Segurança e Criptografia](#5-segurança-e-criptografia)
6. [Capacidade Offline](#6-capacidade-offline)
7. [Dashboards Temporais](#7-dashboards-temporais)
8. [Atualizações do Schema do Banco de Dados](#8-atualizações-do-schema-do-banco-de-dados)

---

## 1. Sistema de Gestão de Provedores (RBAC & Fluxo de Aprovação)

### Funcionalidades Implementadas

#### Fluxo de Cadastro
- Novos provedores se cadastram com status `pending_approval` (aprovação pendente)
- Notificação automática por email para administradores
- Provedores não podem acessar o sistema até serem aprovados

#### Atualizações do Painel Admin
- Seção **Gestão de Usuários** com:
  - Aprovar ou rejeitar novos cadastros
  - Visualizar motivos de rejeição
  - Registrar manualmente novos provedores
  - Atribuir provedores a postos administrativos

#### Controle de Visibilidade
- Provedores veem apenas os dados que inseriram
- Administradores têm acesso global a todos os dados
- Políticas RLS (Row Level Security) reforçam o controle de acesso

### Arquivos Modificados
- [`supabase/schema.sql`](supabase/schema.sql) - Adicionado campo approval_status e políticas RLS
- [`src/lib/supabase.ts`](src/lib/supabase.ts) - Adicionadas funções approveProvider, rejectProvider
- [`src/components/ProvidersManagement.tsx`](src/components/ProvidersManagement.tsx) - UI atualizada com fluxo de aprovação
- [`src/types.ts`](src/types.ts) - Adicionado tipo ApprovalStatus

### Políticas RLS
```sql
-- Apenas provedores aprovados podem acessar seus próprios dados
CREATE POLICY "Approved providers can view their own records"
  ON public.social_records FOR SELECT
  USING (
    provider_id = auth.uid() AND 
    (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved'
  );
```

---

## 2. Upload de Imagens com Compressão

### Funcionalidades Implementadas

#### Compressão no Lado do Cliente
- Compressão automática de imagens antes do upload
- Resolução máxima: 1920x1080
- Qualidade JPEG: 70%
- Compressão média: redução de 60-80% no tamanho

#### Componente de Upload
- Máximo de 2 imagens por registro
- Limite de tamanho: 5MB por imagem
- Visualização em tempo real com estatísticas de compressão
- Indicadores de progresso

### Arquivos Criados
- [`src/components/ImageUpload.tsx`](src/components/ImageUpload.tsx) - Componente de upload com compressão
- [`src/lib/storage.ts`](src/lib/storage.ts) - Integração com Supabase Storage

### Exemplo de Uso
```tsx
<ImageUpload
  images={images}
  onImagesChange={setImages}
  maxImages={2}
  maxSizeMB={5}
/>
```

---

## 3. Agregação de Dados e Relatórios

### Funções Implementadas

#### Estatísticas Diárias
- Volume de atendimentos por posto
- Atualizações em tempo real

#### Relatórios Semanais/Mensais
- Distribuição por tipos de deficiência
- Análise baseada em localização
- Distribuição por situação (Crítica/Moderada/Estável)

#### Relatórios Trimestrais/Anuais
- Mapas de impacto
- Evolução da vulnerabilidade
- Análise de tendências

### Arquivos Criados
- [`src/lib/analytics.ts`](src/lib/analytics.ts) - Funções de agregação de dados

### Funções Principais
```typescript
// Obter estatísticas diárias para todos os postos
getDailyStats(date: Date): Promise<DailyStats[]>

// Obter distribuição de deficiências
getDisabilityDistribution(weeks: number): Promise<DisabilityStats[]>

// Gerar resumo mensal
generateMonthlySummary(year: number, month: number): Promise<MonthlySummary>

// Gerar relatório trimestral de impacto
generateQuarterlyImpact(quarter: number, year: number): Promise<QuarterlyImpact>
```

---

## 4. Funcionalidade de Exportação

### Funcionalidades Implementadas

#### Exportação PDF
- Fichas de registro social individuais
- Formatação profissional
- Layout pronto para impressão
- Inclui todos os dados e imagens do registro

#### Exportação Excel
- Listas completas de registros
- Resumos mensais
- Relatórios trimestrais de impacto
- Exportações filtradas

### Arquivos Criados
- [`src/lib/export.ts`](src/lib/export.ts) - Utilitários de exportação

### Exemplos de Uso
```typescript
// Exportar registro individual para PDF
exportRecordToPDF(record: SocialRecord): Promise<Blob | null>

// Exportar registros para Excel
exportRecordsToExcel(records: SocialRecord[], filename: string): void

// Exportar resumo mensal
exportMonthlySummaryToExcel(summary: MonthlySummary, filename: string): void
```

---

## 5. Segurança e Criptografia

### Funcionalidades Implementadas

#### Criptografia de Dados
- Criptografia no lado do cliente para campos sensíveis
- Criptografia AES-GCM (recomendado)
- Fallback Base64 para compatibilidade
- Funções hash para comparação de dados

#### Campos Criptografados
- Nome
- Telefone
- Email
- História social

### Arquivos Criados
- [`src/lib/encryption.ts`](src/lib/encryption.ts) - Utilitários de criptografia

### Exemplo de Uso
```typescript
// Criptografar dados sensíveis
const encrypted = await encryptSensitiveFields(recordData);

// Descriptografar dados sensíveis
const decrypted = await decryptSensitiveFields(record);
```

---

## 6. Capacidade Offline

### Funcionalidades Implementadas

#### Armazenamento IndexedDB
- Armazenamento local para registros offline
- Sincronização automática quando a conexão é restaurada
- Resolução de conflitos

#### Suporte Offline
- Criar registros sem internet
- Armazenar imagens localmente
- Filas de uploads pendentes
- Sincronização em segundo plano

### Arquivos Criados
- [`src/lib/offline.ts`](src/lib/offline.ts) - Funcionalidade offline

### Funções Principais
```typescript
// Salvar registro para uso offline
saveOfflineRecord(record: SocialRecord): Promise<void>

// Sincronizar todos os registros pendentes
syncAllPendingRecords(): Promise<{ success: number; failed: number }>

// Criar registro com suporte offline
createRecordWithOfflineSupport(
  recordData: NewSocialRecord,
  images?: File[]
): Promise<{ success: boolean; recordId?: string; offline?: boolean }>
```

---

## 7. Dashboards Temporais

### Funcionalidades Implementadas

#### Seleção de Período de Tempo
- Visualização diária
- Visualização semanal
- Visualização mensal
- Visualização trimestral
- Visualização anual

#### Gráficos Dinâmicos
- Gráficos de barras (distribuição por localização)
- Gráficos de pizza (tipos de deficiência)
- Gráficos de linha (tendências ao longo do tempo)

#### Atualizações em Tempo Real
- Atualização automática de dados
- Estatísticas ao vivo
- Capacidades de exportação

### Arquivos Criados
- [`src/components/TemporalDashboard.tsx`](src/components/TemporalDashboard.tsx) - Componente de dashboard

---

## 8. Atualizações do Schema do Banco de Dados

### Novos Campos Adicionados

#### Tabela Profiles
```sql
approval_status TEXT DEFAULT 'pending_approval'
rejection_reason TEXT
approved_by UUID
approved_at TIMESTAMP WITH TIME ZONE
```

#### Tabela Social Records
```sql
image_urls TEXT[] DEFAULT '{}'
image_count INTEGER DEFAULT 0
sync_status TEXT DEFAULT 'synced'
offline_created BOOLEAN DEFAULT FALSE
```

### Políticas RLS Atualizadas

Todas as políticas RLS agora verificam `approval_status = 'approved'` antes de permitir acesso.

---

## 📦 Dependências Adicionadas

```json
{
  "xlsx": "^0.18.5"
}
```

---

## 🚀 Instalação e Configuração

### 1. Execute as Migrações do Banco de Dados

```sql
-- Execute o schema.sql atualizado no Supabase SQL Editor
\i supabase/schema.sql
```

### 2. Crie o Bucket de Storage

```sql
-- Crie o bucket para imagens de registros sociais
INSERT INTO storage.buckets (id, name, public)
VALUES ('social-records-images', 'social-records-images', false);
```

### 3. Configure as Variáveis de Ambiente

```env
VITE_ENCRYPTION_KEY=sua-chave-de-criptografia-aqui
```

### 4. Instale as Dependências

```bash
npm install
```

---

## 📝 Exemplos de Uso

### Aprovando um Provedor

```typescript
await approveProvider(providerId, adminId);
```

### Fazendo Upload de Imagens

```typescript
const urls = await uploadRecordImages(recordId, providerId, files);
```

### Gerando Relatórios

```typescript
const summary = await generateMonthlySummary(2024, 3);
exportMonthlySummaryToExcel(summary, 'relatorio.xlsx');
```

### Criação de Registro Offline

```typescript
const result = await createRecordWithOfflineSupport(recordData, images);
if (result.offline) {
  console.log('Registro salvo offline, será sincronizado quando online');
}
```

---

## 🔒 Considerações de Segurança

1. **Chave de Criptografia**: Armazene com segurança nas variáveis de ambiente
2. **Políticas RLS**: Certifique-se de que todas as tabelas tenham políticas adequadas
3. **Storage**: Use buckets privados para imagens
4. **Chaves API**: Nunca exponha chaves de serviço no código cliente

---

## 📊 Otimizações de Performance

1. **Compressão de Imagens**: Reduz a largura de banda em 60-80%
2. **IndexedDB**: Acesso rápido a dados offline
3. **Lazy Loading**: Gráficos carregam dados sob demanda
4. **Assinaturas em Tempo Real**: Sincroniza apenas dados alterados

---

## 🐛 Problemas Conhecidos e Melhorias Futuras

### Problemas Conhecidos
- Uploads de imagens grandes podem dar timeout em conexões lentas
- Sincronização offline pode ter conflitos em casos raros

### Melhorias Futuras
- [ ] Notificações push para status de aprovação
- [ ] Filtros avançados nos dashboards
- [ ] Templates de relatórios personalizados
- [ ] Suporte multilíngue
- [ ] Versão aplicativo móvel

---

## 📞 Suporte

Para problemas ou dúvidas, consulte:
- Documentação Supabase: https://supabase.com/docs
- Documentação React: https://react.dev
- Documentação Date-fns: https://date-fns.org

---

**Versão do Documento**: 1.0  
**Última Atualização**: 12-01-2025  
**Autor**: Equipe de Desenvolvimento SGIS
