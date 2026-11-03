# Ilha Zero · Battle Royale para celular

Jogo de tiro battle royale em 3D (Three.js), feito para celular deitado. Tudo num arquivo só (`index.html`), roda no navegador.

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

## Próximas fases
3. Helicóptero
4. Multijogador online: lobby com amigos (convite por link/código, como no Deep Spear), partidas com bots completando
5. Voz só entre a equipe, marcações (ping), personalização

## Desenvolvimento
Código em `src/` (módulos numerados, juntados em ordem). Gerar e testar antes de publicar:
```
python3 build.py && node tests/smoke.js
```
O teste compila o JavaScript e simula partidas inteiras (esquadrão e solo) num navegador sem tela.
