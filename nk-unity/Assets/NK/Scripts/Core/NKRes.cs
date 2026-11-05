using System.Collections.Generic;
using UnityEngine;

namespace NK
{
    /// <summary>
    /// Materiais e texturas feitos por código. Os materiais-base (URP Lit, Unlit, Água, Terreno, Céu) ficam em
    /// Assets/Resources/NK (criados pelo menu NK ▸ Configurar projeto) para os shaders irem junto no build.
    /// </summary>
    public static class NKRes
    {
        static Material _lit, _unlit, _add, _water, _terrain, _sky;
        static readonly Dictionary<long, Material> cache = new Dictionary<long, Material>();

        public const int PlayerLayer = 2; // "Ignore Raycast": o próprio jogador não bloqueia tiros nem a câmera
        public const int ShotMask = ~(1 << PlayerLayer);

        static Material Load(string name, string fallbackShader)
        {
            var m = Resources.Load<Material>("NK/" + name);
            if (m != null) return m;
            Debug.LogWarning("[NK] Material NK/" + name + " não encontrado em Resources; rode NK ▸ Configurar projeto.");
            var sh = Shader.Find(fallbackShader);
            return new Material(sh != null ? sh : Shader.Find("Hidden/InternalErrorShader"));
        }

        public static Material LitBase => _lit ??= Load("NK_Lit", "Universal Render Pipeline/Lit");
        public static Material UnlitBase => _unlit ??= Load("NK_Unlit", "Universal Render Pipeline/Unlit");
        public static Material Additive => _add ??= Load("NK_Additive", "Universal Render Pipeline/Unlit");
        public static Material Water => _water ??= Load("NK_Water", "Universal Render Pipeline/Lit");
        public static Material Terrain => _terrain ??= Load("NK_Terrain", "Universal Render Pipeline/Terrain/Lit");
        public static Material Sky => _sky ??= Resources.Load<Material>("NK/NK_Sky");

        /// <summary>Material Lit com cor (cacheado por cor+brilho+metal).</summary>
        public static Material Lit(Color c, float smooth = 0.25f, float metal = 0f, Texture tex = null)
        {
            Color32 k = c;
            long key = ((long)k.r << 24) | ((long)k.g << 16) | ((long)k.b << 8) | k.a;
            key = key * 131 + Mathf.RoundToInt(smooth * 100) * 7 + Mathf.RoundToInt(metal * 100) + (tex != null ? tex.GetInstanceID() * 1000003L : 0);
            if (cache.TryGetValue(key, out var m)) return m;
            m = new Material(LitBase) { enableInstancing = true };
            m.SetColor("_BaseColor", c);
            m.SetFloat("_Smoothness", smooth);
            m.SetFloat("_Metallic", metal);
            if (tex != null) m.SetTexture("_BaseMap", tex);
            cache[key] = m;
            return m;
        }

        public static Material Unlit(Color c)
        {
            var m = new Material(UnlitBase);
            m.SetColor("_BaseColor", c);
            return m;
        }

        public static Material Add(Color c)
        {
            var m = new Material(Additive);
            m.SetColor("_BaseColor", c);
            return m;
        }

        /// <summary>Cria uma primitiva sem colisor (só visual).</summary>
        public static GameObject Prim(PrimitiveType t, Transform parent, Vector3 lpos, Vector3 lscale, Material mat, bool collider = false, string name = null)
        {
            var g = GameObject.CreatePrimitive(t);
            if (name != null) g.name = name;
            if (!collider) Object.Destroy(g.GetComponent<Collider>());
            g.transform.SetParent(parent, false);
            g.transform.localPosition = lpos;
            g.transform.localScale = lscale;
            g.GetComponent<MeshRenderer>().sharedMaterial = mat;
            return g;
        }

        /// <summary>Caixa com colisor em coordenadas do mundo.</summary>
        public static GameObject Box(Transform parent, Vector3 center, Vector3 size, Material mat, float yawDeg = 0, string name = "Box")
        {
            var g = GameObject.CreatePrimitive(PrimitiveType.Cube);
            g.name = name;
            g.transform.SetParent(parent, true);
            g.transform.position = center;
            g.transform.rotation = Quaternion.Euler(0, yawDeg, 0);
            g.transform.localScale = size;
            g.GetComponent<MeshRenderer>().sharedMaterial = mat;
            g.isStatic = true;
            return g;
        }

        public static void SetLayerRecursive(GameObject g, int layer)
        {
            g.layer = layer;
            foreach (Transform c in g.transform) SetLayerRecursive(c.gameObject, layer);
        }

        // ---------------- texturas procedurais ----------------
        static Sprite _disc, _ring;
        public static Sprite Disc => _disc ??= MakeCircle(false);
        public static Sprite Ring => _ring ??= MakeCircle(true);

        static Sprite MakeCircle(bool ring)
        {
            const int N = 128;
            var t = new Texture2D(N, N, TextureFormat.RGBA32, false) { wrapMode = TextureWrapMode.Clamp, filterMode = FilterMode.Bilinear };
            var px = new Color32[N * N];
            float r = N * 0.5f - 1.5f;
            for (int y = 0; y < N; y++)
                for (int x = 0; x < N; x++)
                {
                    float d = Mathf.Sqrt((x + 0.5f - N * 0.5f) * (x + 0.5f - N * 0.5f) + (y + 0.5f - N * 0.5f) * (y + 0.5f - N * 0.5f));
                    float a = Mathf.Clamp01(r - d + 0.5f);
                    if (ring) a *= Mathf.Clamp01(d - (r - 7f) + 0.5f);
                    px[y * N + x] = new Color32(255, 255, 255, (byte)(a * 255));
                }
            t.SetPixels32(px);
            t.Apply();
            return Sprite.Create(t, new Rect(0, 0, N, N), new Vector2(0.5f, 0.5f), 100);
        }

        /// <summary>Textura de ruído (fbm) colorida, repetível, para chão/paredes.</summary>
        public static Texture2D NoiseTex(int n, Color a, Color b, float scale, int seed, float speck = 0f, Color? speckCol = null)
        {
            var t = new Texture2D(n, n, TextureFormat.RGBA32, true) { wrapMode = TextureWrapMode.Repeat, filterMode = FilterMode.Trilinear, anisoLevel = 4 };
            var px = new Color[n * n];
            var rnd = new System.Random(seed);
            float ox = seed * 17.13f, oy = seed * 5.71f;
            for (int y = 0; y < n; y++)
                for (int x = 0; x < n; x++)
                {
                    float u = (float)x / n, v = (float)y / n;
                    float f = TileFbm(u, v, scale, ox, oy);
                    var c = Color.Lerp(a, b, f);
                    if (speck > 0 && rnd.NextDouble() < speck) c = Color.Lerp(c, speckCol ?? Color.white, 0.5f);
                    px[y * n + x] = c;
                }
            t.SetPixels(px);
            t.Apply(true);
            return t;
        }

        // fbm repetível (periódico em u,v) via ruído em toro (4D aproximado por mistura de 2 amostras)
        static float TileFbm(float u, float v, float scale, float ox, float oy)
        {
            float sum = 0, amp = 0.5f, norm = 0, s = scale;
            for (int o = 0; o < 4; o++)
            {
                float n00 = Mathf.PerlinNoise(ox + u * s, oy + v * s);
                float n10 = Mathf.PerlinNoise(ox + (u - 1) * s, oy + v * s);
                float n01 = Mathf.PerlinNoise(ox + u * s, oy + (v - 1) * s);
                float n11 = Mathf.PerlinNoise(ox + (u - 1) * s, oy + (v - 1) * s);
                float n = Mathf.Lerp(Mathf.Lerp(n00, n10, u), Mathf.Lerp(n01, n11, u), v);
                sum += n * amp; norm += amp; amp *= 0.5f; s *= 2;
            }
            return Mathf.Clamp01((sum / norm - 0.5f) * 1.8f + 0.5f);
        }

        /// <summary>Som de tiro gerado (ruído com estalo e cauda).</summary>
        public static AudioClip GunshotClip()
        {
            int sr = 44100, n = (int)(sr * 0.35f);
            var d = new float[n];
            var rnd = new System.Random(7);
            float lp = 0, lp2 = 0;
            for (int i = 0; i < n; i++)
            {
                float t = (float)i / sr;
                float w = (float)(rnd.NextDouble() * 2 - 1);
                lp += (w - lp) * 0.35f; lp2 += (lp - lp2) * 0.08f;
                float crack = w * Mathf.Exp(-t * 90f);
                float body = lp * Mathf.Exp(-t * 18f) * 1.4f + lp2 * Mathf.Exp(-t * 7f) * 2.5f;
                float thump = Mathf.Sin(t * 2 * Mathf.PI * 70f) * Mathf.Exp(-t * 30f) * 0.6f;
                d[i] = Mathf.Clamp((crack * 0.7f + body + thump) * 0.8f, -1, 1);
            }
            var c = AudioClip.Create("nk_shot", n, 1, sr, false);
            c.SetData(d, 0);
            return c;
        }
    }
}
