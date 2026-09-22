/* Núcleo independente da interface: validação, pilha e conversão para ER. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GrammarLab = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const EPSILON = 'ε';
  const examples = [
    { name: '01 · Exemplo do slide', description: 'Uma ou mais letras a, seguidas de b. Linguagem: a*ab.', N: 'S', T: 'a, b', S: 'S', P: 'S ::= aS | ab' },
    { name: '02 · Binárias terminadas em 01', description: 'Qualquer sequência de 0 e 1 que termine em 01.', N: 'S, A', T: '0, 1', S: 'S', P: 'S ::= 0S | 1S | 0A\nA ::= 1' },
    { name: '03 · Quantidade par de a', description: 'Palavras sobre {a, b} com quantidade par de a, incluindo a palavra vazia.', N: 'S, A', T: 'a, b', S: 'S', P: 'S ::= bS | aA | ε\nA ::= bA | aS' }
  ];
  function symbols(value, label) {
    const result = value.trim().replace(/^\{(.*)\}$/s, '$1').split(/[,\s]+/u).filter(Boolean);
    if (new Set(result).size !== result.length) throw new Error(`${label}: há símbolos repetidos.`);
    if (result.some(s => [...s].length !== 1 || /[ε∅|:=>{}→]/u.test(s))) {
      throw new Error(`${label}: use símbolos de um caractere, separados por vírgulas. ε, ∅, |, :, =, >, → e chaves são reservados.`);
    }
    return result;
  }
  function parseGrammar(input) {
    const N = symbols(input.N, 'N'), T = symbols(input.T, 'T'), S = input.S.trim();
    if (!N.length || N.length > 12 || T.length > 32) throw new Error('Informe de 1 a 12 não terminais e até 32 terminais.');
    if (N.some(n => T.includes(n))) throw new Error('N e T devem ser disjuntos: um símbolo não pode ser terminal e não terminal.');
    if (!N.includes(S)) throw new Error('O símbolo inicial S deve pertencer a N.');
    const productions = [], directions = new Set();
    const lines = input.P.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    for (const [index, line] of lines.entries()) {
      const parts = line.split(/::=|->|→/u);
      if (parts.length !== 2 || !N.includes(parts[0].trim())) throw new Error(`Produção ${index + 1}: use A ::= alternativa | alternativa, com A em N.`);
      const lhs = parts[0].trim();
      for (const alternative of parts[1].split('|')) {
        const raw = alternative.replace(/\s/gu, '');
        if (!raw) throw new Error(`Produção de ${lhs}: alternativa vazia. Escreva ε para a palavra vazia.`);
        const rhs = raw === EPSILON ? [] : [...raw];
        if (rhs.length > 40) throw new Error('Cada alternativa pode ter até 40 símbolos.');
        if (rhs.some(s => !N.includes(s) && !T.includes(s))) throw new Error(`Produção ${lhs} → ${raw}: símbolo não declarado em N ou T.`);
        const positions = rhs.map((s, i) => N.includes(s) ? i : -1).filter(i => i >= 0);
        if (positions.length > 1) throw new Error(`Produção ${lhs} → ${raw}: uma gramática regular admite no máximo um não terminal por alternativa.`);
        if (positions.length && rhs.length > 1) {
          const pos = positions[0];
          if (pos === rhs.length - 1) directions.add('right');
          else if (pos === 0) directions.add('left');
          else throw new Error(`Produção ${lhs} → ${raw}: o não terminal deve estar em uma das extremidades.`);
        }
        if (!productions.some(p => p.lhs === lhs && p.rhs.join('') === rhs.join(''))) productions.push({ id: productions.length + 1, lhs, rhs });
      }
    }
    if (!productions.length) throw new Error('Informe pelo menos uma produção.');
    if (productions.length > 100) throw new Error('Use no máximo 100 alternativas de produção.');
    if (directions.size > 1) throw new Error('Não misture produções lineares à esquerda e à direita na mesma gramática.');
    const byLhs = new Map(N.map(n => [n, productions.filter(p => p.lhs === n)]));
    // Ponto fixo: menor número de substituições para chegar a uma palavra terminal.
    const minSteps = new Map(N.map(n => [n, Infinity]));
    let changed = true;
    while (changed) {
      changed = false;
      for (const p of productions) {
        const child = p.rhs.find(s => N.includes(s));
        const cost = 1 + (child === undefined ? 0 : minSteps.get(child));
        if (cost < minSteps.get(p.lhs)) { minSteps.set(p.lhs, cost); changed = true; }
      }
    }
    const reachable = new Set([S]);
    changed = true;
    while (changed) {
      changed = false;
      for (const p of productions) if (reachable.has(p.lhs)) for (const s of p.rhs) {
        if (N.includes(s) && !reachable.has(s)) { reachable.add(s); changed = true; }
      }
    }
    const warnings = [];
    const dead = N.filter(n => !Number.isFinite(minSteps.get(n)));
    const unused = N.filter(n => !reachable.has(n));
    if (dead.length) warnings.push(`Não terminais sem derivação terminal: ${dead.join(', ')}. Seus ramos não são sorteados.`);
    if (unused.length) warnings.push(`Não terminais inalcançáveis a partir de ${S}: ${unused.join(', ')}.`);
    return { N, T, S, productions, byLhs, minSteps, warnings, direction: directions.has('left') ? 'left' : 'right' };
  }
  function generate(grammar, { random = Math.random, maxDerivations = 80 } = {}) {
    if (!Number.isInteger(maxDerivations) || maxDerivations < 1 || maxDerivations > 500) throw new Error('O limite de derivações deve ser inteiro entre 1 e 500.');
    if (!Number.isFinite(grammar.minSteps.get(grammar.S))) throw new Error('A linguagem é vazia: o símbolo inicial não pode gerar uma sentença terminal.');
    if (grammar.minSteps.get(grammar.S) > maxDerivations) throw new Error('O limite é menor que a derivação mínima. Aumente o limite.');
    // Fim do array = topo. A produção é empilhada em ordem inversa.
    const stack = [grammar.S], trace = [], derivations = [];
    let output = '', count = 0, constrained = false;
    const record = (action, production = '') => {
      if (trace.length >= 2000) throw new Error('O histórico excedeu 2.000 operações por sentença. Reduza o limite de derivações ou o tamanho das produções.');
      trace.push({ step: trace.length, action, production, stack: [...stack].reverse(), output });
    };
    record(`Empilhar símbolo inicial ${grammar.S}`);
    while (stack.length) {
      const symbol = stack.pop();
      if (grammar.T.includes(symbol)) {
        output += symbol;
        record(`Desempilhar terminal ${symbol} e acrescentar à saída`);
      } else {
        const cost = p => 1 + p.rhs.reduce((sum, s) => sum + (grammar.N.includes(s) ? grammar.minSteps.get(s) : 0), 0);
        const productive = grammar.byLhs.get(symbol).filter(p => Number.isFinite(cost(p)));
        const choices = productive.filter(p => cost(p) <= maxDerivations - count);
        constrained ||= choices.length < productive.length;
        const value = random();
        if (!(value >= 0 && value < 1)) throw new Error('A fonte aleatória deve retornar um valor entre 0 (inclusive) e 1 (exclusive).');
        const selected = choices[Math.floor(value * choices.length)];
        for (let i = selected.rhs.length - 1; i >= 0; i--) stack.push(selected.rhs[i]);
        count++;
        const production = `${selected.id}. ${symbol} → ${selected.rhs.join('') || EPSILON}`;
        record(`Desempilhar ${symbol}; aplicar produção ${selected.id}`, production);
        derivations.push({ production, form: output + [...stack].reverse().join('') });
      }
    }
    return { sentence: output, trace, derivations, constrained };
  }
  // Álgebra de expressões: null representa ∅; string vazia representa ε.
  const EMPTY = null, ONE = { kind: 'epsilon', text: '', js: '', rank: 4 };
  function make(kind, text, js, rank) {
    if (text.length > 50000 || js.length > 100000) throw new Error('A expressão regular ultrapassou o limite de exibição. Reduza a gramática (a eliminação pode gerar expressões muito grandes).');
    return { kind, text, js, rank };
  }
  function literal(s) { return make('literal', /[()*+?.[\]\\^$]/u.test(s) ? `\\${s}` : s, s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 4); }
  const wrap = (x, rank, js = false) => x.rank < rank ? (js ? `(?:${x.js})` : `(${x.text || EPSILON})`) : (js ? x.js : x.text);
  function union(a, b) {
    if (a === EMPTY) return b;
    if (b === EMPTY || a.js === b.js) return a;
    return make('union', `${a.text || EPSILON}|${b.text || EPSILON}`, `${a.js}|${b.js}`, 1);
  }
  function concat(...items) {
    if (items.includes(EMPTY)) return EMPTY;
    const terms = items.filter(x => x.kind !== 'epsilon');
    if (!terms.length) return ONE;
    if (terms.length === 1) return terms[0];
    return make('concat', terms.map(x => wrap(x, 2)).join(''), terms.map(x => wrap(x, 2, true)).join(''), 2);
  }
  function star(a) {
    if (a === EMPTY || a.kind === 'epsilon') return ONE;
    if (a.kind === 'star') return a;
    return make('star', `${wrap(a, 3)}*`, `${wrap(a, 3, true)}*`, 3);
  }
  function toRegex(grammar) {
    // GNFA: estado de entrada e de aceitação exclusivos, sem colisão com N.
    const start = '@entrada', end = '@final', edges = new Map();
    const key = (a, b) => JSON.stringify([a, b]);
    const get = (a, b) => edges.get(key(a, b)) ?? EMPTY;
    const put = (a, b, value) => edges.set(key(a, b), value);
    const add = (a, b, value) => put(a, b, union(get(a, b), value));
    if (grammar.direction === 'right') add(start, grammar.S, ONE);
    else add(grammar.S, end, ONE);
    for (const p of grammar.productions) {
      const nt = p.rhs.find(s => grammar.N.includes(s));
      const terminals = p.rhs.filter(s => grammar.T.includes(s));
      const label = concat(...terminals.map(literal));
      if (grammar.direction === 'right') add(p.lhs, nt === undefined ? end : nt, label);
      else add(nt === undefined ? start : nt, p.lhs, label);
    }
    const transitions = (states) => {
      const list = [];
      for (const a of states) for (const b of states) { const e = get(a, b); if (e !== EMPTY) list.push(`${a} → ${b}: ${e.text || EPSILON}`); }
      return list;
    };
    let states = [start, ...grammar.N, end];
    const steps = [{ title: 'Autômato generalizado inicial', transitions: transitions(states) }];
    // Ordem estável: o símbolo inicial é eliminado por último.
    for (const k of [...grammar.N.filter(n => n !== grammar.S), grammar.S]) {
      const remaining = states.filter(s => s !== k);
      for (const i of remaining) for (const j of remaining) {
        // R_ij := R_ij | R_ik (R_kk)* R_kj
        put(i, j, union(get(i, j), concat(get(i, k), star(get(k, k)), get(k, j))));
      }
      states = remaining;
      steps.push({ title: `Eliminar ${k}`, transitions: transitions(states) });
    }
    const result = get(start, end);
    return { expression: result === EMPTY ? '∅' : result.text || EPSILON, javascript: result === EMPTY ? '(?!)' : result.js, steps,
      equations: grammar.N.map(n => `${n} = ${grammar.byLhs.get(n).map(p => p.rhs.join('') || EPSILON).join(' + ') || '∅'}`) };
  }
  return { EPSILON, examples, parseGrammar, generate, toRegex };
});
