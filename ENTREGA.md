# Preparação da entrega

## O que o professor pediu no slide

Na página 7 do arquivo **Linguagens Formais - Aula 6 - TD01.pdf**:

- Código-fonte do programa.
- Três exemplos de gramáticas usados na geração de sentenças, disponíveis para seleção dentro do software.

O material não informa prazo, plataforma de entrega ou extensão do pacote. Confirme essas informações no ambiente da disciplina. O ZIP preparado é uma conveniência para transporte; não é um formato exigido pelo slide.

## O que enviar

Envie a pasta completa `td1-gramaticas-regulares`, ou seu ZIP, conforme o canal indicado pelo professor. Ela inclui código-fonte, três exemplos integrados, instruções e testes. Não é necessário incluir `node_modules` nem instalar dependências.

Antes de enviar:

- Abra o ZIP extraído em outra pasta e execute `index.html`.
- Confira os três exemplos pelo seletor.
- Revise o código para conseguir explicar a pilha, o sorteio e a conversão para ER.
- Acrescente seu nome, matrícula e turma no local solicitado pelo professor; esses dados não foram fornecidos e não são inventados pelo projeto.

## Roteiro sugerido para demonstrar

1. Abra `index.html`, escolha **Exemplo do slide** e mostre `N`, `T`, `P` e `S`.
2. Clique em **Gerar e analisar**. As palavras devem conter um ou mais `a` e terminar com `b`.
3. Selecione uma palavra. Avance pela pilha: a produção é empilhada com seu símbolo esquerdo no topo; terminais saem para a saída; não terminais provocam novo sorteio.
4. Use **Ver fim**: a pilha estará vazia e a saída será a sentença selecionada.
5. Mostre a sequência de derivação e a expressão **a*ab**. Abra as etapas da conversão.
6. Teste as gramáticas **Binárias terminadas em 01** e **Quantidade par de a**. Explique que ε é uma palavra válida de comprimento zero no terceiro exemplo.
7. Demonstre a validação: mude a regra para `S ::= aSb | ab` e tente gerar. A interface rejeitará o não terminal no meio.
8. Como teste extra, use `S ::= Sa | b`, com `N = S` e `T = a,b`: a gramática é linear à esquerda, com expressão **ba***.
9. Se houver Node.js disponível, execute `npm test` no terminal para mostrar a validação automatizada.

## Perguntas que você deve saber responder

- Por que empilhar a produção em ordem inversa?
- Qual é a diferença entre um terminal e um não terminal durante a execução?
- Como evitar que `S ::= aS` execute para sempre?
- Qual a diferença entre ε e ∅?
- Por que a ER deve representar a gramática inteira, e não só as palavras sorteadas?
- Por que duas expressões de aparência diferente podem representar a mesma linguagem?

As respostas e a descrição dos algoritmos estão em `README.md` e nos comentários de `src/grammar.js`.
