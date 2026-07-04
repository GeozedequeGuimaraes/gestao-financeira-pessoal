async function verificarStatus() {
  const resposta = await fetch("/api/status");

  if (!resposta.ok) {
    return;
  }

  await resposta.json();
}

verificarStatus();

