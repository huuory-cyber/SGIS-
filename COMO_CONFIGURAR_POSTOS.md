# Como Configurar Postos e Agentes no SGIS

## Problema: Campos dropdown vazios no formulário

Se os campos **"Posto de Atendimento"** e **"Agente Responsável"** estão sem opções de seleção, é porque não há postos ou agentes cadastrados no sistema.

## Solução

### Para Administradores

#### 1. Criar um Posto de Atendimento

1. Faça login como **Administrador**
2. No dashboard, clique na aba **"Postos"** (ou "Stations")
3. Clique no botão **"Novo Posto"** ou **"Adicionar Posto"**
4. Preencha os dados:
   - **Nome**: Ex: "Posto de Atendimento Central"
   - **Endereço**: Ex: "Rua Principal, 123"
   - **Bairro**: Ex: "Centro"
   - **Localidade**: Ex: "Maputo"
5. Clique em **"Salvar"**

#### 2. Adicionar Agentes ao Posto

1. Na aba **"Postos"**, encontre o posto criado
2. Clique em **"Gerenciar"** ou **"Ver Detalhes"**
3. Clique em **"Adicionar Agente"**
4. Preencha os dados:
   - **Nome**: Ex: "João Silva"
   - **Número de Crachá**: Ex: "AG-001"
5. Clique em **"Salvar"**

### Para Provedores

Se você é um **Provedor** e não tem postos disponíveis:

1. Entre em contato com o **Administrador** do sistema
2. Solicite que um posto seja criado e atribuído ao seu perfil
3. Após a criação, o posto aparecerá automaticamente no seu formulário

## Verificação

Após criar os postos e agentes:

1. **Abra o console do navegador** (F12)
2. **Vá para a aba "Console"**
3. **Navegue até o formulário**
4. **Procure pelas mensagens**:
   - `Carregando postos para usuário: admin` (ou `provider`)
   - `Postos carregados (admin): [...]`
   - `Carregando agentes para posto: ST-...`
   - `Agentes filtrados: [...]`

Se os arrays estiverem vazios, verifique:
- Se o posto foi criado corretamente no banco de dados
- Se o provedor tem permissão para acessar o posto
- Se os agentes foram atribuídos ao posto correto

## Estrutura de Dados

### Posto (Station)
```javascript
{
  id: "ST-12345678",
  name: "Posto Central",
  address: "Rua Principal, 123",
  neighborhood: "Centro",
  locality: "Maputo",
  provider_id: "uuid-do-provedor"
}
```

### Agente (Agent)
```javascript
{
  id: "AG-12345678",
  name: "João Silva",
  badge_number: "AG-001",
  station_id: "ST-12345678",
  provider_id: "uuid-do-provedor",
  is_active: true
}
```

## Suporte

Se continuar com problemas, verifique:
1. Se você está logado com a conta correta (admin ou provider aprovado)
2. Se o banco de dados está conectado corretamente
3. Se as políticas RLS (Row Level Security) do Supabase estão configuradas corretamente
