using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace NK
{
    /// <summary>
    /// Monta a cena de teste inteira por código: luz do sol, céu, névoa, pós-processamento (ACES), terreno,
    /// jogador (corpo + câmera + arma) e controles de toque. A cena só precisa deste componente.
    /// </summary>
    public class GameRoot : MonoBehaviour
    {
        public static GameRoot I;
        public TestWorld World { get; private set; }
        public PlayerMotor Player { get; private set; }
        public PlayerCamera PCam { get; private set; }
        public SimpleGun Gun { get; private set; }
        public HumanoidRig Rig { get; private set; }
        public BattlePassUI Pass { get; private set; }
        public ViewModel ViewModel { get; private set; }
        public ImperialVehicleDisplay VehicleDisplay { get; private set; }

        float fpsT, fps; int fpsN;

        void Awake()
        {
            I = this;
            Application.targetFrameRate = 60;
            QualitySettings.vSyncCount = 0;
            Screen.sleepTimeout = SleepTimeout.NeverSleep;

            SetupLighting();
            World = new GameObject("World").AddComponent<TestWorld>();
            World.Build();
            BuildPlayer();
            new GameObject("Controls").AddComponent<TouchControls>();
            Pass = new GameObject("BattlePass").AddComponent<BattlePassUI>();
            new GameObject("MatchManager").AddComponent<MatchManager>();
            new GameObject("CosmeticInventory").AddComponent<CosmeticInventoryUI>();
            VehicleDisplay = new GameObject("ImperialVehicleDisplay").AddComponent<ImperialVehicleDisplay>();
            VehicleDisplay.Initialize(World, World.SpawnPoint + new Vector3(9f, 0f, 7f));

            if (AutoTest.Requested) gameObject.AddComponent<AutoTest>();
        }

        void SetupLighting()
        {
            var sunGo = new GameObject("Sol");
            var sun = sunGo.AddComponent<Light>();
            sun.type = LightType.Directional;
            sun.color = new Color(1f, 0.93f, 0.82f);
            sun.intensity = 1.35f;
            sun.shadows = LightShadows.Soft;
            sun.shadowStrength = 0.85f;
            sunGo.transform.rotation = Quaternion.Euler(38f, -35f, 0);
            RenderSettings.sun = sun;

            if (NKRes.Sky != null) RenderSettings.skybox = NKRes.Sky;
            RenderSettings.ambientMode = AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.55f, 0.62f, 0.72f);
            RenderSettings.ambientEquatorColor = new Color(0.45f, 0.47f, 0.45f);
            RenderSettings.ambientGroundColor = new Color(0.22f, 0.2f, 0.17f);
            RenderSettings.fog = true;
            RenderSettings.fogMode = FogMode.Linear;
            RenderSettings.fogColor = new Color(0.66f, 0.72f, 0.78f);
            RenderSettings.fogStartDistance = 90f;
            RenderSettings.fogEndDistance = 700f;

            var prof = Resources.Load<VolumeProfile>("NK/NK_PostFX");
            if (prof != null)
            {
                var v = new GameObject("PostFX").AddComponent<Volume>();
                v.isGlobal = true; v.priority = 10; v.sharedProfile = prof;
            }
        }

        void BuildPlayer()
        {
            var p = new GameObject("Jogador");
            p.layer = NKRes.PlayerLayer;
            p.AddComponent<CharacterController>();
            Player = p.AddComponent<PlayerMotor>();
            Player.Teleport(World.SpawnPoint, 0f);

            var rigGo = new GameObject("Corpo");
            rigGo.transform.SetParent(p.transform, false);
            Rig = rigGo.AddComponent<HumanoidRig>();
            Rig.motor = Player;
            Rig.Build();
            Rig.ApplyCosmetics(CosmeticInventory.EquippedItems());

            var old = Camera.main;
            if (old != null) Destroy(old.gameObject);
            var camGo = new GameObject("Camera");
            camGo.tag = "MainCamera";
            var cam = camGo.AddComponent<Camera>();
            camGo.AddComponent<AudioListener>();
            var data = cam.GetUniversalAdditionalCameraData();
            data.renderPostProcessing = true;
            data.antialiasing = AntialiasingMode.FastApproximateAntialiasing;
            PCam = camGo.AddComponent<PlayerCamera>();
            PCam.motor = Player;
            PCam.rig = Rig;
            var vm = camGo.AddComponent<ViewModel>();
            vm.motor = Player;
            vm.Build();
            ViewModel = vm;
            vm.ApplyWeaponSkin(CosmeticInventory.EquippedFor("weapon"));
            PCam.viewModel = vm;

            Gun = p.AddComponent<SimpleGun>();
            Gun.motor = Player; Gun.pcam = PCam; Gun.rig = Rig; Gun.vm = vm;
        }

        void Update()
        {
            // painel de informações (canto superior esquerdo)
            fpsT += Time.unscaledDeltaTime; fpsN++;
            if (fpsT >= 0.5f) { fps = fpsN / fpsT; fpsT = 0; fpsN = 0; }
            var tc = TouchControls.I;
            if (tc != null && Player != null)
            {
                string st = Player.stance == Stance.Prone ? "DEITADO" : Player.stance == Stance.Crouch ? "AGACHADO" : "EM PÉ";
                float kmh = Player.HVel.magnitude * 3.6f;
                tc.infoText.text = $"{fps:0} FPS   {(PCam.firstPerson ? "1ª PESSOA" : "3ª PESSOA")}\n{st}{(Player.Sprinting ? " · CORRENDO" : "")}{(Player.ads ? " · MIRANDO" : "")}   {kmh:0.0} km/h";
                tc.centerText.text = Player.StandBlocked && Player.stance != Stance.Stand ? "Sem espaço para levantar" : "";
            }
            // caiu do mapa: volta ao início
            if (Player != null && Player.transform.position.y < -30f) Player.Teleport(World.SpawnPoint, 0);
        }
    }
}
