import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import imagemTopo from "./assets/controle-financeiro.jpg";
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

const totaisVazios: ConsultaTotais = {
  pessoas: [],
  totalGeralReceitas: 0,
  totalGeralDespesas: 0,
  saldoGeral: 0
};

async function buscarJson<T>(url: string, valorPadrao: T) {
  const resposta = await fetch(url);

  if (!resposta.ok) {
    return valorPadrao;
  }

  return (await resposta.json()) as T;
}

async function lerMensagemErro(resposta: Response) {
  const texto = await resposta.text();

  try {
    const conteudo = JSON.parse(texto);

    if (typeof conteudo === "string") {
      return conteudo;
    }
  } catch {
    return texto;
  }

  return texto;
}

function App() {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [totais, setTotais] = useState<ConsultaTotais | null>(null);
  const [pessoaEditando, setPessoaEditando] = useState<Pessoa | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [apiDisponivel, setApiDisponivel] = useState(true);

  const [nome, setNome] = useState("");
  const [idade, setIdade] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState<"despesa" | "receita">("despesa");
  const [pessoaId, setPessoaId] = useState("");

  async function carregarDados() {
    try {
      const pessoasDados = await buscarJson<Pessoa[]>("/api/pessoas", []);
      const [transacoesDados, totaisDados] = await Promise.all([
        buscarJson<Transacao[]>("/api/transacoes", []),
        buscarJson<ConsultaTotais>("/api/totais", totaisVazios)
      ]);

      setPessoas(pessoasDados);
      setTransacoes(transacoesDados);
      setTotais(totaisDados);
      setApiDisponivel(true);
    } catch {
      setPessoas([]);
      setTransacoes([]);
      setTotais(totaisVazios);
      setApiDisponivel(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const pessoasPorId = useMemo(() => {
    return new Map(pessoas.map((pessoa) => [pessoa.id, pessoa]));
  }, [pessoas]);

  function limparFormularioPessoa() {
    setNome("");
    setIdade("");
    setPessoaEditando(null);
  }

  async function salvarPessoa(evento: FormEvent) {
    evento.preventDefault();
    setMensagem("");

    const corpo = {
      nome,
      idade: Number(idade)
    };

    try {
      const resposta = await fetch(pessoaEditando ? `/api/pessoas/${pessoaEditando.id}` : "/api/pessoas", {
        method: pessoaEditando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo)
      });

      if (!resposta.ok) {
        setMensagem(await lerMensagemErro(resposta));
        return;
      }

      limparFormularioPessoa();
      await carregarDados();
    } catch {
      setMensagem("Não foi possível conectar ao back-end. Verifique se a API está em execução.");
    }
  }

  async function removerPessoa(id: number) {
    const pessoa = pessoas.find((item) => item.id === id);
    const confirmou = window.confirm(
      `Excluir ${pessoa?.nome ?? "esta pessoa"}? As transações vinculadas também serão removidas.`
    );

    if (!confirmou) {
      return;
    }

    try {
      await fetch(`/api/pessoas/${id}`, { method: "DELETE" });
      await carregarDados();
    } catch {
      setMensagem("Não foi possível conectar ao back-end. Verifique se a API está em execução.");
    }
  }

  function editarPessoa(pessoa: Pessoa) {
    setPessoaEditando(pessoa);
    setNome(pessoa.nome);
    setIdade(String(pessoa.idade));
  }

  async function cadastrarTransacao(evento: FormEvent) {
    evento.preventDefault();
    setMensagem("");

    try {
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
        setMensagem(await lerMensagemErro(resposta));
        return;
      }

      setDescricao("");
      setValor("");
      setTipo("despesa");
      setPessoaId("");
      await carregarDados();
    } catch {
      setMensagem("Não foi possível conectar ao back-end. Verifique se a API está em execução.");
    }
  }

  return (
    <main className="pagina">
      <header className="topo">
        <div className="texto-topo">
          <span className="rotulo">Controle residencial</span>
          <h1>Organize gastos, receitas e saldos da casa.</h1>
          <p className="subtitulo">
            Cadastre pessoas, registre movimentações e acompanhe o resultado financeiro de cada uma.
          </p>
        </div>
        <div className="visual-topo">
          <figure className="foto-topo">
            <img src={imagemTopo} alt="Mesa com calculadora, relatórios e uma xícara de café" />
          </figure>
          <div className="cartao-destaque">
            <span>Saldo geral</span>
            <strong>{moeda.format(totais?.saldoGeral ?? 0)}</strong>
          </div>
        </div>
      </header>

      <section className="resumo-geral" aria-label="Resumo geral">
        <div className="receitas-card">
          <span>Receitas</span>
          <strong>{moeda.format(totais?.totalGeralReceitas ?? 0)}</strong>
          <i aria-hidden="true">+</i>
        </div>
        <div className="despesas-card">
          <span>Despesas</span>
          <strong>{moeda.format(totais?.totalGeralDespesas ?? 0)}</strong>
          <i aria-hidden="true">-</i>
        </div>
        <div className="saldo-card">
          <span>Saldo</span>
          <strong>{moeda.format(totais?.saldoGeral ?? 0)}</strong>
          <i aria-hidden="true">=</i>
        </div>
      </section>

      {!apiDisponivel && (
        <p className="aviso">
          O back-end não está respondendo. Inicie a API para cadastrar pessoas, transações e atualizar os totais.
        </p>
      )}

      {mensagem && <p className="aviso">{mensagem}</p>}

      <section className="grade">
        <form className="painel formulario-pessoa" onSubmit={salvarPessoa}>
          <div className="cabecalho-painel">
            <span>Cadastro</span>
            <h2>{pessoaEditando ? "Editar pessoa" : "Nova pessoa"}</h2>
          </div>
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
              <button type="button" className="secundario" onClick={limparFormularioPessoa}>
                Cancelar
              </button>
            )}
          </div>
        </form>

        <form className="painel formulario-transacao" onSubmit={cadastrarTransacao}>
          <div className="cabecalho-painel">
            <span>Movimentação</span>
            <h2>Nova transação</h2>
          </div>
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
            Descrição
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
          <div className="cabecalho-painel">
            <span>Moradores</span>
            <h2>Pessoas</h2>
          </div>
          <div className="lista">
            {pessoas.length === 0 && <p className="vazio">Nenhuma pessoa cadastrada.</p>}

            {pessoas.map((pessoa) => (
              <article key={pessoa.id} className="item">
                <div>
                  <strong>{pessoa.nome}</strong>
                  <span>{pessoa.idade} anos</span>
                </div>
                <div className="acoes acoes-lista">
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
          <div className="cabecalho-painel">
            <span>Lançamentos</span>
            <h2>Transações</h2>
          </div>
          <div className="lista">
            {transacoes.length === 0 && <p className="vazio">Nenhuma transação registrada.</p>}

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
        <div className="cabecalho-painel">
          <span>Consolidado</span>
          <h2>Totais por pessoa</h2>
        </div>
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
          {totais?.pessoas.length === 0 && <p className="vazio">Nenhum total disponível.</p>}
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
