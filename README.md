# Gramáticas regulares — TD1

Trabalho de Desenvolvimento 1 (TD1) de **Linguagens Formais e Autômatos**, do curso de Ciência da Computação da UNESC. Professor: André Faria Ruaro.

O programa recebe uma gramática regular, gera sentenças aleatórias com uma pilha e apresenta a derivação de cada sentença e uma expressão regular da linguagem.

## 1. O que o trabalho pede

Conforme o enunciado *Linguagens Formais — Aula 6 — TD01*, o programa deve receber `G = (N, T, P, S)`, em que `N` é o conjunto de não terminais, `T` é o conjunto de terminais, `P` é o conjunto de produções e `S` é o símbolo inicial.

A solução deve considerar apenas gramáticas regulares, sortear produções para gerar sentenças, implementar a derivação com uma **pilha**, oferecer uma interface gráfica de entrada e resultados e retornar a expressão regular após a derivação. A entrega inclui o código-fonte e **três exemplos selecionáveis no próprio programa**.

## 2. Como executar

1. Extraia a pasta completa do projeto, caso esteja em um ZIP.
2. Abra **`index.html`** em um navegador atualizado.
3. Escolha um exemplo ou preencha a gramática e clique em **Gerar e analisar**.
4. Selecione uma sentença e use **Anterior**, **Próximo**, a barra de passos ou **Ver fim** para acompanhar a pilha e a saída.
5. Expanda **Histórico completo da pilha** e **Como a expressão foi obtida** para consultar os registros dos algoritmos.

O programa funciona localmente, sem internet, instalação ou bibliotecas externas. Os dados ficam na memória da aba; recarregar a página restaura o exemplo inicial.

## 3. Como foi resolvido

A implementação utiliza **HTML**, **CSS** e **JavaScript**. O núcleo de cálculo é independente da interface, permitindo testar os algoritmos diretamente.

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | Campos de `N`, `T`, `P` e `S`, exemplos e áreas de resultados. |
| `src/grammar.js` | Validação, geração com pilha e conversão para expressão regular. |
| `src/app.js` | Leitura dos campos, apresentação e navegação pelos passos. |
| `src/style.css` | Aparência e adaptação a diferentes tamanhos de tela. |
| `tests/` | Testes automatizados do núcleo e do servidor opcional. |
| `serve.js` | Servidor local opcional para desenvolvimento. |

### Validação

A função `parseGrammar` verifica se `N` e `T` são disjuntos, se `S` pertence a `N` e se todos os símbolos das produções foram declarados. Cada alternativa pode conter, no máximo, um não terminal, sempre em uma extremidade.

São aceitas regras lineares à direita, como `A → wB`, ou à esquerda, como `A → Bw`, além de `A → w`. Aqui, `w` é uma sequência de terminais, que pode ser vazia. A mesma gramática não pode misturar as duas orientações. Uma regra como `S → aSb` é rejeitada.

### Derivação com pilha

A função `generate` utiliza um array como pilha, com operações explícitas `push` e `pop`:

1. Empilha o símbolo inicial.
2. Retira o topo. Se for terminal, acrescenta-o à saída.
3. Se for não terminal, sorteia uma produção e empilha seu lado direito **em ordem inversa**, deixando o símbolo mais à esquerda no topo.
4. Repete até esvaziar a pilha. Para uma produção `ε`, nada é empilhado.

Cada operação registra uma cópia da pilha e da saída. Após cada substituição, a forma sentencial é a saída já produzida seguida dos símbolos pendentes, do topo à base. Esses registros permitem acompanhar a execução na interface.

Para garantir o término, `parseGrammar` calcula o menor número de substituições necessário para cada não terminal alcançar uma palavra terminal, atualizando os valores até estabilizarem. O sorteio considera apenas produções capazes de terminar dentro do limite restante. Ramos improdutivos são descartados, e a interface avisa quando o limite restringe as escolhas. As produções elegíveis têm a mesma chance; isso **não significa distribuição uniforme entre todas as palavras**. Repetições são permitidas.

### Conversão para expressão regular

A função `toRegex` transforma a gramática em um autômato generalizado, cujas transições são rotuladas por expressões regulares. Na orientação à direita, `A → wB` cria uma transição de `A` para `B`, e `A → w` leva ao estado final. Na orientação à esquerda, `A → Bw` cria uma transição de `B` para `A`, e `A → w` parte da entrada para `A`; o símbolo inicial da gramática leva ao estado final.

Cada estado não terminal `k` é eliminado pela atualização:

```text
R(i,j) ← R(i,j) | R(i,k)(R(k,k))*R(k,j)
```

A atualização conserva os caminhos existentes e acrescenta aqueles que passam por `k`. A expressão restante entre a entrada e a saída descreve a **linguagem completa**, independentemente das sentenças sorteadas. A interface apresenta as equações e as transições após cada eliminação. A conversão foi implementada sem bibliotecas externas.

## 4. Exemplos e resultados

Os três exemplos estão disponíveis no seletor. As expressões abaixo são as retornadas pelo programa. As palavras da tabela ilustram cada linguagem; a amostra sorteada varia a cada execução.

| Exemplo | Conjuntos e produções | Expressão obtida | Palavras da linguagem | Palavras fora da linguagem |
|---|---|---|---|---|
| **1. Exemplo do enunciado** | `N = {S}`, `T = {a,b}`<br>`S ::= aS \| ab` | `a*ab` | `ab`, `aab`, `aaab` | `ε`, `b`, `aba` |
| **2. Binárias terminadas em 01** | `N = {S,A}`, `T = {0,1}`<br>`S ::= 0S \| 1S \| 0A`<br>`A ::= 1` | `(0\|1)*01` | `01`, `001`, `101` | `ε`, `0`, `10` |
| **3. Quantidade par de a** | `N = {S,A}`, `T = {a,b}`<br>`S ::= bS \| aA \| ε`<br>`A ::= bA \| aS` | `(b\|ab*a)*` | `ε`, `b`, `aa`, `abba` | `a`, `ab`, `aaa` |

Em todos os exemplos, o símbolo inicial é `S`. No terceiro, cada bloco é um `b` isolado ou um par de `a` com zero ou mais `b` entre eles; por isso, a quantidade de `a` é sempre par.

No primeiro exemplo, escolher as produções **1, 1 e 2** reproduz o resultado do enunciado:

```text
Produções:  1. S → aS     2. S → ab
Derivação:  S ⇒ aS ⇒ aaS ⇒ aaab
Sentença:   aaab
Expressão:  a*ab
```

`|` representa união, a justaposição representa concatenação e `*` representa zero ou mais repetições. **`ε` é a palavra vazia; `∅` é a linguagem sem nenhuma palavra.** Expressões diferentes podem ser equivalentes; a eliminação de estados não garante a expressão mais curta.

### Verificação

A suíte contém **24 testes, todos aprovados na validação desta versão**.

Com **Node.js 18 ou superior**, execute na pasta do projeto:

```sh
npm test
```

Os testes verificam a pilha, o exemplo do enunciado, as definições das três linguagens, gramáticas à esquerda, palavra e linguagem vazias, ciclos, limites, entradas inválidas e Unicode. A expressão obtida é comparada com uma enumeração independente de derivações: até sete símbolos para os três exemplos e até quatro símbolos para 60 gramáticas pequenas geradas com uma semente fixa. Essas verificações têm alcance finito; a preservação da linguagem decorre da transformação descrita acima.

Não é necessário executar `npm install`. Para usar o servidor opcional, execute `npm start` e acesse `http://127.0.0.1:4173`. Node.js é necessário apenas para os testes e o servidor; abrir `index.html` não depende dele.

## 5. Entrada e limites

- Use um caractere Unicode por símbolo. Separe `N` e `T` por vírgulas ou espaços; chaves são opcionais.
- Escreva uma produção por linha, com `::=`, `->` ou `→`, e alternativas separadas por `|`. Use `ε` sozinho para a palavra vazia. Espaços são apenas formatação.
- `ε`, `∅`, `|`, `:`, `=`, `>`, `→` e chaves são reservados. Na expressão regular, uma barra invertida indica um metacaractere tratado como terminal literal.
- Limites: 12 não terminais, 32 terminais, 100 alternativas, 40 símbolos por alternativa, 30 sentenças por execução, 500 substituições e 2.000 registros de pilha por sentença.
- A conversão admite até 50 mil caracteres de notação e 100 mil na representação JavaScript. Limites excedidos são informados; uma sentença incompleta nunca é apresentada como resultado.

Os limites protegem a interface. Se o símbolo inicial não puder gerar uma palavra terminal, a linguagem é `∅` e nenhuma sentença será gerada. Não terminais improdutivos ou inalcançáveis são indicados nos avisos.

