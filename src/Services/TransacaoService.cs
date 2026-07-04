using System.Text.Json;
using ControleFinanceiro.Models;

namespace ControleFinanceiro.Services;

public class TransacaoService
{
    private readonly string _arquivo;
    private readonly PessoaService _pessoaService;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        WriteIndented = true
    };

    public TransacaoService(IWebHostEnvironment ambiente, PessoaService pessoaService)
    {
        _pessoaService = pessoaService;

        var pastaDados = Path.Combine(ambiente.ContentRootPath, "..", "data");
        Directory.CreateDirectory(pastaDados);
        _arquivo = Path.Combine(pastaDados, "transacoes.json");
    }

    public async Task<List<Transacao>> ListarAsync()
    {
        return await LerArquivoAsync();
    }

    public async Task<Transacao?> BuscarAsync(int id)
    {
        var transacoes = await LerArquivoAsync();
        return transacoes.FirstOrDefault(transacao => transacao.Id == id);
    }

    public async Task<ResultadoTransacao> CriarAsync(TransacaoEntrada entrada)
    {
        var pessoa = await _pessoaService.BuscarAsync(entrada.PessoaId);

        if (pessoa is null)
        {
            return ResultadoTransacao.Erro("Pessoa não encontrada.");
        }

        var tipo = entrada.Tipo.Trim().ToLowerInvariant();

        if (tipo != "receita" && tipo != "despesa")
        {
            return ResultadoTransacao.Erro("O tipo deve ser receita ou despesa.");
        }

        if (pessoa.Idade < 18 && tipo == "receita")
        {
            return ResultadoTransacao.Erro("Menores de idade podem ter apenas despesas cadastradas.");
        }

        var transacoes = await LerArquivoAsync();
        var proximoId = transacoes.Count == 0 ? 1 : transacoes.Max(transacao => transacao.Id) + 1;

        var transacao = new Transacao
        {
            Id = proximoId,
            Descricao = entrada.Descricao.Trim(),
            Valor = entrada.Valor,
            Tipo = tipo,
            PessoaId = entrada.PessoaId
        };

        transacoes.Add(transacao);
        await SalvarArquivoAsync(transacoes);

        return ResultadoTransacao.Ok(transacao);
    }

    public async Task<bool> RemoverAsync(int id)
    {
        var transacoes = await LerArquivoAsync();
        var transacao = transacoes.FirstOrDefault(item => item.Id == id);

        if (transacao is null)
        {
            return false;
        }

        transacoes.Remove(transacao);
        await SalvarArquivoAsync(transacoes);

        return true;
    }

    public async Task RemoverPorPessoaAsync(int pessoaId)
    {
        var transacoes = await LerArquivoAsync();
        var restantes = transacoes
            .Where(transacao => transacao.PessoaId != pessoaId)
            .ToList();

        await SalvarArquivoAsync(restantes);
    }

    private async Task<List<Transacao>> LerArquivoAsync()
    {
        if (!File.Exists(_arquivo))
        {
            return [];
        }

        await using var stream = File.OpenRead(_arquivo);
        var transacoes = await JsonSerializer.DeserializeAsync<List<Transacao>>(stream, _jsonOptions);

        return transacoes ?? [];
    }

    private async Task SalvarArquivoAsync(List<Transacao> transacoes)
    {
        await using var stream = File.Create(_arquivo);
        await JsonSerializer.SerializeAsync(stream, transacoes, _jsonOptions);
    }
}
