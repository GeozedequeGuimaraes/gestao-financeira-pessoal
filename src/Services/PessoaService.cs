using System.Text.Json;
using ControleFinanceiro.Models;

namespace ControleFinanceiro.Services;

public class PessoaService
{
    private readonly string _arquivo;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        WriteIndented = true
    };

    public PessoaService(IWebHostEnvironment ambiente)
    {
        var pastaDados = Path.Combine(ambiente.ContentRootPath, "..", "data");
        Directory.CreateDirectory(pastaDados);
        _arquivo = Path.Combine(pastaDados, "pessoas.json");
    }

    public async Task<List<Pessoa>> ListarAsync()
    {
        return await LerArquivoAsync();
    }

    public async Task<Pessoa?> BuscarAsync(int id)
    {
        var pessoas = await LerArquivoAsync();
        return pessoas.FirstOrDefault(pessoa => pessoa.Id == id);
    }

    public async Task<Pessoa> CriarAsync(PessoaEntrada entrada)
    {
        var pessoas = await LerArquivoAsync();
        var proximoId = pessoas.Count == 0 ? 1 : pessoas.Max(pessoa => pessoa.Id) + 1;

        var pessoa = new Pessoa
        {
            Id = proximoId,
            Nome = entrada.Nome.Trim(),
            Idade = entrada.Idade
        };

        pessoas.Add(pessoa);
        await SalvarArquivoAsync(pessoas);

        return pessoa;
    }

    public async Task<Pessoa?> AtualizarAsync(int id, PessoaEntrada entrada)
    {
        var pessoas = await LerArquivoAsync();
        var pessoa = pessoas.FirstOrDefault(item => item.Id == id);

        if (pessoa is null)
        {
            return null;
        }

        pessoa.Nome = entrada.Nome.Trim();
        pessoa.Idade = entrada.Idade;

        await SalvarArquivoAsync(pessoas);
        return pessoa;
    }

    public async Task<bool> RemoverAsync(int id)
    {
        var pessoas = await LerArquivoAsync();
        var pessoa = pessoas.FirstOrDefault(item => item.Id == id);

        if (pessoa is null)
        {
            return false;
        }

        pessoas.Remove(pessoa);
        await SalvarArquivoAsync(pessoas);

        return true;
    }

    private async Task<List<Pessoa>> LerArquivoAsync()
    {
        if (!File.Exists(_arquivo))
        {
            return [];
        }

        await using var stream = File.OpenRead(_arquivo);
        var pessoas = await JsonSerializer.DeserializeAsync<List<Pessoa>>(stream, _jsonOptions);

        return pessoas ?? [];
    }

    private async Task SalvarArquivoAsync(List<Pessoa> pessoas)
    {
        await using var stream = File.Create(_arquivo);
        await JsonSerializer.SerializeAsync(stream, pessoas, _jsonOptions);
    }
}

