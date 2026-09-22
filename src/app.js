'use strict';
const $ = id => document.getElementById(id);
const { examples, parseGrammar, generate, toRegex } = GrammarLab;
let results = [], grammar = null, selected = 0, step = 0;
function node(tag, text, className) {
  const item = document.createElement(tag);
  if (text !== undefined) item.textContent = text;
  if (className) item.className = className;
  return item;
}
function setStatus(message, error = false) {
  $('status').textContent = message;
  $('status').classList.toggle('error', error);
  if (error) $('status').focus();
}
function renderWarnings(messages) {
  $('warnings').replaceChildren(...messages.map(message => node('p', message)));
  $('warnings').hidden = messages.length === 0;
}
function clearResults() {
  results = []; grammar = null; selected = 0; step = 0;
  for (const id of ['sentences', 'trace-body', 'regex-steps', 'stack', 'warnings']) $(id).replaceChildren();
  $('warnings').hidden = true;
  $('sentences').append(node('p', 'Gere sentenças para analisar esta gramática.', 'empty'));
  $('stack').append(node('span', '—', 'empty'));
  $('regex').textContent = '—'; $('partial-output').textContent = '—'; $('derivation').textContent = '—';
  $('step-count').textContent = 'PASSO A PASSO'; $('step-action').textContent = 'Gere uma sentença para acompanhar o algoritmo.';
  $('direction').textContent = 'Aguardando análise';
  for (const id of ['previous', 'next', 'last', 'step-range']) $(id).disabled = true;
  $('step-range').value = 0; $('step-range').max = 0;
}
function renderStep() {
  const result = results[selected], current = result.trace[step];
  $('stack').replaceChildren();
  for (const symbol of current.stack) $('stack').append(node('div', symbol, `stack-symbol${grammar.N.includes(symbol) ? ' nonterminal' : ''}`));
  if (!current.stack.length) $('stack').append(node('span', 'Pilha vazia\nExecução concluída', 'empty'));
  $('step-count').textContent = `PASSO ${step + 1} DE ${result.trace.length}`;
  $('step-action').textContent = current.action + (current.production ? ` (${current.production})` : '');
  $('partial-output').textContent = current.output || 'ε';
  $('previous').disabled = step === 0;
  $('next').disabled = $('last').disabled = step === result.trace.length - 1;
  $('step-range').disabled = false; $('step-range').max = result.trace.length - 1; $('step-range').value = step;
}
function selectSentence(index) {
  selected = index; step = 0;
  [...$('sentences').children].forEach((button, i) => { button.classList.toggle('selected', i === index); button.setAttribute('aria-pressed', String(i === index)); });
  const result = results[index];
  $('derivation').textContent = [grammar.S, ...result.derivations.map(d => d.form || 'ε')].join(' ⇒ ');
  const fragment = document.createDocumentFragment();
  for (const item of result.trace) {
    const row = node('tr');
    for (const value of [item.step + 1, item.action + (item.production ? ` (${item.production})` : ''), item.stack.join(' · ') || '[] (vazia)', item.output || 'ε']) row.append(node('td', value));
    fragment.append(row);
  }
  $('trace-body').replaceChildren(fragment);
  renderStep();
}
function loadExample(index) {
  const item = examples[index];
  $('nonterminals').value = item.N; $('terminals').value = item.T;
  $('start').value = item.S; $('productions').value = item.P;
  $('example-description').textContent = item.description;
  clearResults(); setStatus('Exemplo carregado. Clique em Gerar e analisar.');
}
examples.forEach((example, i) => { const option = node('option', example.name); option.value = i; $('example').append(option); });
const custom = node('option', 'Personalizada'); custom.value = 'custom'; custom.disabled = true; $('example').append(custom);
$('example').addEventListener('change', () => loadExample(Number($('example').value)));
function edited() {
  $('example').value = 'custom'; $('example-description').textContent = 'Suas próprias regras. Aceita gramáticas lineares à direita ou à esquerda.';
  clearResults(); setStatus('Gramática alterada. Gere novamente para atualizar a análise.');
}
for (const id of ['nonterminals', 'terminals', 'start', 'productions']) $(id).addEventListener('input', edited);
$('insert-epsilon').addEventListener('click', () => {
  const area = $('productions'); area.setRangeText('ε', area.selectionStart, area.selectionEnd, 'end'); area.focus(); edited();
});
$('previous').addEventListener('click', () => { if (step > 0) { step--; renderStep(); } });
$('next').addEventListener('click', () => { if (results.length && step < results[selected].trace.length - 1) { step++; renderStep(); } });
$('last').addEventListener('click', () => { if (results.length) { step = results[selected].trace.length - 1; renderStep(); } });
$('step-range').addEventListener('input', () => { step = Number($('step-range').value); renderStep(); });
// A validação nativa precisa conseguir focar campos dentro das opções recolhidas.
$('grammar-form').addEventListener('invalid', event => {
  const details = event.target.closest('details');
  if (details) details.open = true;
}, true);
$('grammar-form').addEventListener('submit', event => {
  event.preventDefault(); clearResults();
  try {
    const quantity = Number($('quantity').value), maxDerivations = Number($('limit').value);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 30) throw new Error('Escolha de 1 a 30 sentenças.');
    if (!Number.isInteger(maxDerivations) || maxDerivations < 1 || maxDerivations > 500) throw new Error('O limite de derivações deve ser inteiro entre 1 e 500.');
    grammar = parseGrammar({ N: $('nonterminals').value, T: $('terminals').value, S: $('start').value, P: $('productions').value });
    $('direction').textContent = grammar.direction === 'right' ? 'Linear à direita' : 'Linear à esquerda';
    const warnings = [...grammar.warnings];
    // A conversão é independente da amostra: calcula a linguagem inteira.
    try {
      const regex = toRegex(grammar);
      $('regex').textContent = regex.expression;
      $('regex-steps').append(node('h3', 'Equações da gramática'), node('pre', regex.equations.join('\n')));
      for (const item of regex.steps) $('regex-steps').append(node('h3', item.title), node('pre', item.transitions.join('\n') || 'Nenhuma transição: linguagem vazia.'));
    } catch (error) { $('regex').textContent = 'Conversão não concluída'; warnings.push(error.message); }
    // Mesmo se a geração não couber no limite, a análise e seus avisos continuam válidos.
    renderWarnings(warnings);
    if (Number.isFinite(grammar.minSteps.get(grammar.S))) {
      results = Array.from({ length: quantity }, () => generate(grammar, { maxDerivations }));
      $('sentences').replaceChildren();
      results.forEach((result, i) => {
        const button = node('button', undefined, 'sentence'); button.type = 'button';
        button.append(node('small', String(i + 1).padStart(2, '0')), node('code', result.sentence || 'ε'));
        button.setAttribute('aria-label', `Inspecionar sentença ${i + 1}: ${result.sentence || 'palavra vazia'}`);
        button.addEventListener('click', () => selectSentence(i)); $('sentences').append(button);
      });
      if (results.some(r => r.constrained)) warnings.push('O limite restringiu o sorteio em pelo menos uma sentença para garantir o término.');
      selectSentence(0);
      setStatus(`Gramática válida · ${quantity} ${quantity === 1 ? 'sentença gerada' : 'sentenças geradas'} com pilha.`);
    } else {
      $('sentences').replaceChildren(node('p', 'Linguagem vazia (∅): não existe sentença terminal a partir do símbolo inicial.', 'empty'));
      setStatus('Gramática regular válida, mas sem sentenças para gerar.');
    }
    renderWarnings(warnings);
  } catch (error) {
    $('sentences').replaceChildren(node('p', 'Nenhuma sentença gerada. Verifique a mensagem junto ao formulário.', 'empty'));
    setStatus(error.message, true);
  }
});
loadExample(0);
