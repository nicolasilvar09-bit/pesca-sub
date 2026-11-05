using System.IO;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace NK.EditorTools
{
    /// <summary>
    /// Configuração do projeto e builds. Menu "NK" na barra do editor, ou em linha de comando:
    ///   Unity.exe -batchmode -projectPath . -executeMethod NK.EditorTools.NKSetup.SetupAll -quit
    ///   Unity.exe -batchmode -projectPath . -executeMethod NK.EditorTools.NKSetup.BuildWindowsTest -quit
    /// </summary>
    public static class NKSetup
    {
        const string Res = "Assets/Resources/NK";
        public const string ScenePath = "Assets/Scenes/NK_Teste.unity";
        public const string BundleId = "com.nkmobile.game"; // trocar pelo identificador registrado no App Store Connect

        [MenuItem("NK/Configurar projeto (materiais, cena, ajustes)")]
        public static void SetupAll()
        {
            CreateMaterials();
            CreatePostFx();
            ConfigurePlayer();
            ConfigureUrp();
            CreateScene();
            AssetDatabase.SaveAssets();
            Debug.Log("[NK] Projeto configurado. Abra " + ScenePath + " e aperte Play.");
        }

        // ------------------------------------------------------------------ materiais
        static void Dir(string p) { if (!AssetDatabase.IsValidFolder(p)) { var parent = Path.GetDirectoryName(p).Replace('\\', '/'); Dir(parent); AssetDatabase.CreateFolder(parent, Path.GetFileName(p)); } }

        static Material Mat(string name, string shader)
        {
            Dir(Res);
            string path = Res + "/" + name + ".mat";
            var m = AssetDatabase.LoadAssetAtPath<Material>(path);
            var sh = Shader.Find(shader);
            if (sh == null) { Debug.LogError("[NK] Shader não encontrado: " + shader); return null; }
            if (m == null) { m = new Material(sh); AssetDatabase.CreateAsset(m, path); }
            else m.shader = sh;
            return m;
        }

        static void MakeTransparent(Material m, bool additive)
        {
            m.SetFloat("_Surface", 1);
            m.SetFloat("_Blend", additive ? 2 : 0);
            m.SetOverrideTag("RenderType", "Transparent");
            m.SetFloat("_SrcBlend", additive ? (float)BlendMode.One : (float)BlendMode.SrcAlpha);
            m.SetFloat("_DstBlend", additive ? (float)BlendMode.One : (float)BlendMode.OneMinusSrcAlpha);
            m.SetFloat("_SrcBlendAlpha", (float)BlendMode.One);
            m.SetFloat("_DstBlendAlpha", additive ? (float)BlendMode.One : (float)BlendMode.OneMinusSrcAlpha);
            m.SetFloat("_ZWrite", 0);
            m.EnableKeyword("_SURFACE_TYPE_TRANSPARENT");
            m.renderQueue = (int)RenderQueue.Transparent;
            m.SetShaderPassEnabled("DepthOnly", false);
            m.SetShaderPassEnabled("ShadowCaster", false);
        }

        static void CreateMaterials()
        {
            var lit = Mat("NK_Lit", "Universal Render Pipeline/Lit");
            lit.SetColor("_BaseColor", Color.white); lit.SetFloat("_Smoothness", 0.25f); lit.enableInstancing = true;
            EditorUtility.SetDirty(lit);

            var unlit = Mat("NK_Unlit", "Universal Render Pipeline/Unlit");
            unlit.SetColor("_BaseColor", Color.white);
            EditorUtility.SetDirty(unlit);

            var add = Mat("NK_Additive", "Universal Render Pipeline/Unlit");
            MakeTransparent(add, true);
            add.SetColor("_BaseColor", new Color(1, 0.8f, 0.5f, 1));
            EditorUtility.SetDirty(add);

            var water = Mat("NK_Water", "Universal Render Pipeline/Lit");
            MakeTransparent(water, false);
            water.SetColor("_BaseColor", new Color(0.12f, 0.36f, 0.42f, 0.78f));
            water.SetFloat("_Smoothness", 0.93f);
            water.SetFloat("_Metallic", 0.1f);
            EditorUtility.SetDirty(water);

            var terr = Mat("NK_Terrain", "Universal Render Pipeline/Terrain/Lit");
            if (terr != null) { terr.enableInstancing = true; EditorUtility.SetDirty(terr); }

            var sky = Mat("NK_Sky", "Skybox/Procedural");
            if (sky != null)
            {
                sky.SetFloat("_SunSize", 0.035f);
                sky.SetFloat("_SunSizeConvergence", 6f);
                sky.SetFloat("_AtmosphereThickness", 0.95f);
                sky.SetColor("_SkyTint", new Color(0.5f, 0.55f, 0.62f));
                sky.SetColor("_GroundColor", new Color(0.42f, 0.42f, 0.4f));
                sky.SetFloat("_Exposure", 1.25f);
                EditorUtility.SetDirty(sky);
            }
        }

        static void CreatePostFx()
        {
            Dir(Res);
            string path = Res + "/NK_PostFX.asset";
            var old = AssetDatabase.LoadAssetAtPath<VolumeProfile>(path);
            if (old != null) AssetDatabase.DeleteAsset(path);
            var prof = ScriptableObject.CreateInstance<VolumeProfile>();
            AssetDatabase.CreateAsset(prof, path);

            var tm = prof.Add<Tonemapping>(true);
            tm.mode.value = TonemappingMode.ACES;
            var ca = prof.Add<ColorAdjustments>(true);
            ca.postExposure.value = 0.15f; ca.contrast.value = 8f; ca.saturation.value = 12f;
            var bl = prof.Add<Bloom>(true);
            bl.intensity.value = 0.25f; bl.threshold.value = 1.1f; bl.scatter.value = 0.6f;
            var vg = prof.Add<Vignette>(true);
            vg.intensity.value = 0.2f; vg.smoothness.value = 0.4f;
            foreach (var c in prof.components) { c.hideFlags = HideFlags.HideInInspector | HideFlags.HideInHierarchy; AssetDatabase.AddObjectToAsset(c, prof); }
            EditorUtility.SetDirty(prof);
        }

        // ------------------------------------------------------------------ ajustes
        static void ConfigurePlayer()
        {
            PlayerSettings.companyName = "NK";
            PlayerSettings.productName = "NK Mobile";
            PlayerSettings.bundleVersion = "0.1.0";
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.iOS, BundleId);
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.Android, BundleId);
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.Standalone, BundleId);

            // celular deitado
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.AutoRotation;
            PlayerSettings.allowedAutorotateToLandscapeLeft = true;
            PlayerSettings.allowedAutorotateToLandscapeRight = true;
            PlayerSettings.allowedAutorotateToPortrait = false;
            PlayerSettings.allowedAutorotateToPortraitUpsideDown = false;
            PlayerSettings.statusBarHidden = true;

            // iPhone
            PlayerSettings.iOS.targetOSVersionString = "15.0";
            PlayerSettings.iOS.buildNumber = "1";
            PlayerSettings.SetScriptingBackend(NamedBuildTarget.iOS, ScriptingImplementation.IL2CPP);

            // Android
            PlayerSettings.SetScriptingBackend(NamedBuildTarget.Android, ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64;
            PlayerSettings.Android.bundleVersionCode = 1;

            // janela do teste no PC
            PlayerSettings.fullScreenMode = FullScreenMode.Windowed;
            PlayerSettings.defaultScreenWidth = 1600;
            PlayerSettings.defaultScreenHeight = 900;
            PlayerSettings.resizableWindow = true;
            PlayerSettings.runInBackground = true;
        }

        static void ConfigureUrp()
        {
            void Tune(RenderPipelineAsset rp)
            {
                if (rp is UniversalRenderPipelineAsset u)
                {
                    u.shadowDistance = 70f;
                    u.shadowCascadeCount = 2;
                    u.supportsHDR = true;
                    u.renderScale = 1f;
                    EditorUtility.SetDirty(u);
                }
            }
            Tune(GraphicsSettings.defaultRenderPipeline);
            int cur = QualitySettings.GetQualityLevel();
            for (int i = 0; i < QualitySettings.names.Length; i++)
            {
                QualitySettings.SetQualityLevel(i, false);
                Tune(QualitySettings.renderPipeline);
            }
            QualitySettings.SetQualityLevel(cur, false);
            if (GraphicsSettings.defaultRenderPipeline == null)
                Debug.LogError("[NK] Nenhum URP Asset configurado em Graphics Settings. Crie o projeto pelo template Universal 3D.");
        }

        static void CreateScene()
        {
            Dir("Assets/Scenes");
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            new GameObject("NK_GameRoot").AddComponent<NK.GameRoot>();
            // ajustes de ambiente salvos na cena (a névoa precisa estar ligada na cena para o shader não ser removido do build)
            RenderSettings.skybox = AssetDatabase.LoadAssetAtPath<Material>(Res + "/NK_Sky.mat");
            RenderSettings.fog = true;
            RenderSettings.fogMode = FogMode.Linear;
            RenderSettings.fogColor = new Color(0.66f, 0.72f, 0.78f);
            RenderSettings.fogStartDistance = 90f;
            RenderSettings.fogEndDistance = 700f;
            RenderSettings.ambientMode = AmbientMode.Trilight;
            EditorSceneManager.SaveScene(scene, ScenePath);
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
        }

        // ------------------------------------------------------------------ builds
        static void Build(BuildTarget target, BuildTargetGroup group, string path, BuildOptions opt)
        {
            if (!File.Exists(ScenePath)) SetupAll();
            var report = BuildPipeline.BuildPlayer(new BuildPlayerOptions
            {
                scenes = new[] { ScenePath },
                locationPathName = path,
                target = target,
                targetGroup = group,
                options = opt
            });
            var s = report.summary;
            Debug.Log($"[NK] Build {target}: {s.result}, {s.totalErrors} erros, {s.totalSize / (1024 * 1024)} MB, {s.totalTime.TotalSeconds:0}s -> {path}");
            if (Application.isBatchMode && s.result != BuildResult.Succeeded) EditorApplication.Exit(1);
        }

        [MenuItem("NK/Build de teste para Windows")]
        public static void BuildWindowsTest() => Build(BuildTarget.StandaloneWindows64, BuildTargetGroup.Standalone, "Builds/WinTest/NKMobile.exe", BuildOptions.Development);

        [MenuItem("NK/Build Android (APK)")]
        public static void BuildAndroid()
        {
            EditorUserBuildSettings.buildAppBundle = false;
            Build(BuildTarget.Android, BuildTargetGroup.Android, "Builds/Android/NKMobile.apk", BuildOptions.None);
        }

        [MenuItem("NK/Gerar projeto Xcode (iOS)")]
        public static void BuildIOS() => Build(BuildTarget.iOS, BuildTargetGroup.iOS, "Builds/iOS", BuildOptions.None);
    }
}
