namespace ControleFinanceiro.Models;

public class ResultadoTransacao
{
    public bool Sucesso { get; set; }
    public string Mensagem { get; set; } = string.Empty;
    public Transacao? Transacao { get; set; }

    public static ResultadoTransacao Ok(Transacao transacao)
    {
        return new ResultadoTransacao
        {
            Sucesso = true,
            Transacao = transacao
        };
    }

    public static ResultadoTransacao Erro(string mensagem)
    {
        return new ResultadoTransacao
        {
            Sucesso = false,
            Mensagem = mensagem
        };
    }
}

