var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/api/status", () => Results.Ok(new
{
    nome = "Controle financeiro pessoal",
    online = true
}));

app.Run();

