import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type Pessoa = {
  id: number;
  nome: string;
  idade: number;
};

type Transacao = {
  id: number;
  descricao: string;
  valor: number;
  tipo: "receita" | "despesa";
  pessoaId: number;
};

type TotalPessoa = {
  pessoaId: number;
  nome: string;
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
};

type ConsultaTotais = {
  pessoas: TotalPessoa[];
  totalGeralReceitas: number;
  totalGeralDespesas: number;
  saldoGeral: number;
};

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

function App() {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [totais, setTotais] = useState<ConsultaTotais | null>(null);
  const [pessoaEditando, setPessoaEditando] = useState<Pessoa | null>(null);
  const [mensagem, setMensagem] = useState("");

  const [nome, setNome] = useState("");
  const [idade, setIdade] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState<"despesa" | "receita">("despesa");
  const [pessoaId, setPessoaId] = useState("");

  async function carregarDados() {
    const [pessoasResposta, transacoesResposta, totaisResposta] = await Promise.all([
      fetch("/api/pessoas"),
      fetch("/api/transacoes"),
      fetch("/api/totais")
    ]);

    setPessoas(await pessoasResposta.json());
    setTransacoes(await transacoesResposta.json());
    setTotais(await totaisResposta.json());
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const pessoasPorId = useMemo(() => {
    return new Map(pessoas.map((pessoa) => [pessoa.id, pessoa]));
  }, [pessoas]);

  async function salvarPessoa(evento: FormEvent) {
    evento.preventDefault();
    setMensagem("");

    const corpo = {
      nome,
      idade: Number(idade)
    };

    const resposta = await fetch(pessoaEditando ? `/api/pessoas/${pessoaEditando.id}` : "/api/pessoas", {
      method: pessoaEditando ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo)
    });

    if (!resposta.ok) {
      setMensagem(await resposta.text());
      return;
    }

    setNome("");
    setIdade("");
    setPessoaEditando(null);
    await carregarDados();
  }

  async function removerPessoa(id: number) {
    await fetch(`/api/pessoas/${id}`, { method: "DELETE" });
    await carregarDados();
  }

  function editarPessoa(pessoa: Pessoa) {
    setPessoaEditando(pessoa);
    setNome(pessoa.nome);
    setIdade(String(pessoa.idade));
  }

  async function cadastrarTransacao(evento: FormEvent) {
    evento.preventDefault();
    setMensagem("");

    const resposta = await fetch("/api/transacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        descricao,
        valor: Number(valor),
        tipo,
        pessoaId: Number(pessoaId)
      })
    });

    if (!resposta.ok) {
      setMensagem(await resposta.text());
      return;
    }

    setDescricao("");
    setValor("");
    setTipo("despesa");
    setPessoaId("");
    await carregarDados();
  }

  return (
    <main className="pagina">
      <header className="topo">
        <div>
          <span className="rotulo">Controle residencial</span>
          <h1>Gestao financeira pessoal</h1>
        </div>
        <section className="resumo-geral" aria-label="Resumo geral">
          <div>
            <span>Receitas</span>
            <strong>{moeda.format(totais?.totalGeralReceitas ?? 0)}</strong>
          </div>
          <div>
            <span>Despesas</span>
            <strong>{moeda.format(totais?.totalGeralDespesas ?? 0)}</strong>
          </div>
          <div>
            <span>Saldo</span>
            <strong>{moeda.format(totais?.saldoGeral ?? 0)}</strong>
          </div>
        </section>
      </header>

      {mensagem && <p className="aviso">{mensagem}</p>}

      <section className="grade">
        <form className="painel" onSubmit={salvarPessoa}>
          <h2>{pessoaEditando ? "Editar pessoa" : "Nova pessoa"}</h2>
          <label>
            Nome
            <input value={nome} onChange={(evento) => setNome(evento.target.value)} required />
          </label>
          <label>
            Idade
            <input
              type="number"
              min="0"
              value={idade}
              onChange={(evento) => setIdade(evento.target.value)}
              required
            />
          </label>
          <div className="acoes">
            <button type="submit">{pessoaEditando ? "Salvar" : "Cadastrar"}</button>
            {pessoaEditando && (
              <button type="button" className="secundario" onClick={() => setPessoaEditando(null)}>
                Cancelar
              </button>
            )}
          </div>
        </form>

        <form className="painel" onSubmit={cadastrarTransacao}>
          <h2>Nova transacao</h2>
          <label>
            Pessoa
            <select value={pessoaId} onChange={(evento) => setPessoaId(evento.target.value)} required>
              <option value="">Selecione</option>
              {pessoas.map((pessoa) => (
                <option key={pessoa.id} value={pessoa.id}>
                  {pessoa.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Descricao
            <input value={descricao} onChange={(evento) => setDescricao(evento.target.value)} required />
          </label>
          <div className="linha">
            <label>
              Valor
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={valor}
                onChange={(evento) => setValor(evento.target.value)}
                required
              />
            </label>
            <label>
              Tipo
              <select value={tipo} onChange={(evento) => setTipo(evento.target.value as "despesa" | "receita")}>
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
              </select>
            </label>
          </div>
          <button type="submit">Cadastrar</button>
        </form>
      </section>

      <section className="conteudo">
        <div className="painel">
          <h2>Pessoas</h2>
          <div className="lista">
            {pessoas.map((pessoa) => (
              <article key={pessoa.id} className="item">
                <div>
                  <strong>{pessoa.nome}</strong>
                  <span>{pessoa.idade} anos</span>
                </div>
                <div className="acoes">
                  <button type="button" className="secundario" onClick={() => editarPessoa(pessoa)}>
                    Editar
                  </button>
                  <button type="button" className="perigo" onClick={() => removerPessoa(pessoa.id)}>
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="painel">
          <h2>Transacoes</h2>
          <div className="lista">
            {transacoes.map((transacao) => (
              <article key={transacao.id} className="item">
                <div>
                  <strong>{transacao.descricao}</strong>
                  <span>{pessoasPorId.get(transacao.pessoaId)?.nome ?? "Pessoa removida"}</span>
                </div>
                <em className={transacao.tipo}>{moeda.format(transacao.valor)}</em>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="painel totais">
        <h2>Totais por pessoa</h2>
        <div className="tabela">
          <div className="cabecalho">
            <span>Pessoa</span>
            <span>Receitas</span>
            <span>Despesas</span>
            <span>Saldo</span>
          </div>
          {totais?.pessoas.map((pessoa) => (
            <div key={pessoa.pessoaId} className="linha-tabela">
              <span>{pessoa.nome}</span>
              <span>{moeda.format(pessoa.totalReceitas)}</span>
              <span>{moeda.format(pessoa.totalDespesas)}</span>
              <strong>{moeda.format(pessoa.saldo)}</strong>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

