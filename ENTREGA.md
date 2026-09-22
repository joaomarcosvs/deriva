# Roteiro de apresentação

O projeto inclui o código-fonte e três gramáticas selecionáveis, conforme o enunciado. As explicações da implementação e dos resultados estão no **README.md**.

## Demonstração sugerida

1. Abra `index.html` e escolha **Exemplo do slide**. Apresente os campos `N`, `T`, `P` e `S`.
2. Clique em **Gerar e analisar**. As sentenças contêm uma ou mais letras `a`, seguidas de `b`.
3. Selecione uma sentença e avance pelos passos. Mostre que a produção é empilhada em ordem inversa, que terminais vão para a saída e que não terminais provocam novas substituições.
4. Clique em **Ver fim**: a pilha estará vazia e a saída será a sentença selecionada.
5. Mostre a expressão `a*ab` e expanda as etapas da conversão. Explique que ela representa toda a linguagem, independentemente da amostra sorteada.
6. Execute **Binárias terminadas em 01** e **Quantidade par de a**. No terceiro exemplo, explique que `ε` é uma palavra válida de comprimento zero.
7. Para demonstrar a validação, escolha o primeiro exemplo, altere a produção para `S ::= aSb | ab` e tente gerar. O programa rejeita o não terminal no meio da alternativa.
8. Se houver Node.js disponível, execute `npm test` para mostrar a verificação automatizada.

## Pontos para explicar

- A inversão da produção faz o símbolo mais à esquerda sair primeiro da pilha.
- Um terminal vai para a saída; um não terminal é substituído por uma produção.
- O limite e a análise de produtividade garantem o término da geração.
- `ε` é a palavra vazia; `∅` é a linguagem sem palavras.
- A eliminação de estados preserva a linguagem ao reunir os caminhos que passam pelo estado removido.

## Envio

Extraia o ZIP e confira a abertura de `index.html` antes de enviar a pasta completa pelo canal indicado na disciplina. Inclua nome, matrícula e turma conforme a orientação do professor; esses dados não foram informados neste projeto.
