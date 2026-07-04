using ControleFinanceiro.Models;
using ControleFinanceiro.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<PessoaService>();

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

app.MapDelete("/api/pessoas/{id:int}", async (int id, PessoaService service) =>
{
    var apagou = await service.RemoverAsync(id);
    return apagou ? Results.NoContent() : Results.NotFound();
});

app.Run();
