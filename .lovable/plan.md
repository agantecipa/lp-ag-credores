
Plano corrigido para atacar a causa real da faixa azul:

1. Diagnóstico confirmado
- Não existe um “elemento Unknown” real no código.
- A faixa azul atual vem da section `.how`, não da `.hero`.
- Hoje, em `src/pages/Index.tsx`, a hero está sendo escondida no mobile com `hideHeroOnMobile` + classe `hero-mobile-hidden`.
- Quando a hero some, a `.how` sobe para o topo; como ela tem fundo azul e `padding-top` no mobile, ela vira exatamente essa faixa azul que você está vendo.

2. O que vou fazer
- Remover o hack temporário que esconde a hero no mobile.
- Voltar a `.hero` a ser a primeira section visível da página no mobile.
- Limpar a lógica especial de scroll/nav criada só para esse teste.
- Blindar a `.how` no mobile para que ela não crie uma banda azul isolada se voltar a encostar no topo em algum teste futuro.

3. Alterações previstas
- `src/pages/Index.tsx`
  - remover `hideHeroOnMobile`
  - remover o `matchMedia` criado para esconder a hero
  - remover a classe `hero-mobile-hidden`
  - simplificar o `handleScroll` para depender só da hero real
- `src/index.css`
  - remover `section.hero.hero-mobile-hidden { display: none; }`
  - manter a hero mobile como primeiro bloco real do viewport
  - revisar o topo da `.how` no mobile (`padding` e início do gradiente) para não parecer faixa solta

4. Resultado esperado
- A faixa azul “unknown” some do topo.
- O início da página mobile volta a ser controlado pela `.hero`, que é a primeira section correta.
- A `.how` deixa de parecer um bloco perdido no começo da página.

Detalhes técnicos
- A correção agora não é “subir crop” nem “mexer na imagem”.
- O defeito atual é estrutural: a primeira section está sendo escondida, então a segunda (`.how`) está ocupando o topo.
- Vou desfazer esse experimento temporário e estabilizar a ordem visual mobile: `.hero` primeiro, `.how` depois.
- Depois disso, se ainda existir ajuste visual fino, aí sim faz sentido refinar crop/altura da hero.
