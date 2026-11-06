# NK Mobile · Battle Royale para celular

Jogo de tiro battle royale em 3D (mapa: Ilha NK) (Three.js), feito para celular deitado. Tudo num arquivo só (`index.html`), roda no navegador.

## Fase 1 (pronta)
- Ilha de ~1,5 km com 15 cidades e ~85 casas isoladas (era ~1,1 km na primeira versão)
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

## Bots mais espertos (atualização)
- **Cobertura**: quando estão com pouca vida, sem munição ou levando tiro, correm para trás de casa/muro/pedra que o inimigo não enxerga, agacham, recarregam ou se curam e voltam espiando
- **Fumaça** entre eles e o inimigo quando não há onde se esconder
- **Avisam a equipe**: quem vê um inimigo passa a posição; os colegas vêm ajudar e os bons **flanqueiam** (contornam pelo lado)
- **Audição**: ouvem tiros (até ~180 m) e passos de quem corre perto; vão investigar ou ficam atentos olhando para o lado do barulho
- Atiradores deitam de longe com fuzil de precisão, inclinam o corpo agachados, pulam de lado em briga curta

## Mapa maior (atualização)
- Ilha 40% maior (~1,5 km), zona e avião ajustados ao novo tamanho; 44 veículos
- 5 cidades novas: **Cidade Alta**, **Pedreira**, **Vila Nova**, **Quartel Sul** (militar, loot forte) e **Rancho**, com estradas ligando tudo
- **Rio** que desce do morro ao norte até o mar ao sul (raso, dá para atravessar a pé) com **pontes** nas estradas
- Colinas novas a leste e o dobro de árvores
- **Casas mobiliadas**: sofá, cama com travesseiro, estante, geladeira, TV e mesa com pés — servem de cobertura

## Segundo mapa: Balneário
Escolha no lobby (**Mapa: Ilha NK / Balneário**). Mapa original do NK Mobile, de selva tropical (~1,2 km):
- Selva fechada (quase o dobro de árvores, coqueiros por toda parte, mato mais alto), morros íngremes, dois rios, duas lagoas e baías recortadas
- **Centro Balneário**: cidade grande com ruas em grade, prédios de 5 a 7 andares, praça com chafariz, bancos e canteiros, carros estacionados
- **Orla Dourada**: resort com hotéis brancos, chalés, piscina com espreguiçadeiras e guarda-sóis
- **Palafitas**: casas de madeira sobre o mar com passarelas até a areia
- **Templo do Morro**: templo em degraus no topo do morro mais alto, colunas e muros em ruínas (loot forte)
- **Mercado Velho**: sobrados coloridos e barracas com toldo; mais Quartel da Mata, Arrozal, Vila Caiçara, Porto Pesqueiro, Mirante, Usina Velha e Cachoeira
- No esquadrão online, o mapa é o do líder (quem entrar num mapa diferente troca sozinho)

## Clima e ambiente (atualização)
- Cada partida sorteia o clima: **dia de sol**, **fim de tarde** (sol baixo e alaranjado), **nublado** (névoa mais perto) ou **chuva** (gotas caindo, céu cinza, som de chuva mais baixo dentro de casa). No Balneário chove mais. Online, todos do esquadrão veem o mesmo clima
- Sons de ambiente: ondas quebrando perto do mar, passarinhos na mata (mais no Balneário), vento no alto dos morros e na queda livre
- Bots agora andam pelas passarelas e píeres sobre a água (palafitas e porto)

## Campo preenchido (atualização, os dois mapas)
- **Florestas fechadas** alternando com **campos abertos**; quase o dobro de árvores e ~12% de **árvores gigantes**
- Entre as cidades: **sítios** (casa, celeiro, galpão, cerca com porteira, feno, trator), **ruínas de pedra**, **torres de vigia** de 3 andares, **acampamentos** (barracas, fogueira, troncos, caixas), **trincheiras de sacos de areia**, **muros de pedra** cortando os campos, **pedras grandes**, **contêineres**
- Beira de estrada: **postos de gasolina**, **carros abandonados**, **postes com fios**, **cercas**
- Morros com **torres de rádio**; casas isoladas com galpão ou caixa d'água no quintal
- Desempenho: blocos do cenário além da névoa não são desenhados

## Noite, prédios por dentro e escolha do mapa (atualização)
- **Noite** (clima raro, ~8%): luz da lua, céu estrelado, janelas das casas acesas, brilho nos postes, grilos; bots enxergam menos no escuro (e também na chuva e no nublado)
- **Prédios grandes por dentro**: cada andar tem corredor e 2–3 salas com porta — escritórios (mesa, monitor, cadeira) e cozinhas (balcão) — luta sala a sala
- **Lobby**: painel com a imagem de cada ilha para escolher o mapa
- **Lanchas** (9 na Ilha NK, 12 no Balneário) na costa, portos e lagoas: 4 lugares, ~70 km/h, boiam e balançam com as ondas, bico sobe ao acelerar, espuma atrás; na terra ficam encalhadas (andam só devagar). Bots não pegam lancha sozinhos, mas entram de passageiro na sua

## Queda, paraquedas e corrida (atualização)
- Avião voa a ~720 m (acima das nuvens): ~10 s de queda livre
- **Queda livre**: ~173 km/h parado; olhar para baixo + frente = **mergulho** até ~234 km/h; olhar para frente + frente = **planar** para longe (~140 km/h na horizontal); trás = freia. O corpo muda de pose (de cabeça no mergulho, braços abertos planando)
- **Paraquedas** de células com cordas, abre enchendo, inclina nas curvas; vira aos poucos; frente = mais rápido e desce mais, trás = flutua; abre sozinho a ~150 m; dá para abrir antes no botão
- Painel de **altura e velocidade** na queda; pouso amortecido que perde o embalo; névoa mais distante quando se está no alto
- **Trava de corrida**: arraste o joystick bem para cima — aparece "🔒 CORRENDO" e dá para soltar o dedo; toque no joystick, mire ou atire para destravar

## 1ª pessoa mais natural (atualização)
- **Braços** visíveis segurando a arma (manga, cotovelo, luva e dedos, feitos no código, sem modelos de fora): mão esquerda no guarda-mão de cada arma, as duas no punho com pistola; acompanham recarga, recuo e corrida
- Câmera com leve inclinação ao andar de lado e virar, e respiração sutil parado
- Arma com peso: atrasa ao andar, frear e pular; abaixa e sobe ao trocar de arma; fica mais baixa agachado/deitado
- Recuo visual diferente por tipo de arma (pistola, submetralhadora, fuzil, DMR, sniper, escopeta) e ciclo do ferrolho/ação depois do tiro

## Lobby novo (atualização)
- Formato de lobby de battle royale com a identidade do NK Mobile (preto e vermelho): cartão do jogador no topo (avatar, nome, **nível** e ranking), esquadrão em fila no centro com o **nome em cima de cada um** ("+ CONVIDAR" no lugar dos bots), **JOGAR** grande à direita com mapa, modo e bots logo acima, atalhos à esquerda
- Painéis novos: **Personagem** (nome e visual) e **Carreira** (partidas, vitórias, taxa de vitória, top 10, abates, abates por morte e por partida, melhor colocação, dano)

## Skins, caixas e Passe de Elite (atualização)
Tudo original do NK Mobile. As caixas usam **fichas 🪙 ganhas jogando** (sem dinheiro de verdade): ~20 por partida + 6 por abate + 15 no top 10 + 60 na vitória; começa com 300.
- **Skins**: 44 de arma (2 para cada uma das 22 armas), 10 roupas + 1 exclusiva do passe, 5 capacetes, 5 mochilas, 10 paraquedas, 5 veículos (jipe, sedã, buggy, moto, lancha). Estampas: camuflado, digital, listras, liso, metálico, tigrado e carbono
- **Caixa NK** (100 fichas): roleta com chance por raridade — Comum 60%, Raro 28%, Épico 10%, Lendário 2%; repetido vira 40 fichas
- **Passe de Elite NK — Temporada 1 (grátis)**: 30 níveis com XP de cada partida; fichas, caixas, itens épicos e o conjunto exclusivo **Coroa Imperial** (preto com linhas vermelhas que brilham, filetes dourados e coroa): capacete no nível 10, M416 no 20, sedã no 25 e traje no 30. As artes de divulgação ficam em `assets/pass/`
- **Armário**: equipa cada item (a roupa aparece no lobby e na partida; a skin de veículo vale quando você assume o volante)
- Bots também aparecem às vezes com roupas, capacetes, mochilas e paraquedas diferentes

## Mapas de 3 km (atualização)
- **Ilha NK** e **Balneário** passaram para ~3 km de ilha (cerca de 4 a 5 vezes a área anterior). Relevo, cidades, estradas, rios e lagoas ampliados na mesma proporção
- Cidades ~45% maiores com quase o dobro de prédios; ~2,6x mais casas isoladas; ~3x mais estruturas no campo (sítios, ruínas, torres, acampamentos, trincheiras, muros, contêineres, postos); ~2,7x mais árvores; nuvens no céu todo
- 80 veículos e 15–20 lanchas; avião mais rápido; zona com as duas primeiras fases mais longas (partida de ~12–13 min)
- Desempenho: estradas, rios e áreas planas consultados por região (o mapa monta ~2x mais rápido que sem isso); vidros das janelas somem junto com os prédios distantes

## Animações novas (atualização)
- 12 animações do pacote **KinemIQ / Quaternius (CC0)** adaptadas aos personagens: andar, correr, **sprint**, agachado parado e **andando agachado**, **no ar** (pulo/queda curta), **aterrissagem**, **escalada** (ao saltar janela/muro), **queda ao morrer**, **soco**, **reação a tiro** e parado relaxado (lobby)

## Árvores realistas (atualização)
- Bétula, carvalho e abeto do **FoliMesh** (grátis para uso pessoal e comercial) perto do jogador nos gráficos Médio e Alto: até ~42 m versão detalhada (~3,5 mil triângulos), até 95–130 m versão leve (~1 mil); longe continuam as árvores simples. Folhas com textura de verdade e balanço com o vento
- **Pedra escaneada** do Poly Haven (CC0), reduzida para ~1.300 triângulos: ~40% das pedras espalhadas pela ilha

## Carros realistas (06/11)
- Sedã, jipe, buggy, moto e lancha refeitos com carroceria curva (perfis arredondados), vidro escuro, colunas, retrovisores, faróis, lanternas, grade, para-choques, maçanetas, placa e caixa de roda.
- Rodas com pneu, aro metálico com raios e cubo; jipe com estepe, quebra-mato e bagageiro.
- Material próprio: pintura com brilho, vidro e cromo refletindo o céu, pneu fosco e poeira na parte de baixo. No gráfico Leve continua o material simples.
- Skins de carro pintam só a lataria (vidro, pneu e farol ficam normais).

## Paredes de foto (06/11)
- Reboco, tijolo, telha, concreto, madeira e chapa usam fotos do ambientCG (CC0) em vez de desenho por código. As 6 fotos ficam em 2 imagens (uma por canal de cor), então pesam pouco.

## Objetos no mapa (06/11)
- Tocos e troncos caídos no mato; barris e caixas de madeira (às vezes empilhadas) encostados nas casas. Modelos escaneados do Poly Haven (CC0).
- Cada objeto tem colisão: serve de cobertura e para as balas. Só os próximos da câmera são desenhados (refaz a cada 20 m).

## Sons reais (06/11)
- Tiros gravados de verdade, um por classe de arma (AK separado do M416), com 2 variações e leve mudança de tom a cada tiro. Abafa com a distância, eco grave de muito longe e vem do lado certo (esquerda/direita). Silenciador abafa.
- Passos de todos que andam perto: terra/grama ou pedra (rua e dentro das casas); agachado bem mais baixo, deitado não faz barulho; correndo mais forte.
- Se os arquivos ainda não carregaram, o jogo usa os sons sintetizados antigos.

## Armas novas (06/11)
- Beryl M762 (fuzil 7.62, coice forte), Vector (SMG 9mm muito rápida), DP-28 (metralhadora 7.62, 47 balas), SLR (DMR 7.62), M249 (metralhadora 5.56, 100 balas, rara no saque e no drop) e Mk14 EBR (DMR automática, só no drop).
- Metralhadoras só aceitam mira (sem silenciador, empunhadura ou pente).
- AUG também aparece rara nas áreas de saque alto, além do drop.
- Frigideira: fica nas costas, segura balas no tronco vindas por trás e a pancada dá 80 de dano (soco = 9). Cai no chão quando o jogador morre e aparece para os outros no online.

## Armas de verdade (06/11)
- 13 armas trocaram o desenho por código por modelos 3D de verdade (Sketchfab, CC BY 4.0): M416, UMP45, Kar98k, S686, S1897, M1911, G18C, Vector, MP5K, UZI, SKS, SLR e AWM (com luneta própria). Somando as 5 de antes, são 18 armas com modelo real.
- As 5 primeiras carregam na abertura; as novas carregam em segundo plano logo depois e trocam sozinhas na tela.

## Sensibilidade estilo PUBG (06/11)
- Menu > Sensibilidade: duas abas, CÂMERA e AO ATIRAR, com um valor (1–300%) para 3ª pessoa, 1ª pessoa, red dot/holo/mira de ferro, 2x, 3x, 4x, 6x e 8x/10x. Padrão do PUBG: 100/100/50/35/25/20/15/12.
- Ao atirar usa a segunda lista (para controlar o coice). Quem já tinha ajustado a sensibilidade antiga começa com o mesmo valor. Salva na nuvem junto com a conta.
