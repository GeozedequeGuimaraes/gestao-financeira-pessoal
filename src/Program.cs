using ControleFinanceiro.Models;
using ControleFinanceiro.Services;

var builder = WebApplication.CreateBuilder(args);

// Singleton porque cada serviço mantém estado em arquivo e não pode ser recriado por requisição
builder.Services.AddSingleton<PessoaService>();
builder.Services.AddSingleton<TransacaoService>();

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/api/status", () => Results.Ok(new
{
    nome = "Controle financeiro pessoal",
    online = true
}));

app.MapGet("/api/pessoas", async (PessoaService service) =>
{
    var pessoas = await service.ListarAsync();
    return Results.Ok(pessoas);
});

app.MapGet("/api/pessoas/{id:int}", async (int id, PessoaService service) =>
{
    var pessoa = await service.BuscarAsync(id);
    return pessoa is null ? Results.NotFound() : Results.Ok(pessoa);
});

app.MapPost("/api/pessoas", async (PessoaEntrada entrada, PessoaService service) =>
{
    if (string.IsNullOrWhiteSpace(entrada.Nome))
    {
        return Results.BadRequest("Informe o nome da pessoa.");
    }

    if (entrada.Idade < 0)
    {
        return Results.BadRequest("Informe uma idade válida.");
    }

    var pessoa = await service.CriarAsync(entrada);
    return Results.Created($"/api/pessoas/{pessoa.Id}", pessoa);
});

app.MapPut("/api/pessoas/{id:int}", async (int id, PessoaEntrada entrada, PessoaService service) =>
{
    if (string.IsNullOrWhiteSpace(entrada.Nome))
    {
        return Results.BadRequest("Informe o nome da pessoa.");
    }

    if (entrada.Idade < 0)
    {
        return Results.BadRequest("Informe uma idade válida.");
    }

    var pessoa = await service.AtualizarAsync(id, entrada);
    return pessoa is null ? Results.NotFound() : Results.Ok(pessoa);
});

app.MapDelete("/api/pessoas/{id:int}", async (int id, PessoaService pessoaService, TransacaoService transacaoService) =>
{
    var apagou = await pessoaService.RemoverAsync(id);

    // Remove as transações vinculadas só se a pessoa de fato existia
    if (apagou)
    {
        await transacaoService.RemoverPorPessoaAsync(id);
    }

    return apagou ? Results.NoContent() : Results.NotFound();
});

app.MapGet("/api/transacoes", async (TransacaoService service) =>
{
    var transacoes = await service.ListarAsync();
    return Results.Ok(transacoes);
});

app.MapGet("/api/transacoes/{id:int}", async (int id, TransacaoService service) =>
{
    var transacao = await service.BuscarAsync(id);
    return transacao is null ? Results.NotFound() : Results.Ok(transacao);
});

app.MapPost("/api/transacoes", async (TransacaoEntrada entrada, TransacaoService service) =>
{
    if (string.IsNullOrWhiteSpace(entrada.Descricao))
    {
        return Results.BadRequest("Informe a descrição da transação.");
    }

    if (entrada.Valor <= 0)
    {
        return Results.BadRequest("Informe um valor maior que zero.");
    }

    // A validação de regras de negócio (pessoa existente, restrição de idade) fica no serviço
    var resultado = await service.CriarAsync(entrada);

    if (!resultado.Sucesso)
    {
        return Results.BadRequest(resultado.Mensagem);
    }

    return Results.Created($"/api/transacoes/{resultado.Transacao!.Id}", resultado.Transacao);
});

app.MapDelete("/api/transacoes/{id:int}", async (int id, TransacaoService service) =>
{
    var apagou = await service.RemoverAsync(id);
    return apagou ? Results.NoContent() : Results.NotFound();
});

app.MapGet("/api/totais", async (PessoaService pessoaService, TransacaoService transacaoService) =>
{
    var pessoas = await pessoaService.ListarAsync();
    var transacoes = await transacaoService.ListarAsync();

    // Agrupa as transações por pessoa e calcula receitas, despesas e saldo individual
    var pessoasComTotais = pessoas
        .Select(pessoa =>
        {
            var transacoesDaPessoa = transacoes
                .Where(transacao => transacao.PessoaId == pessoa.Id)
                .ToList();

            var totalReceitas = transacoesDaPessoa
                .Where(transacao => transacao.Tipo == "receita")
                .Sum(transacao => transacao.Valor);

            var totalDespesas = transacoesDaPessoa
                .Where(transacao => transacao.Tipo == "despesa")
                .Sum(transacao => transacao.Valor);

            return new TotalPessoa
            {
                PessoaId = pessoa.Id,
                Nome = pessoa.Nome,
                TotalReceitas = totalReceitas,
                TotalDespesas = totalDespesas,
                Saldo = totalReceitas - totalDespesas
            };
        })
        .ToList();

    // Consolida o total geral somando os valores já calculados por pessoa
    var totalGeralReceitas = pessoasComTotais.Sum(item => item.TotalReceitas);
    var totalGeralDespesas = pessoasComTotais.Sum(item => item.TotalDespesas);

    return Results.Ok(new ConsultaTotais
    {
        Pessoas = pessoasComTotais,
        TotalGeralReceitas = totalGeralReceitas,
        TotalGeralDespesas = totalGeralDespesas,
        SaldoGeral = totalGeralReceitas - totalGeralDespesas
    });
});

app.Run();
