# Deriva — TD1 de Linguagens Formais e Autômatos

Programa com interface gráfica para cadastrar uma gramática regular `G = {N, T, P, S}`, gerar sentenças aleatórias usando uma **pilha explícita**, acompanhar a derivação e obter uma expressão regular da linguagem inteira.

## Executar

1. Abra a pasta do projeto.
2. Dê dois cliques em **index.html**. Use um navegador atualizado, como Edge, Chrome ou Firefox.
3. Selecione uma das três gramáticas e clique em **Gerar e analisar**.
4. Clique em uma sentença e use **Próximo**, **Anterior**, a barra de passos ou **Ver fim**.
5. Expanda o histórico da pilha e os passos da conversão para examinar o algoritmo.

O programa funciona sem internet, bibliotecas externas, instalação ou servidor. Os dados ficam apenas na memória da aba; recarregar restaura o exemplo inicial.

## Desenvolver no VS Code

Abra esta pasta com **Arquivo → Abrir Pasta**. Edite os arquivos e recarregue `index.html` no navegador. A configuração de depuração incluída permite usar **F5 → Abrir programa no Edge**.

Com Node.js 18 ou superior, também é possível usar o terminal do VS Code:

```sh
npm test
npm start
```

O primeiro comando executa os testes; o segundo abre um servidor local em `http://127.0.0.1:4173`. Não é necessário executar `npm install`. Node.js é opcional para usar o programa e necessário apenas para os testes e o servidor.

## Requisitos do slide e implementação

| Pedido | Onde foi atendido |
|---|---|
| Entrada de G = {N, T, P, S} (p. 3) | Campos de não terminais, terminais, produções e símbolo inicial |
| Gerar sentenças aleatórias (p. 3a) | Sorteio de alternativas em `generate`, quantidade configurável |
| Executar o mecanismo de derivação (p. 3b, pp. 4–5) | Histórico de substituições e de operações da pilha |
| Considerar apenas gramáticas regulares (p. 3c) | Validação em `parseGrammar`; orientação à direita ou à esquerda |
| Usar uma pilha (p. 3d) | Array com operações `push` e `pop`; produção empilhada em ordem inversa |
| Interface gráfica de entrada e resultados (p. 3e) | `index.html`, `src/style.css` e `src/app.js` |
| Exemplos no programa (p. 3f) | Três opções no seletor da interface |
| Analisar, transformar e retornar expressão regular (p. 3g, p. 6) | `toRegex`: autômato generalizado e eliminação de estados, com equações e etapas visíveis |
| Entregar código-fonte e três exemplos selecionáveis (p. 7) | Pasta completa do projeto; veja `ENTREGA.md` |

O slide **não especifica** linguagem de programação, framework, prazo, plataforma de envio, nome do arquivo, relatório, vídeo, executável compilado ou trabalho em grupo. HTML, CSS e JavaScript são uma escolha desta implementação. Não se presume exigência adicional que não esteja no material.

## Sintaxe e validação

- Cada símbolo de N e T tem **um caractere Unicode**. Separe os símbolos por vírgulas ou espaços; chaves externas são opcionais. Exemplo: `S, A` e `0, 1`.
- N e T devem ser disjuntos; S deve pertencer a N. T pode ser vazio, por exemplo para `S ::= ε`.
- Informe uma regra por linha. Aceita `::=`, `->` ou `→`. Separe alternativas por `|`.
- Use `ε` sozinho para a palavra vazia. Não deixe alternativas em branco.
- À direita: `A ::= wB | w`. À esquerda: `A ::= Bw | w`. `w` é uma sequência de terminais, inclusive vazia. Assim, produções unitárias `A ::= B` também são aceitas.
- Não misture orientações na mesma gramática. São rejeitadas alternativas com dois não terminais ou um não terminal no meio, como `aSb`.
- Espaços são separadores de formatação, não terminais. Símbolos de sintaxe são reservados; consulte a mensagem de validação.
- Limites de uso: até 12 não terminais, 32 terminais, 100 alternativas, 40 símbolos por alternativa, 30 sentenças por execução e 500 substituições por sentença. Esses limites são escolhas de proteção da interface, não exigências do slide.
- A expressão pode crescer exponencialmente. A conversão avisa se ultrapassar 50 mil caracteres de notação ou 100 mil na representação JavaScript. A geração continua disponível.
- Cada sentença tem um limite adicional de 2.000 operações registradas de pilha para proteger a memória. Se excedido, o programa solicita reduzir o limite de derivações ou o tamanho das produções; não apresenta uma palavra incompleta como resultado.

## Os três exemplos

1. **Exemplo do slide:** `N = {S}`, `T = {a,b}`, inicial `S`, `S ::= aS | ab`. Linguagem de uma ou mais letras `a`, seguidas de `b`. Expressão obtida: `a*ab`. A escolha das produções 1, 1 e 2 produz `S ⇒ aS ⇒ aaS ⇒ aaab`.
2. **Binárias terminadas em 01:** `N = {S,A}`, `T = {0,1}`, inicial `S`, `S ::= 0S | 1S | 0A` e `A ::= 1`. Linguagem descrita por `(0|1)*01`.
3. **Quantidade par de a:** `N = {S,A}`, `T = {a,b}`, inicial `S`, `S ::= bS | aA | ε` e `A ::= bA | aS`. Aceita a palavra vazia e palavras com número par de `a`, com `b` em qualquer posição. Uma expressão equivalente é `b*(ab*ab*)*`.

Expressões regulares equivalentes podem ter textos diferentes. A eliminação de estados não promete a menor expressão possível. A notação exibida usa `|` para união (o slide também usa `+` nas equações), concatenação por justaposição, `*` para fecho de Kleene, `ε` para palavra vazia e `∅` para linguagem vazia. Uma barra invertida antes de um metacaractere indica um terminal literal.

## Como o algoritmo funciona

### Derivação com pilha

1. Coloque S na pilha. No array, o último elemento é o topo; na interface, o topo aparece primeiro.
2. Retire o topo com `pop`.
3. Se for terminal, acrescente-o à saída.
4. Se for não terminal, sorteie uma produção aplicável. Empilhe seu lado direito **de trás para frente**, usando `push`, para que o símbolo mais à esquerda fique no topo.
5. Repita até esvaziar a pilha. Em uma produção ε, nada é empilhado.

A forma sentencial em cada substituição é a saída já consumida seguida pela pilha do topo à base. O registro preserva cópias da pilha para mostrar o histórico corretamente. Não se usa recursão da linguagem de programação para substituir a pilha exigida.

Antes do sorteio, um cálculo por ponto fixo encontra o menor número de substituições de cada não terminal até uma palavra terminal. Ramos improdutivos são excluídos. A escolha é uniforme entre as alternativas que conseguem terminar dentro do orçamento restante. Perto do limite, isso pode restringir o sorteio, e a interface informa quando ocorreu. **Não há promessa de distribuição uniforme sobre todas as palavras**, e palavras repetidas são permitidas.

Se S for improdutivo, a linguagem é vazia: o resultado é `∅` e nenhuma sentença é inventada. Símbolos improdutivos e inalcançáveis produzem avisos.

### Gramática para expressão regular

Na orientação à direita, a produção `A → wB` vira a aresta `A → B` rotulada por `w`; `A → w` aponta para um estado final novo. Uma entrada nova aponta para S por ε.

Na orientação à esquerda, `A → Bw` vira a aresta `B → A` rotulada por `w`; `A → w` vira uma aresta da entrada nova para A. S aponta para o estado final novo por ε. Isso preserva a ordem dos terminais da linguagem.

O algoritmo elimina cada não terminal `k`, atualizando as arestas entre estados restantes com:

```text
R(i,j) = R(i,j) | R(i,k) (R(k,k))* R(k,j)
```

A expressão da entrada até a saída final descreve a linguagem completa, independentemente das palavras sorteadas. O slide exemplifica resolução de equações; a implementação usa eliminação de estados, mostra as equações originais e as etapas da transformação. Não existe chamada de biblioteca externa para realizar a conversão.

## Arquivos e testes

- `index.html`: interface e campos de G.
- `src/grammar.js`: exemplos, análise, geração com pilha e conversão para ER.
- `src/app.js`: ligação entre campos, resultados e controles de navegação.
- `src/style.css`: apresentação responsiva.
- `tests/grammar.test.js`: testes com o executor nativo do Node.js.
- `serve.js`: servidor opcional, restrito ao computador local.
- `ENTREGA.md`: checklist e roteiro de demonstração.

Os testes reproduzem o exemplo do slide, verificam a ordem da pilha, gramáticas à esquerda, ε, linguagem vazia, ciclos, símbolos especiais, entradas inválidas e término limitado. Um oráculo independente enumera formas sentenciais e compara as palavras com a ER para os exemplos e 60 gramáticas pequenas geradas deterministicamente. Essa comparação é limitada aos comprimentos descritos nos testes; não substitui a justificativa matemática da transformação.
