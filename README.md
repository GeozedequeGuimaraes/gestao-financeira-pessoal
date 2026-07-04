# Controle financeiro pessoal

Aplicacao simples para cadastro de pessoas, registro de receitas e despesas e consulta de totais por pessoa.

## Tecnologias

- Backend em C# com ASP.NET Core
- Frontend em React com TypeScript
- Persistencia local em arquivo JSON

## Funcionalidades previstas

- Cadastro, edicao, listagem e exclusao de pessoas
- Cadastro de transacoes vinculadas a uma pessoa
- Bloqueio de receitas para menores de idade
- Totalizacao de receitas, despesas e saldo por pessoa
- Total geral consolidado

## Como executar

```bash
cd frontend
npm install
npm run build
cd ..
dotnet run --project src/ControleFinanceiro.csproj
```

Depois, acesse o endereco exibido pelo terminal.

Durante o desenvolvimento do front-end, tambem e possivel usar:

```bash
cd frontend
npm run dev
```
