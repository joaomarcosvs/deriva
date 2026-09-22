const test = require('node:test');
const assert = require('node:assert/strict');
const { parseGrammar, generate, toRegex, examples } = require('../src/grammar.js');
const parse = (P, N = 'S', T = 'a,b', S = 'S') => parseGrammar({ N, T, S, P });

// Oráculo independente: busca por formas sentenciais, sem usar pilha ou GNFA.
function enumerate(grammar, maxLength) {
  const queue = [grammar.S], seen = new Set(queue), words = new Set();
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const word = queue[cursor], chars = [...word];
    const index = chars.findIndex(s => grammar.N.includes(s));
    if (index === -1) { words.add(word); continue; }
    for (const p of grammar.productions.filter(p => p.lhs === chars[index])) {
      const next = [...chars.slice(0, index), ...p.rhs, ...chars.slice(index + 1)];
      if (next.filter(s => grammar.T.includes(s)).length > maxLength) continue;
      const form = next.join('');
      if (!seen.has(form)) { seen.add(form); queue.push(form); }
    }
    assert.ok(queue.length < 100000, 'Limite do oráculo');
  }
  return words;
}
function allWords(alphabet, length) {
  let level = ['']; const words = [''];
  for (let i = 0; i < length; i++) { level = level.flatMap(w => alphabet.map(s => w + s)); words.push(...level); }
  return words;
}
function compareLanguage(grammar, length = 5) {
  const expected = enumerate(grammar, length);
  const regex = new RegExp(`^(?:${toRegex(grammar).javascript})$`, 'u');
  for (const word of allWords(grammar.T, length)) assert.equal(regex.test(word), expected.has(word), `Palavra ${JSON.stringify(word)}`);
}
function seeded(seed = 7) { return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296); }

test('reproduz o slide: S ⇒ aS ⇒ aaS ⇒ aaab, com topo à esquerda', () => {
  const grammar = parseGrammar(examples[0]); const values = [0, 0, .99];
  const result = generate(grammar, { random: () => values.shift() });
  assert.equal(result.sentence, 'aaab');
  assert.deepEqual(result.trace[1].stack, ['a', 'S']);
  assert.deepEqual(result.derivations.map(d => d.form), ['aS', 'aaS', 'aaab']);
  assert.deepEqual(result.trace.at(-1).stack, []);
  assert.equal(result.trace.at(-1).output, 'aaab');
  assert.equal(toRegex(grammar).expression, 'a*ab');
});
for (const example of examples) {
  test(`linguagem e sorteio: ${example.name}`, () => {
    const grammar = parseGrammar(example); compareLanguage(grammar, 7);
    const regex = new RegExp(`^(?:${toRegex(grammar).javascript})$`, 'u');
    const random = seeded(); const unique = new Set();
    for (let i = 0; i < 150; i++) {
      const result = generate(grammar, { random, maxDerivations: 25 }); unique.add(result.sentence);
      assert.ok(regex.test(result.sentence)); assert.equal(result.trace.at(-1).stack.length, 0);
      assert.ok(result.derivations.length <= 25);
    }
    assert.ok(unique.size > 1);
  });
}

// Estas definições não consultam produções: verificam a linguagem prometida
// na descrição de cada exemplo, além da equivalência entre gramática e ER.
const exampleLanguages = [
  word => word.length >= 2 && word.endsWith('b') && [...word.slice(0, -1)].every(s => s === 'a'),
  word => word.endsWith('01'),
  word => [...word].filter(s => s === 'a').length % 2 === 0
];
examples.forEach((example, index) => {
  test(`a gramática e a ER representam a definição: ${example.name}`, () => {
    const grammar = parseGrammar(example);
    const derived = enumerate(grammar, 7);
    const regex = new RegExp(`^(?:${toRegex(grammar).javascript})$`, 'u');
    for (const word of allWords(grammar.T, 7)) {
      const expected = exampleLanguages[index](word);
      assert.equal(derived.has(word), expected, `Gramática: ${JSON.stringify(word)}`);
      assert.equal(regex.test(word), expected, `Expressão regular: ${JSON.stringify(word)}`);
    }
  });
});
test('gramáticas à esquerda, com múltiplos terminais e ciclos', () => {
  const grammar = parse('S ::= Sa | Ab | ε\nA ::= Sb | ab', 'S,A');
  assert.equal(grammar.direction, 'left'); compareLanguage(grammar, 7);
  const regex = new RegExp(`^(?:${toRegex(grammar).javascript})$`, 'u');
  for (let i = 0; i < 30; i++) assert.ok(regex.test(generate(grammar, { random: seeded(i) }).sentence));
  assert.equal(toRegex(parse('S ::= Sa | b')).expression, 'ba*');
});

test('a pilha preserva os sufixos pendentes em derivações à esquerda', () => {
  const grammar = parse('S ::= Aab\nA ::= Ba\nB ::= b', 'S,A,B');
  const result = generate(grammar, { random: () => 0 });
  assert.equal(result.sentence, 'baab');
  assert.deepEqual(result.derivations.map(d => d.form), ['Aab', 'Baab', 'baab']);
  assert.deepEqual(result.trace.slice(1, 4).map(s => s.stack), [
    ['A', 'a', 'b'], ['B', 'a', 'a', 'b'], ['b', 'a', 'a', 'b']
  ]);
  assert.ok(result.trace.slice(0, 4).every(s => s.output === ''));
  assert.deepEqual(result.trace.at(-1).stack, []);
  assert.equal(toRegex(grammar).expression, 'baab');
});
test('palavra vazia é diferente de linguagem vazia', () => {
  const epsilon = parse('S ::= ε', 'S', '');
  assert.equal(generate(epsilon).sentence, ''); assert.equal(toRegex(epsilon).expression, 'ε');
  const empty = parse('S ::= aS');
  assert.equal(toRegex(empty).expression, '∅');
  assert.throws(() => generate(empty), /linguagem é vazia/); compareLanguage(empty);
});
test('produções unitárias e ciclos com ε', () => {
  const grammar = parse('S ::= A | ε\nA ::= S | aA | b', 'S,A');
  compareLanguage(grammar, 6);
  assert.ok(generate(grammar, { random: () => 0, maxDerivations: 10 }).derivations.length <= 10);
});
test('exclui ramos improdutivos e avisa sobre símbolos inalcançáveis', () => {
  const grammar = parse('S ::= A | b\nA ::= aA\nZ ::= a', 'S,A,Z');
  assert.equal(generate(grammar, { random: () => 0 }).sentence, 'b');
  assert.equal(grammar.warnings.length, 2); compareLanguage(grammar);
});
test('limite força término mesmo quando o sorteio sempre escolhe a recursão', () => {
  const result = generate(parse('S ::= aS | b'), { random: () => 0, maxDerivations: 5 });
  assert.equal(result.sentence, 'aaaab'); assert.equal(result.constrained, true);
  assert.throws(() => generate(parse('S ::= A\nA ::= b', 'S,A'), { maxDerivations: 1 }), /derivação mínima/);
});

test('o limite de derivações aceita os extremos e rejeita valores inválidos', () => {
  const grammar = parse('S ::= a');
  for (const maxDerivations of [1, 500]) {
    assert.equal(generate(grammar, { maxDerivations }).sentence, 'a');
  }
  for (const maxDerivations of [0, -1, 501, 1.5, NaN, Infinity, -Infinity, '80', null]) {
    assert.throws(() => generate(grammar, { maxDerivations }), /inteiro entre 1 e 500/);
  }
});

test('a fonte aleatória respeita o intervalo de zero inclusive a um exclusive', () => {
  const grammar = parse('S ::= a | b');
  assert.equal(generate(grammar, { random: () => 0 }).sentence, 'a');
  assert.equal(generate(grammar, { random: () => 1 - Number.EPSILON }).sentence, 'b');
  for (const value of [-Number.EPSILON, 1, 1.1, NaN, Infinity, -Infinity, undefined]) {
    assert.throws(() => generate(grammar, { random: () => value }), /fonte aleatória/);
  }
});
test('limita o tamanho do histórico sem retornar uma sentença incompleta', () => {
  assert.throws(() => generate(parse(`S ::= ${'a'.repeat(39)}S | b`), { random: () => 0, maxDerivations: 500 }), /2.000 operações/);
  assert.throws(() => parse('S ::= →', 'S', '→'), /reservados/);
});
test('símbolos especiais de regex e Unicode são literais', () => {
  for (const symbol of ['.', '*', '+', '?', '(', ')', '[', ']', '\\', '^', '$', '😀']) {
    const grammar = parse(`S ::= ${symbol}S | ε`, 'S', symbol);
    compareLanguage(grammar, 3);
    const regex = new RegExp(`^(?:${toRegex(grammar).javascript})$`, 'u');
    assert.equal(regex.test('a'), false);
  }
});

test('Unicode fora do plano básico funciona em terminais e não terminais', () => {
  const grammar = parse('🧭 ::= 😀🧩 | ε\n🧩 ::= β🧭', '🧭,🧩', '😀,β', '🧭');
  const values = [0, 0, .99];
  const result = generate(grammar, { random: () => values.shift() });
  assert.equal(result.sentence, '😀β');
  assert.deepEqual(result.trace[1].stack, ['😀', '🧩']);
  assert.deepEqual(result.derivations.map(d => d.form), ['😀🧩', '😀β🧭', '😀β']);
  assert.deepEqual(result.trace.at(-1).stack, []);
  compareLanguage(grammar, 5);
});
test('validação rejeita entradas que não definem a gramática regular suportada', () => {
  const invalid = [
    () => parse('S ::= aSb'), () => parse('S ::= SS | a'),
    () => parse('S ::= aS | Sb | ε'), () => parse('S ::= z'),
    () => parse('S ::= a |'), () => parse('S ::= εa'),
    () => parse('S ::= a', 'S,a'), () => parse('S ::= a', 'S', 'a', 'A'),
    () => parse('S ::= a', 'S,S'), () => parse('S ::= a', 'Start'),
    () => parse('aS ::= a'), () => parse(''), () => parse('S = a')
  ];
  for (const operation of invalid) assert.throws(operation);
});
test('deduplica produções, aceita separadores e não terminal sem produção', () => {
  const grammar = parseGrammar({ N: '{S, A}', T: '{a,b}', S: 'S', P: 'S -> a | a | A' });
  assert.equal(grammar.productions.length, 2); compareLanguage(grammar);
  assert.equal(generate(grammar, { random: () => .99 }).sentence, 'a');
});
test('verifica 60 gramáticas aleatórias pequenas com um oráculo independente', () => {
  const random = seeded(321);
  for (const direction of ['left', 'right']) for (let sample = 0; sample < 30; sample++) {
    const rules = ['S', 'A', 'B'].map(lhs => {
      const choices = ['ε', 'a', 'b', 'S', 'A', 'B'];
      for (const nt of ['S', 'A', 'B']) for (const t of ['a', 'b', 'ab']) choices.push(direction === 'left' ? nt + t : t + nt);
      return `${lhs} ::= ${Array.from({ length: 3 }, () => choices[Math.floor(random() * choices.length)]).join(' | ')}`;
    });
    compareLanguage(parse(rules.join('\n'), 'S,A,B'), 4);
  }
});
