namespace ControleFinanceiro.Models;

public class ConsultaTotais
{
    public List<TotalPessoa> Pessoas { get; set; } = [];
    public decimal TotalGeralReceitas { get; set; }
    public decimal TotalGeralDespesas { get; set; }
    public decimal SaldoGeral { get; set; }
}

