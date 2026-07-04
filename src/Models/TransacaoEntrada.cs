namespace ControleFinanceiro.Models;

public class TransacaoEntrada
{
    public string Descricao { get; set; } = string.Empty;
    public decimal Valor { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public int PessoaId { get; set; }
}

