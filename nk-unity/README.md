# NK Mobile · versão Unity 6 (em construção)

> **Como abrir no PC (Windows):**
> 1. Unity Hub → **New project** → modelo **Universal 3D** → salvar em `C:\NKMobileUnity` (fora do OneDrive).
> 2. **Window → Package Manager** → instalar **Input System** (aceitar reiniciar).
> 3. Copiar a pasta `Assets/NK` daqui para dentro de `Assets` do projeto.
> 4. Menu **NK → Configurar projeto** e apertar **Play**.
>
> Estado: código-fonte das etapas 1–5 feito em outra plataforma, **ainda não compilado no Unity Editor**.
> Pronto: controles de toque, personagem 1ª/3ª pessoa, campo de treino, passe, inventário e cosméticos procedurais.
> Falta: mapas, armas e balística, avião/paraquedas, veículos, bots, zona, lobby, personagens realistas e online.
> A loja (Elite paga) e o servidor estão só como pontos de integração — nada é cobrado nem enviado.


Porta da versão navegador (`nicolasilvar09-bit/pesca-sub`, pasta `nk-mobile`) para Unity 6.

## Etapa 1: controles, personagem e terreno de teste
Tudo é feito por código (sem assets de fora):
- `Assets/NK/Scripts/Input/TouchControls.cs`: joystick flutuante (empurrar além do círculo corre, arrastar bem para cima trava a corrida),
  arrastar à direita olha, ATIRAR direito/esquerdo (arrastar o botão também mira), MIRA, PULAR, AGACHAR, DEITAR, RECARREGAR, 1P/3P; respeita a área segura do iPhone.
  No PC/editor: o mouse funciona como dedo; WASD, Shift, Espaço, C, Z, R, V, F (atira), Q (mira), Tab (mouse travado: clique atira, botão direito mira).
- `Player/PlayerMotor.cs`: os mesmos números do jogo atual (andar 5,0 m/s, correr 6,4, agachado 2,7, deitado 1,1, mirando 2,9; pulo 5,3 m/s, gravidade 20;
  alturas 1,8 / 1,25 / 0,6 m; não levanta embaixo de teto baixo; mais lento na subida; aterrissagem amortecida).
- `Player/PlayerCamera.cs` + `ViewModel.cs`: 3ª pessoa por cima do ombro (encosta na parede), 1ª pessoa com braços e arma, MIRA leva ao olho.
- `Player/HumanoidRig.cs`: boneco provisório com animação procedural (troca pelos avatares Rocketbox depois).
- `Combat/SimpleGun.cs`, `Target.cs`: tiro provisório (a balística vem na etapa de armas) e alvos de 10 a 150 m.
- `World/TestWorld.cs`: terreno de 512 m com pista de obstáculos, túneis para agachar/deitar, casinha, contêineres, lagoa, árvores e pedras.
- `Test/AutoTest.cs`: rodar o jogo com `-nkAutoTest -nkOut <pasta>` faz um roteiro, mede tudo e tira prints.
- `Editor/NKSetup.cs`: menu **NK ▸ Configurar projeto** (materiais, pós-processamento, cena `Assets/Scenes/NK_Teste.unity`, ajustes de iPhone/Android) e builds.

## Passe de temporada (interface refinada - etapa 2)
- `Scripts/UI/BattlePassUI.cs`: interface refinada com cabeçalho Coroa Imperial, barra de XP, carrossel horizontal de 10 níveis, cartões de recompensa com emblemas e estados de desbloqueio/resgate; trilhas Gratuita e Elite separadas.
- O botão **PASSE** abre o painel durante o teste. O XP é persistido localmente.
- Integração de partida: chamar `BattlePassUI.RegisterMatch(100, venceu)` no encerramento de cada partida (a vitória soma +50 XP). A etapa 1 ainda não possui fluxo de partidas online/fim de partida, então essa chamada fica preparada para conectar quando esse sistema existir.
- A trilha Elite aparece bloqueada. Não há compra simulada: `SetEliteEntitlement(true)` só deve ser chamado depois de confirmação real da loja/servidor.
- O estado de resgate de recompensas fica salvo localmente via `ClaimReward(tierIndex, eliteTrack)`. Ainda não existe inventário/equipamento de cosméticos, então os itens continuam como catálogo visual e não são modelos/skins 3D aplicados ao personagem ou veículos.

## Próximas etapas
2. Mapas Ilha NK e Balneário gerados a partir de `03_world.js`
3. Armas e balística · 4. Avião/paraquedas · 5. Veículos · 6. Bots e zona · 7. Lobby/skins/passe · 8. Online (mesmo Supabase)

## Etapa 4: partidas de treino e inventário
- `Scripts/Core/MatchManager.cs`: rodada local de treino de 3 minutos, contador de eliminações e concessão de 100 XP ao concluir; +50 XP ao atingir 5 eliminações. O prêmio é concedido uma única vez por rodada.
- `Scripts/Combat/Target.cs`: emite evento de eliminação quando um alvo é derrubado; o MatchManager usa esse evento para contar eliminações reais do campo de treino.
- `Scripts/Core/CosmeticInventory.cs`: inventário local persistente, catálogo de rifle, traje, veículo e capacete imperiais; itens são adicionados automaticamente ao resgatar as recompensas cosméticas correspondentes e podem ser equipados no painel INVENTÁRIO.
- `GameRoot.cs`: inicia o gerenciador de partidas e o inventário junto com a cena.

### Limitações ainda existentes
Esta etapa conecta o XP ao ciclo de rodadas do **campo de treino local**, não a partidas PvP/online (que ainda não existem no projeto). O inventário registra propriedade e equipamento lógico; os quatro itens ainda precisam de modelos 3D/texturas finais para alterar visualmente arma, avatar, capacete e veículo. A Elite continua sem compra simulada e só pode ser ativada por recibo validado da loja/servidor. A persistência local serve para protótipo e deverá ser migrada para backend antes de lançamento competitivo.
- O rig procedural agora recebe uma representação visual inicial para o traje imperial (recoloração do uniforme/colete), capacete imperial (peça procedural) e rifle imperial (recoloração das partes da arma no rig em terceira pessoa). O veículo é registrado/equipável no inventário, mas não tem visual aplicado porque ainda não existe veículo no projeto.


## Etapa 5: cosméticos, veículo, loja e backend (integrações preparadas)

- **Cosméticos por categoria:** o inventário agora permite equipar simultaneamente arma, traje, veículo e capacete, salvando cada slot separadamente e migrando o equipamento antigo.
- **Rifle em 1ª e 3ª pessoa:** a skin Coroa Imperial aplica detalhes rubi/dourados nos dois modelos de arma.
- **Avatar:** traje e capacete recebem representação procedural inicial. São peças geométricas provisórias, não os modelos finais das artes promocionais.
- **Veículo 3D:** foi incluído um SUV procedural de exposição com acabamento imperial selecionável. É estático nesta etapa; não possui direção, física ou sistema de garagem.
- **Compra Elite:** o botão Comprar e o botão Restaurar chamam `EliteStoreCoordinator`. Para transações reais, ainda é obrigatório criar uma implementação concreta de `EliteStoreProvider` com Unity IAP, validação de recibo e confirmação do servidor. Sem esse adaptador, nenhuma compra é simulada nem a Elite é liberada.
- **Partidas/backend:** `NKMatchBackendAdapter` define os contratos para enviar resultados de treino e PvP ao servidor. O `MatchManager` usa o adaptador quando instalado; sem ele, concede XP apenas no treino offline local. Não existe servidor multiplayer conectado nesta entrega.

### O que esta etapa não representa
As integrações de loja e backend são pontos de extensão, não serviços conectados. O veículo é uma peça estática de demonstração, e os cosméticos são representações procedurais iniciais. O ZIP contém os arquivos-fonte e instruções para incorporar ao projeto Unity 6; não é um APK/IPA nem um projeto Unity completo com `ProjectSettings`. Não foi possível compilar no Unity Editor nem testar em aparelho nesta sessão.
