# Como Configurar Personal Access Token (PAT) para GitHub

## Passo 1: Criar o Personal Access Token

1. **Acesse o GitHub**:
   - Vá para [https://github.com/settings/tokens](https://github.com/settings/tokens)
   - Faça login com sua conta

2. **Gerar novo token**:
   - Clique em **"Generate new token"** (ou "Generate new token (classic)")
   - Dê um nome ao token, ex: "SGIS Git Push"
   - Selecione a expiração (recomendo "No expiration" ou uma data longa)

3. **Selecionar permissões**:
   - Marque a caixa **"repo"** (isto dá acesso completo aos repositórios)
   - Se aparecer, marque também **"workflow"** (para GitHub Actions)

4. **Gerar e copiar**:
   - Clique em **"Generate token"** na parte inferior
   - **COPIE O TOKEN AGORA** (você não poderá vê-lo novamente!)
   - O token será algo como: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Passo 2: Usar o Token para Fazer Push

### Opção A: Usar o Token na URL (Mais Fácil)

Execute este comando no terminal (substitua `SEU_TOKEN_AQUI` pelo token que você copiou):

```bash
"C:\Program Files\Git\bin\git.exe" remote set-url origin https://SEU_TOKEN_AQUI@github.com/huuory-cyber/SGIS-.git
```

Depois faça o push:

```bash
"C:\Program Files\Git\bin\git.exe" push -u origin main
```

### Opção B: Usar o Git Credential Manager (Recomendado)

Execute este comando:

```bash
"C:\Program Files\Git\bin\git.exe" config --global credential.helper store
```

Depois tente fazer o push novamente:

```bash
"C:\Program Files\Git\bin\git.exe" push -u origin main
```

Quando pedir usuário e senha:
- **Username**: `huuory-cyber`
- **Password**: Cole o token (não a senha da sua conta!)

## Passo 3: Verificar se Funcionou

Após o push ser bem-sucedido, você verá algo como:

```
Enumerating objects: 63, done.
Counting objects: 100% (63/63), done.
Delta compression using up to 8 threads
Compressing objects: 100% (52/52), done.
Writing objects: 100% (63/63), done.
Total 63 (delta 0), reused 0 (delta 0), pack-reused 0
To https://github.com/huuory-cyber/SGIS-.git
 * [new branch]      main -> main
```

## Dicas Importantes

- ✅ **Guarde o token em lugar seguro**: Você pode reutilizá-lo no futuro
- ✅ **Não compartilhe o token**: Ele dá acesso total à sua conta do GitHub
- ✅ **Token expira**: Se definir uma data de expiração, precisará criar um novo depois
- ✅ **Revoke se necessário**: Você pode revogar tokens a qualquer momento em [https://github.com/settings/tokens](https://github.com/settings/tokens)

## Solução de Problemas

### Erro: "Authentication failed"
- Verifique se o token foi copiado corretamente
- Certifique-se de que o token tem as permissões corretas (repo)

### Erro: "Connection closed"
- Tente novamente, pode ser uma instabilidade de rede
- Verifique sua conexão com a internet

### Erro: "Repository not found"
- Verifique se o repositório existe em [https://github.com/huuory-cyber/SGIS-](https://github.com/huuory-cyber/SGIS-)
- Verifique se você tem permissão para fazer push no repositório

## Próximos Passos

Após configurar o token com sucesso:
1. O código estará disponível em [https://github.com/huuory-cyber/SGIS-](https://github.com/huuory-cyber/SGIS-)
2. Você poderá fazer push e pull normalmente
3. Outros colaboradores poderão contribuir para o projeto
