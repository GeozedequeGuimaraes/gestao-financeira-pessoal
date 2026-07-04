# Gestão financeira pessoal

Aplicação para cadastro de pessoas, registro de receitas e despesas e consulta de totais por pessoa.

![Interface da aplicação](docs/interface.png)

## Tecnologias

- Backend em C# com ASP.NET Core
- Frontend em React com TypeScript
- Persistência local em arquivo JSON

## Pré-requisitos

- .NET SDK 8 ou superior
- Node.js 20 ou superior
- npm

## Funcionalidades

- Cadastro, edição, listagem e exclusão de pessoas
- Cadastro e listagem de transações vinculadas a uma pessoa
- Bloqueio de receitas para menores de idade
- Exclusão das transações quando uma pessoa é removida
- Totalização de receitas, despesas e saldo por pessoa
- Total geral consolidado

## Regras principais

- Cada pessoa possui um identificador gerado automaticamente, nome e idade.
- Cada transação possui um identificador gerado automaticamente, descrição, valor, tipo e pessoa vinculada.
- A pessoa vinculada a uma transação precisa existir no cadastro de pessoas.
- Pessoas menores de 18 anos podem ter apenas despesas cadastradas.
- Ao excluir uma pessoa, as transações vinculadas a ela também são removidas.

## Como executar

Instale as dependências do front-end:

```bash
cd frontend
npm install
```

### Rodando a aplicação completa

Primeiro, gere os arquivos do front-end que serão servidos pelo ASP.NET Core:

```bash
npm run build
cd ..
```

Depois, execute o back-end:

```bash
dotnet run --project src/ControleFinanceiro.csproj
```

Acesse o endereço exibido pelo terminal.

### Rodando em modo desenvolvimento

Para desenvolver com atualização automática do React, mantenha dois terminais abertos.

No primeiro terminal, execute a API:

```bash
dotnet run --project src/ControleFinanceiro.csproj
```

No segundo terminal, execute o front-end:

```bash
cd frontend
npm run dev
```

Nesse modo, acesse o endereço exibido pelo Vite, normalmente `http://127.0.0.1:5173`. O front-end depende da API do ASP.NET Core em execução para carregar cadastros, transações e totais.

## Observações

Os dados são armazenados em arquivos JSON na pasta `data`, o que permite manter as informações cadastradas mesmo após fechar a aplicação.
