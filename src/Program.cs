using ControleFinanceiro.Models;
using ControleFinanceiro.Services;

var builder = WebApplication.CreateBuilder(args);
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
        return Results.BadRequest("Informe uma idade valida.");
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
        return Results.BadRequest("Informe uma idade valida.");
    }

    var pessoa = await service.AtualizarAsync(id, entrada);
    return pessoa is null ? Results.NotFound() : Results.Ok(pessoa);
});

app.MapDelete("/api/pessoas/{id:int}", async (int id, PessoaService pessoaService, TransacaoService transacaoService) =>
{
    var apagou = await pessoaService.RemoverAsync(id);

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
        return Results.BadRequest("Informe a descricao da transacao.");
    }

    if (entrada.Valor <= 0)
    {
        return Results.BadRequest("Informe um valor maior que zero.");
    }

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

app.Run();
