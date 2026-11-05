using UnityEngine;

namespace NK
{
    /// <summary>
    /// Terreno de teste (512 m x 512 m) feito por código: área plana no centro, colinas em volta, morros na borda,
    /// lagoa, árvores e pedras; pista de obstáculos (caixas de 0,5 a 2,6 m, rampa, escada, túneis baixos para agachar e
    /// deitar, muro com janela, casinha, contêineres) e estande de tiro com alvos a 10, 25, 50, 100 e 150 m.
    /// </summary>
    public class TestWorld : MonoBehaviour
    {
        public const float Size = 512f, MaxH = 70f, Base = 2f;
        public Terrain terrain;
        public Vector3 SpawnPoint { get; private set; }
        public Vector3 LowTunnelPoint { get; private set; }
        public Vector3 RangeTarget25 { get; private set; }
        Transform props;
        System.Random rnd = new System.Random(1234);
        float R(float a, float b) => a + (float)rnd.NextDouble() * (b - a);

        static readonly Vector2 Pond = new Vector2(80, -70);

        public static float HeightAt(float x, float z)
        {
            float r = Mathf.Sqrt(x * x + z * z);
            float h = Base;
            float hills = Fbm(x * 0.008f + 11.3f, z * 0.008f + 4.1f, 4) * 16f;
            h += hills * Smooth(55f, 130f, r);
            float edge = Mathf.Max(Mathf.Abs(x), Mathf.Abs(z));
            h += Smooth(170f, 245f, edge) * (25f + Fbm(x * 0.015f, z * 0.015f, 3) * 30f);
            float pd = Vector2.Distance(new Vector2(x, z), Pond);
            h = Mathf.Lerp(h, -1.2f, 1 - Smooth(12f, 32f, pd));
            return h;
        }

        static float Smooth(float a, float b, float x) { float t = Mathf.Clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); }
        static float Fbm(float x, float y, int oct)
        {
            float s = 0, a = 0.5f, n = 0;
            for (int i = 0; i < oct; i++) { s += Mathf.PerlinNoise(x, y) * a; n += a; a *= 0.5f; x *= 2.03f; y *= 2.03f; }
            return s / n;
        }

        public void Build()
        {
            BuildTerrain();
            props = new GameObject("Props").transform;
            props.SetParent(transform, false);
            BuildWater();
            BuildCourse();
            BuildRange();
            BuildNature();
            SpawnPoint = new Vector3(0, Ground(0, 0) + 0.05f, 0);
        }

        public float Ground(float x, float z) => terrain != null ? terrain.SampleHeight(new Vector3(x, 0, z)) + terrain.transform.position.y : HeightAt(x, z);

        // ------------------------------------------------------------------
        void BuildTerrain()
        {
            int res = 513;
            var td = new TerrainData { heightmapResolution = res };
            td.size = new Vector3(Size, MaxH + 5f, Size);
            float yOff = -5f; // permite fundo da lagoa abaixo de 0
            var hs = new float[res, res];
            for (int j = 0; j < res; j++)
                for (int i = 0; i < res; i++)
                {
                    float x = -Size / 2 + i * Size / (res - 1), z = -Size / 2 + j * Size / (res - 1);
                    hs[j, i] = Mathf.Clamp01((HeightAt(x, z) - yOff) / (MaxH + 5f));
                }
            td.SetHeights(0, 0, hs);

            // camadas: grama, grama seca, terra, pedra, areia (texturas geradas)
            var grass = Layer(NKRes.NoiseTex(256, new Color(0.24f, 0.36f, 0.14f), new Color(0.38f, 0.48f, 0.2f), 6, 1, 0.02f, new Color(0.55f, 0.6f, 0.3f)), 5);
            var dry = Layer(NKRes.NoiseTex(256, new Color(0.42f, 0.42f, 0.22f), new Color(0.55f, 0.5f, 0.3f), 5, 2), 7);
            var dirt = Layer(NKRes.NoiseTex(256, new Color(0.33f, 0.25f, 0.16f), new Color(0.47f, 0.37f, 0.25f), 8, 3, 0.05f, new Color(0.6f, 0.55f, 0.5f)), 4);
            var rock = Layer(NKRes.NoiseTex(256, new Color(0.36f, 0.35f, 0.33f), new Color(0.55f, 0.54f, 0.5f), 10, 4), 6);
            var sand = Layer(NKRes.NoiseTex(256, new Color(0.7f, 0.63f, 0.46f), new Color(0.82f, 0.76f, 0.58f), 12, 5), 4);
            td.terrainLayers = new[] { grass, dry, dirt, rock, sand };
            int ar = 256;
            td.alphamapResolution = ar;
            var am = new float[ar, ar, 5];
            for (int j = 0; j < ar; j++)
                for (int i = 0; i < ar; i++)
                {
                    float u = (i + 0.5f) / ar, v = (j + 0.5f) / ar;
                    float x = -Size / 2 + u * Size, z = -Size / 2 + v * Size;
                    float steep = td.GetSteepness(u, v);
                    float h = HeightAt(x, z);
                    float wR = Smooth(28f, 42f, steep);
                    float wS = (1 - Smooth(0.6f, 2.6f, h)) * (1 - Smooth(30f, 45f, Vector2.Distance(new Vector2(x, z), Pond)));
                    float n = Fbm(x * 0.02f + 3, z * 0.02f + 7, 3);
                    float wD = Smooth(0.55f, 0.7f, n) * 0.8f;
                    // trilha de terra na pista de obstáculos e no estande
                    if ((x > -32 && x < 2 && z > 4 && z < 46) || (x > 3 && x < 12 && z > 4 && z < 160)) wD = Mathf.Max(wD, 0.85f);
                    float wDry = Smooth(0.45f, 0.65f, Fbm(x * 0.01f + 50, z * 0.01f, 2)) * 0.7f;
                    float wG = 1f;
                    float rest = 1f;
                    float a3 = wR; rest -= a3;
                    float a4 = Mathf.Min(rest, wS); rest -= a4;
                    float a2 = Mathf.Min(rest, wD * rest); rest -= a2;
                    float a1 = Mathf.Min(rest, wDry * rest); rest -= a1;
                    float a0 = rest * wG;
                    am[j, i, 0] = a0; am[j, i, 1] = a1; am[j, i, 2] = a2; am[j, i, 3] = a3; am[j, i, 4] = a4;
                }
            td.SetAlphamaps(0, 0, am);

            var go = Terrain.CreateTerrainGameObject(td);
            go.name = "Terrain";
            go.transform.SetParent(transform, false);
            go.transform.position = new Vector3(-Size / 2, yOff, -Size / 2);
            terrain = go.GetComponent<Terrain>();
            terrain.materialTemplate = NKRes.Terrain;
            terrain.heightmapPixelError = 4;
            terrain.basemapDistance = 250;
            terrain.drawInstanced = true;
        }

        static TerrainLayer Layer(Texture2D t, float tile) => new TerrainLayer { diffuseTexture = t, tileSize = new Vector2(tile, tile), smoothness = 0.05f };

        void BuildWater()
        {
            var w = GameObject.CreatePrimitive(PrimitiveType.Plane);
            w.name = "Lagoa";
            Destroy(w.GetComponent<Collider>());
            w.transform.SetParent(props, false);
            w.transform.position = new Vector3(Pond.x, 0.6f, Pond.y);
            w.transform.localScale = new Vector3(8, 1, 8);
            w.GetComponent<MeshRenderer>().sharedMaterial = NKRes.Water;
        }

        // ------------------------------------------------------------------
        void BuildCourse()
        {
            var tex = NKRes.NoiseTex(128, new Color(0.62f, 0.6f, 0.56f), new Color(0.75f, 0.73f, 0.69f), 8, 9);
            var concrete = NKRes.Lit(Color.white, 0.15f, 0, tex);
            var wood = NKRes.Lit(new Color(0.55f, 0.38f, 0.22f), 0.2f);
            var brick = NKRes.Lit(new Color(0.62f, 0.32f, 0.24f), 0.1f);
            var roofM = NKRes.Lit(new Color(0.3f, 0.3f, 0.32f), 0.2f);
            float g = Base;

            // caixas de alturas diferentes (0,5 / 1,0 / 1,6 / 2,6 m)
            float[] hs = { 0.5f, 1.0f, 1.6f, 2.6f };
            for (int i = 0; i < hs.Length; i++)
                NKRes.Box(props, new Vector3(-5 - i * 2.6f, g + hs[i] / 2, 10), new Vector3(1.6f, hs[i], 1.6f), wood, 0, "Caixa_" + hs[i] + "m");

            // rampa até plataforma de 2 m
            var ramp = NKRes.Box(props, new Vector3(-17, g + 1f, 12), new Vector3(3, 0.3f, 7.2f), concrete, 0, "Rampa");
            ramp.transform.rotation = Quaternion.Euler(-16.5f, 0, 0);
            NKRes.Box(props, new Vector3(-17, g + 1f, 17.4f), new Vector3(3, 2f, 4), concrete, 0, "Plataforma");

            // escada: 10 degraus de 0,2 m
            for (int i = 0; i < 10; i++)
                NKRes.Box(props, new Vector3(-24, g + 0.1f + i * 0.1f, 10 + i * 0.35f), new Vector3(2.4f, 0.2f + i * 0.2f, 0.35f), concrete, 0, "Degrau");
            NKRes.Box(props, new Vector3(-24, g + 1f, 14.8f), new Vector3(2.4f, 2f, 3f), concrete, 0, "Topo");

            // túnel baixo (teto a 1,4 m: só agachado) e túnel rasteiro (teto a 0,8 m: só deitado)
            Tunnel(new Vector3(-6, g, 24), 1.4f, concrete, "Tunel_agachar");
            Tunnel(new Vector3(-12, g, 24), 0.8f, concrete, "Tunel_deitar");
            LowTunnelPoint = new Vector3(-12, g + 0.02f, 24);

            // muro com janela (peitoril a 1 m)
            float wx = -20, wz = 28;
            NKRes.Box(props, new Vector3(wx - 2.1f, g + 1.5f, wz), new Vector3(2.4f, 3, 0.25f), brick, 0, "Muro");
            NKRes.Box(props, new Vector3(wx + 2.1f, g + 1.5f, wz), new Vector3(2.4f, 3, 0.25f), brick, 0, "Muro");
            NKRes.Box(props, new Vector3(wx, g + 0.5f, wz), new Vector3(1.8f, 1, 0.25f), brick, 0, "Peitoril");
            NKRes.Box(props, new Vector3(wx, g + 2.5f, wz), new Vector3(1.8f, 1, 0.25f), brick, 0, "Verga");

            // casinha 6x6 com porta e laje
            House(new Vector3(-26, g, 38), brick, roofM);

            // contêineres
            var cc = new[] { new Color(0.15f, 0.35f, 0.6f), new Color(0.7f, 0.25f, 0.15f), new Color(0.25f, 0.5f, 0.3f) };
            for (int i = 0; i < 3; i++)
                NKRes.Box(props, new Vector3(-8 - i * 3.2f, g + 1.3f, 38), new Vector3(2.44f, 2.6f, 6.06f), NKRes.Lit(cc[i], 0.3f, 0.4f), 0, "Conteiner");
            NKRes.Box(props, new Vector3(-11.2f, g + 3.9f, 38), new Vector3(2.44f, 2.6f, 6.06f), NKRes.Lit(new Color(0.75f, 0.6f, 0.15f), 0.3f, 0.4f), 0, "Conteiner");

            // sacos de areia (cobertura baixa) perto do estande
            for (int i = 0; i < 4; i++)
                NKRes.Box(props, new Vector3(3.5f + i * 1.1f, g + 0.4f, 6f), new Vector3(1.0f, 0.8f, 0.6f), NKRes.Lit(new Color(0.6f, 0.53f, 0.38f), 0.05f), 0, "SacoAreia");
        }

        void Tunnel(Vector3 c, float ceil, Material m, string name)
        {
            float len = 6, w = 2.2f, wall = 0.3f, top = 0.3f;
            NKRes.Box(props, c + new Vector3(-w / 2 - wall / 2, (ceil + top) / 2, 0), new Vector3(wall, ceil + top, len), m, 0, name);
            NKRes.Box(props, c + new Vector3(w / 2 + wall / 2, (ceil + top) / 2, 0), new Vector3(wall, ceil + top, len), m, 0, name);
            NKRes.Box(props, c + new Vector3(0, ceil + top / 2, 0), new Vector3(w + wall * 2, top, len), m, 0, name + "_teto");
        }

        void House(Vector3 c, Material wall, Material roof)
        {
            float s = 6, h = 3, t = 0.25f;
            NKRes.Box(props, c + new Vector3(0, h / 2, s / 2), new Vector3(s, h, t), wall, 0, "Parede");                 // fundo
            NKRes.Box(props, c + new Vector3(-s / 2, h / 2, 0), new Vector3(t, h, s), wall, 0, "Parede");                // esquerda
            // direita com janela
            NKRes.Box(props, c + new Vector3(s / 2, h / 2, -1.9f), new Vector3(t, h, 2.2f), wall, 0, "Parede");
            NKRes.Box(props, c + new Vector3(s / 2, h / 2, 1.9f), new Vector3(t, h, 2.2f), wall, 0, "Parede");
            NKRes.Box(props, c + new Vector3(s / 2, 0.5f, 0), new Vector3(t, 1f, 1.6f), wall, 0, "Parede");
            NKRes.Box(props, c + new Vector3(s / 2, 2.6f, 0), new Vector3(t, 0.8f, 1.6f), wall, 0, "Parede");
            // frente com porta (1,1 x 2,2)
            NKRes.Box(props, c + new Vector3(-1.75f, h / 2, -s / 2), new Vector3(2.5f, h, t), wall, 0, "Parede");
            NKRes.Box(props, c + new Vector3(1.75f, h / 2, -s / 2), new Vector3(2.5f, h, t), wall, 0, "Parede");
            NKRes.Box(props, c + new Vector3(0, 2.6f, -s / 2), new Vector3(1f, 0.8f, t), wall, 0, "Parede");
            NKRes.Box(props, c + new Vector3(0, h + 0.1f, 0), new Vector3(s + 0.4f, 0.2f, s + 0.4f), roof, 0, "Laje");
            NKRes.Box(props, c + new Vector3(0, 0.03f, 0), new Vector3(s - 0.1f, 0.06f, s - 0.1f), NKRes.Lit(new Color(0.55f, 0.45f, 0.35f), 0.3f), 0, "Piso");
            // móveis (cobertura)
            NKRes.Box(props, c + new Vector3(-1.8f, 0.45f, 2), new Vector3(2f, 0.9f, 0.9f), NKRes.Lit(new Color(0.3f, 0.35f, 0.5f), 0.2f), 0, "Sofa");
            NKRes.Box(props, c + new Vector3(1.5f, 0.38f, 1.5f), new Vector3(1.2f, 0.06f, 0.8f), NKRes.Lit(new Color(0.45f, 0.3f, 0.18f), 0.3f), 0, "Mesa");
        }

        void BuildRange()
        {
            float[] dists = { 10, 25, 50, 100, 150 };
            float[] xs = { 6, 9, 5, 10, 7 };
            var signM = NKRes.Lit(new Color(0.9f, 0.85f, 0.2f), 0.2f);
            for (int i = 0; i < dists.Length; i++)
            {
                float x = xs[i], z = dists[i];
                var p = new Vector3(x, Ground(x, z), z);
                Target.Create(props, p, 180f, "Alvo_" + dists[i] + "m");
                // marcador amarelo com altura proporcional à distância (fácil de achar)
                NKRes.Box(props, p + new Vector3(1.2f, 0.4f + i * 0.15f, 0), new Vector3(0.15f, 0.8f + i * 0.3f, 0.15f), signM, 0, "Placa_" + dists[i] + "m");
                if (i == 1) RangeTarget25 = p;
            }
        }

        void BuildNature()
        {
            var bark = NKRes.Lit(new Color(0.32f, 0.22f, 0.14f), 0.1f);
            var leaf1 = NKRes.Lit(new Color(0.16f, 0.32f, 0.12f), 0.1f);
            var leaf2 = NKRes.Lit(new Color(0.22f, 0.4f, 0.15f), 0.1f);
            var pine = NKRes.Lit(new Color(0.1f, 0.25f, 0.13f), 0.1f);
            var rockM = NKRes.Lit(new Color(0.48f, 0.47f, 0.44f), 0.15f);
            int placed = 0, tries = 0;
            while (placed < 420 && tries++ < 6000)
            {
                float x = R(-240, 240), z = R(-240, 240);
                float r = Mathf.Sqrt(x * x + z * z);
                if (r < 48) continue;                                              // centro livre
                if (Vector2.Distance(new Vector2(x, z), Pond) < 30) continue;      // lagoa
                if (x > 0 && x < 16 && z > 0 && z < 165) continue;                 // linha de tiro
                if (Fbm(x * 0.012f + 90, z * 0.012f, 2) < 0.45f && rnd.NextDouble() < 0.7) continue; // bosques e campos
                float y = Ground(x, z);
                if (terrain.terrainData.GetSteepness((x + Size / 2) / Size, (z + Size / 2) / Size) > 32) continue;
                Tree(new Vector3(x, y, z), rnd.NextDouble() < 0.35 ? 1 : 0, bark, rnd.NextDouble() < 0.5 ? leaf1 : leaf2, pine);
                placed++;
            }
            for (int i = 0; i < 90; i++)
            {
                float x = R(-235, 235), z = R(-235, 235);
                if (x * x + z * z < 40 * 40 || (x > 0 && x < 16 && z > 0 && z < 165)) continue;
                float s = R(0.6f, 2.6f);
                var rock = NKRes.Prim(PrimitiveType.Sphere, props, new Vector3(x, Ground(x, z) + s * 0.15f, z), new Vector3(s * R(1f, 1.6f), s * R(0.6f, 1f), s * R(1f, 1.5f)), rockM, true, "Pedra");
                rock.transform.rotation = Quaternion.Euler(R(-10, 10), R(0, 360), R(-10, 10));
                rock.isStatic = true;
            }
        }

        void Tree(Vector3 p, int kind, Material bark, Material leaf, Material pine)
        {
            float s = R(0.8f, 1.35f);
            var t = new GameObject(kind == 1 ? "Pinheiro" : "Arvore").transform;
            t.SetParent(props, false);
            t.position = p;
            t.rotation = Quaternion.Euler(0, R(0, 360), 0);
            t.localScale = Vector3.one * s;
            var trunk = NKRes.Prim(PrimitiveType.Cylinder, t, new Vector3(0, 2f, 0), new Vector3(0.35f, 2f, 0.35f), bark, true, "Tronco");
            // colisor do tronco menor que a copa
            if (kind == 1)
            {
                for (int i = 0; i < 3; i++)
                {
                    NKRes.Prim(PrimitiveType.Capsule, t, new Vector3(0, 3.2f + i * 1.5f, 0), new Vector3(2.6f - i * 0.7f, 1.4f, 2.6f - i * 0.7f), pine);
                }
            }
            else
            {
                NKRes.Prim(PrimitiveType.Sphere, t, new Vector3(0, 4.6f, 0), new Vector3(3.6f, 3f, 3.6f), leaf);
                NKRes.Prim(PrimitiveType.Sphere, t, new Vector3(0.9f, 4.0f, 0.4f), new Vector3(2.4f, 2f, 2.4f), leaf);
                NKRes.Prim(PrimitiveType.Sphere, t, new Vector3(-0.7f, 5.4f, -0.5f), new Vector3(2.2f, 1.8f, 2.2f), leaf);
            }
            foreach (Transform c in t) c.gameObject.isStatic = true;
        }
    }
}
