# NK Mobile · Battle Royale para celular

Jogo de tiro battle royale em 3D (mapa: Ilha NK) (Three.js), feito para celular deitado. Tudo num arquivo só (`index.html`), roda no navegador.

## Fase 1 (pronta)
- Ilha de ~1,1 km com 6 cidades (Porto Azul, Vila Cores, Centro, Base Militar, Fazenda Sol, Usina) e 26 casas isoladas
- Casas, sobrados, prédios de 3–4 andares com escada e terraço, galpões, containers, árvores, pedras e estradas; cores vivas
- 50 jogadores por partida; bots de nível **médio** e **alto** completam as vagas (ou "misto")
- Modos **Solo, Dupla, Trio e Esquadrão** (colegas bots seguem você, revivem e lutam junto)
- Avião, salto, queda livre e paraquedas
- Armas com nomes reais: pistolas (M9, M1911, G18C), submetralhadoras (UMP45, MP5K, UZI), fuzis (AKM, M416, SCAR-L, M16A4),
  rifles (SKS, Mini 14, Kar98k, M24) e só no drop: AWM, AUG A3, Groza
- **Balística**: a bala tem velocidade e cai com a distância (zerada em 100 m); de longe é preciso mirar acima
- Acessórios: red dot, holográfica, lunetas 2x, 3x, 4x, 6x, 8x e **10x**, compensador, silenciador, empunhadura, pente estendido
- Capacete, colete e mochila (nível 1 a 3); bandagem, kit de primeiros socorros, kit médico, energético e analgésico
- Inclinação para os lados (estilo PUBG), agachar, deitar, pular; 1ª e 3ª pessoa
- Saque no chão e em caixas de jogadores abatidos; **drop de suprimentos** que cai de um avião com fumaça vermelha
- Zona azul que fecha em 7 fases; derrubado/reviver nos modos em equipe
- Lobby com personagens masculinos e femininos, estatísticas e configurações

## Controles
**Celular:** joystick à esquerda (empurre além do círculo para correr), arraste no lado direito para olhar, botões de tiro
(direito e esquerdo, dá para mirar arrastando o próprio botão), mira, pular, agachar, deitar, inclinar ◤ ◥, recarregar, cura ✚,
mochila 🎒, 1P/3P e o mapa (toque no minimapa). Toque nos itens da lista ao lado para pegar.

**Computador (para testar):** WASD, mouse, clique esquerdo atira, direito mira, Shift corre, Espaço pula, C agacha, Z deita,
Q/E inclina, R recarrega, F pega/age, H cura, Tab mochila, M mapa, V 1ª/3ª pessoa, 1/2/3 armas.

## Fase 2 (pronta): veículos
- 30 veículos espalhados pelas estradas: **Jipe** (4 lugares, mais resistente), **Sedã** (4, mais rápido), **Buggy** (2) e **Moto** (2, a mais rápida)
- Joystick acelera, vira e freia/dá ré; botão ENTRAR/SAIR e ⇄ para trocar de assento; passageiros podem atirar
- Velocidade em km/h e vida do veículo na tela; mais lento fora da estrada; pula em morros; afunda o motor na água
- Batidas causam dano no veículo e nos ocupantes; **atropelar** derruba/abate; tiros danificam e o veículo **explode**
- Bots pegam veículos para fugir da zona (a equipe embarca junto) e descem para lutar; seus colegas entram no seu carro

## Visual (atualização)
- Sombras em tempo real ao redor do jogador (Médio e Alto), sombra de contato na base das casas e embaixo das árvores
- Mar com ondas, brilho do sol, reflexo do céu, água rasa turquesa e espuma na praia
- Grama e flores coloridas balançando com o vento perto da câmera
- Textura procedural no terreno e nas paredes (sem imagens: tudo gerado no aparelho)
- Estradas com faixas brancas e tracejado amarelo, postes de luz, molduras nas janelas e batentes nas portas
- Árvores com copa em camadas, nuvens fofas e sol no céu; personagens com rosto, mãos, cinto, tênis e cabelo mais detalhado
- Configuração **Gráficos**: Leve (sem sombra e sem grama), Médio e Alto

## Realismo (atualização)
- **Personagens humanos realistas** (Microsoft Rocketbox, MIT): 10 avatares, 5 masculinos e 5 femininos, entre militares, policiais e civis,
  com texturas de pele, rosto e roupa e animações de captura de movimento (parado, andando, correndo, agachado).
  Por cima, os ossos são ajustados por código: tronco e cabeça seguem a mira, as mãos seguram a arma (IK), inclinação,
  deitado, sentado no veículo, queda livre e paraquedas. Capacete e colete dos militares aparecem só quando equipados.
  De longe (mais de 85 m) volta o boneco simples para economizar o celular.
- **Avião de verdade**: Airbus A320 (amvlab, CC BY 4.0) levando os jogadores e no drop de suprimentos.
- **Armas remodeladas** com a forma real de cada uma (AKM com madeira e pente curvo, M416 com trilhos, SCAR-L areia, AUG e Groza bullpup,
  Kar98k com ferrolho...) e **miras, lunetas, silenciador e empunhadura visíveis** na arma.
- **Casas e prédios com materiais**: tijolo à vista, reboco, telhas, placas de concreto, tábuas de madeira, chapa ondulada e vidro nas janelas.
- Os modelos ficam em `assets/` (cerca de 10 MB) e carregam enquanto o lobby aparece. Créditos em `assets/CREDITS.md`.

## Luz e armas reais (atualização)
- **Iluminação no estilo PUBG**: cores no espaço certo com curva de cor de cinema (ACES), sol quente mais baixo com sombras suaves
  e longas, névoa atmosférica azul-acinzentada e paleta natural (verde oliva, tijolo marrom, concreto, mar escuro).
- **Armas com modelos reais** (Sketchfab, CC BY 4.0): AKM, M16A2, Mosin-Nagant (com luneta PU 3,5x fixa), M17 (SIG P320) e
  revólver S&W M625, com texturas de verdade, na mão dos personagens, no chão e em 1ª pessoa (mira alinhada no aparelho da arma).
  As demais continuam modeladas por código até termos modelos com licença livre.

## Melhorias (pedidos do teste no celular)
- **Mochila**: não trava mais ao fechar (fechar responde no toque, painel sem desfoque pesado, redesenha só quando muda,
  controles soltos ao abrir/fechar e o 3D desenhado com menos frequência enquanto o painel cobre a tela).
- **Mais casas e prédios**: 208 construções (eram 81), com 4 bairros novos (Bairro Verde, Jardim, Prainha, Farol Leste),
  estradas ligando tudo e 50 casas isoladas pelo campo.
- **Mais movimento no corpo**: andar de lado e de ré (pernas viram para onde anda, tronco segue a mira), balanço do tronco
  e da arma nos passos, respiração parado, arma baixa ao correr, coice no tiro, recuo ao levar tiro, pernas encolhidas no pulo,
  corpo cai ao morrer; humanos detalhados até 150 m.
- **Setas para dirigir**: ◀ ▶ à esquerda, ACELERAR e FREIO/RÉ à direita (o joystick continua valendo).
- **Mais itens**: escopetas S1897, S686 e S12K (calibre 12, estrangulador e pente estendido), granada, granada de fumaça
  (bloqueia a visão dos bots), coquetel molotov e seringa de adrenalina. Bots também jogam granadas.

## Pular janela, gráfico e física (atualização)
- **Pular janela / saltar / escalar** (estilo PUBG): no botão de pular, de frente para janela, muro baixo ou caixa, o personagem
  passa por cima ou entra pela janela; obstáculos de até 2,6 m (containers, muros) dá para escalar. O botão mostra
  SALTAR, SUBIR ou ESCALAR quando é possível. Bots também usam para entrar nas casas.
- **Natureza de verdade** (Quaternius Ultimate Nature Pack, CC0): árvores, pinheiros, bétulas, palmeiras na praia e arbustos
  perto da câmera (com vento nas folhas) e pedras reais em toda a ilha. Longe ficam as árvores simples (mais leves).
- **Céu realista** com dispersão atmosférica (modelo Preetham).
- **Clarão no cano** a cada tiro e **marcas de bala** nas paredes, com faísca.
- **Física**: suspensão dos veículos (afunda ao frear, empina ao acelerar, inclina na curva, quica ao cair; a moto deita na
  curva) e as pessoas não se atravessam mais.

## App e online (atualização)
- **Instalar como app**: ícone próprio e funciona sem internet depois da primeira visita (os modelos ficam guardados no aparelho).
  No Chrome do Android: menu ⋮ → "Instalar app"/"Adicionar à tela inicial". No iPhone: Compartilhar → "Adicionar à Tela de Início".
- **Conta automática**, a mesma do Deep Spear (mesmo site): mesmo **código de amigo** e mesmos amigos.
- **👥 Amigos** no lobby: adicionar por código, ver quem está online, **convidar** direto ou mandar o **link pelo WhatsApp**.
- **Esquadrão de até 4 amigos**: o líder (👑) escolhe modo e bots e toca JOGAR para todos; os bots completam as 50 vagas.
- **Partida em grupo**: o líder simula o mundo (bots, zona, saque, drop, veículos); cada um controla o próprio personagem.
  Sincronizados: posições, tiros, dano (nos dois sentidos), derrubar/reviver, mortes e caixas, itens pegos/soltos, veículos,
  granadas e o avião de suprimentos.
- **Progresso na nuvem** (opcional): rodar uma vez `supabase/ilhazero.sql` no SQL Editor do Supabase. Sem isso, fica só no aparelho.

## Próximas fases
3. Helicóptero
5. Voz só entre a equipe, marcações (ping), personalização

## Desenvolvimento
Código em `src/` (módulos numerados, juntados em ordem). Gerar e testar antes de publicar:
```
python3 build.py && node tests/smoke.js
```
O teste compila o JavaScript e simula partidas inteiras (esquadrão e solo) num navegador sem tela.

## Imagem, câmera, física e movimento (estilo PUBG)
- **Imagem**: antisserrilhado MSAA 4x, nitidez leve, cor mais viva sem estourar, contraste suave e vinheta (Médio e Alto); resolução dinâmica que baixa sozinha se o FPS cair
- **Câmera 3ª pessoa**: por cima do ombro, segue o corpo com leve atraso (não treme em degraus), desliza junto ao inclinar, encosta na parede e volta devagar, afasta um pouco correndo e olhando para baixo
- **Câmera 1ª pessoa**: balanço da cabeça com os passos, arma com peso (atrasa ao virar), arma abaixa correndo, câmera afunda ao aterrissar
- **Campo de visão** ajustável (75–105) nas configurações, medido na horizontal como no PUBG
- **Física**: aceleração e freada com inércia, mais lento subindo ladeira, aterrissagem amortecida (anda devagar por um instante)
- **Corpo**: parado, o tronco gira até ~60° antes dos pés acompanharem (com passinhos); deitar e agachar com transição suave; joelho dobra ao aterrissar; inclina para frente correndo, para dentro nas curvas e balança ao arrancar/frear

## Armas e tiro (atualização)
- Arma em 1ª pessoa mais clara e visível, com brilho de metal; mira desliza suave até o olho
- Coice com mola (a arma vai para trás e volta), recarga animada em fases (tira o pente, coloca, puxa o ferrolho) com som de cada etapa
- Cápsulas ejetadas que quicam no chão (com tilintar), cartucho vermelho na escopeta, ferrolho nos fuzis de precisão
- Clarão do cano que ilumina o ambiente, fumacinha no cano, poeira ao acertar a terra
- Sangue ao acertar (borrifo + mancha no chão)
- Som em camadas (estalo, corpo grave, eco maior nas cidades); de longe chega abafado e **atrasado** (velocidade do som) e vem do lado certo (esquerda/direita)
- Zunido quando uma bala inimiga passa perto da cabeça; clique de arma vazia

## Telas e HUD (atualização)
- Painel da equipe no canto (número, nome, vida; derrubado em vermelho, morto riscado, 🚗 dentro de veículo)
- Aviso de abate no centro com contagem, arma e distância
- Alertas: zona fechando, nova área segura, 30 s para fechar, "restam 25/10/5/3/2 jogadores"
- Tela de fim estilo PUBG: colocação, abates, tiros na cabeça, dano, abate mais longe, tempo, distância percorrida, precisão, curas, tabela da equipe
- **Ranking por pontos** (Bronze → Prata → Ouro → Platina → Diamante → Mestre) que sobe/desce a cada partida; aparece no lobby
- **Personalizar botões** (Configurações): arrastar, mudar o tamanho e a transparência; fica salvo (também na nuvem)
