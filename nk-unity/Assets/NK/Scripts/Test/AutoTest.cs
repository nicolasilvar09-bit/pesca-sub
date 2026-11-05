using System.Collections;
using System.IO;
using System.Text;
using UnityEngine;

namespace NK
{
    /// <summary>
    /// Teste automático (rodar o jogo com -nkAutoTest [-nkOut pasta]): faz o personagem andar, correr, pular,
    /// agachar, deitar, passar no túnel baixo, atirar nos alvos, trocar para 1ª pessoa e mirar; mede velocidades,
    /// altura do pulo e alturas da cápsula, tira prints de cada etapa, grava nk_autotest.txt e fecha o jogo.
    /// </summary>
    [DefaultExecutionOrder(-90)]
    public class AutoTest : MonoBehaviour
    {
        public static bool Requested
        {
            get
            {
                foreach (var a in System.Environment.GetCommandLineArgs()) if (a == "-nkAutoTest") return true;
                return false;
            }
        }

        string outDir;
        readonly StringBuilder log = new StringBuilder();
        int fails;
        Vector2 move; bool sprint, fire;

        static string Arg(string name)
        {
            var a = System.Environment.GetCommandLineArgs();
            for (int i = 0; i < a.Length - 1; i++) if (a[i] == name) return a[i + 1];
            return null;
        }

        void Start()
        {
            outDir = Arg("-nkOut") ?? Path.Combine(Application.persistentDataPath, "autotest");
            Directory.CreateDirectory(outDir);
            NKInput.Scripted = true;
            StartCoroutine(Run());
        }

        bool pJump, pCrouch, pProne, pView, pAds;

        // roda depois dos controles (que limpam os botões) e antes do jogador
        void Update()
        {
            NKInput.Move = move; NKInput.Sprint = sprint; NKInput.Fire = fire;
            NKInput.JumpPressed = pJump; NKInput.CrouchPressed = pCrouch; NKInput.PronePressed = pProne;
            NKInput.ViewPressed = pView; NKInput.AdsPressed = pAds;
            pJump = pCrouch = pProne = pView = pAds = false;
        }

        void Log(string s) { Debug.Log("[NK-AUTOTEST] " + s); log.AppendLine(s); }
        void Check(string what, bool ok, string detail)
        {
            if (!ok) fails++;
            Log((ok ? "OK    " : "FALHOU") + "  " + what + "  " + detail);
        }

        IEnumerator Shot(string name)
        {
            yield return new WaitForEndOfFrame();
            string p = Path.Combine(outDir, name + ".png");
            ScreenCapture.CaptureScreenshot(p);
            yield return null; yield return null;
            Log("print: " + p);
        }

        IEnumerator Press(System.Action set) { set(); yield return null; yield return null; }

        IEnumerator MeasureSpeed(float seconds, System.Action<float> result)
        {
            var m = GameRoot.I.Player;
            yield return new WaitForSeconds(0.8f); // acelera
            Vector3 a = m.transform.position; float t0 = Time.time;
            yield return new WaitForSeconds(seconds);
            Vector3 b = m.transform.position;
            a.y = b.y = 0;
            result(Vector3.Distance(a, b) / (Time.time - t0));
        }

        IEnumerator Run()
        {
            var g = GameRoot.I;
            var m = g.Player;
            var cam = g.PCam;
            Log("NK Mobile autoteste · Unity " + Application.unityVersion + " · " + SystemInfo.graphicsDeviceName + " · " + Screen.width + "x" + Screen.height);
            yield return new WaitForSeconds(1.5f);
            Check("chão", m.Grounded, "y=" + m.transform.position.y.ToString("0.00"));
            yield return Shot("01_3p_parado");

            // andar
            float v = 0;
            move = Vector2.up;
            yield return MeasureSpeed(1.2f, r => v = r);
            Check("andar ~5,0 m/s", Mathf.Abs(v - PlayerMotor.WalkSpeed) < 0.35f, v.ToString("0.00") + " m/s");
            // correr
            sprint = true;
            yield return MeasureSpeed(1.2f, r => v = r);
            Check("correr ~6,4 m/s", Mathf.Abs(v - PlayerMotor.SprintSpeed) < 0.4f && m.Sprinting, v.ToString("0.00") + " m/s");
            yield return Shot("02_3p_correndo");
            sprint = false; move = Vector2.zero;
            yield return new WaitForSeconds(0.6f);

            // pular
            yield return Press(() => pJump = true);
            yield return new WaitForSeconds(0.25f);
            yield return Shot("03_3p_pulo");
            yield return new WaitForSeconds(0.8f);
            float expected = PlayerMotor.JumpVel * PlayerMotor.JumpVel / (2 * PlayerMotor.Gravity);
            Check("pulo ~0,70 m", Mathf.Abs(m.JumpPeak - expected) < 0.12f && m.Grounded, m.JumpPeak.ToString("0.00") + " m (esperado " + expected.ToString("0.00") + ")");

            // agachar
            yield return Press(() => pCrouch = true);
            yield return new WaitForSeconds(0.6f);
            Check("agachar: altura 1,25", m.stance == Stance.Crouch && Mathf.Abs(m.Height - 1.25f) < 0.02f, m.Height.ToString("0.00"));
            move = new Vector2(0.0f, 1f);
            yield return MeasureSpeed(1.0f, r => v = r);
            Check("agachado ~2,7 m/s", Mathf.Abs(v - PlayerMotor.CrouchSpeed) < 0.3f, v.ToString("0.00") + " m/s");
            move = Vector2.zero;
            m.yaw = 50f;
            yield return new WaitForSeconds(0.3f);
            yield return Shot("04_3p_agachado");

            // deitar
            yield return Press(() => pProne = true);
            yield return new WaitForSeconds(0.9f);
            Check("deitar: altura 0,6", m.stance == Stance.Prone && Mathf.Abs(m.Height - 0.6f) < 0.02f, m.Height.ToString("0.00"));
            move = Vector2.up;
            yield return MeasureSpeed(1.0f, r => v = r);
            Check("deitado ~1,1 m/s", Mathf.Abs(v - PlayerMotor.ProneSpeed) < 0.2f, v.ToString("0.00") + " m/s");
            move = Vector2.zero;
            m.yaw = 60f;
            yield return new WaitForSeconds(0.4f);
            yield return Shot("05_3p_deitado");

            // túnel rasteiro (teto 0,8 m): deitado cabe, levantar não pode
            m.Teleport(g.World.LowTunnelPoint, 0);
            yield return new WaitForSeconds(0.4f);
            yield return Press(() => pProne = true); // tenta levantar
            yield return new WaitForSeconds(0.4f);
            Check("teto baixo impede levantar", m.stance == Stance.Prone && m.StandBlocked, "postura=" + m.stance);
            yield return Shot("06_tunel_deitado");
            m.Teleport(g.World.SpawnPoint, 0);
            yield return new WaitForSeconds(0.3f);
            yield return Press(() => pProne = true);
            yield return new WaitForSeconds(0.8f);
            Check("levantar fora do túnel", m.stance == Stance.Stand && Mathf.Abs(m.Height - 1.8f) < 0.02f, m.Height.ToString("0.00"));

            // atirar no alvo de 25 m
            Vector3 tgt = g.World.RangeTarget25 + Vector3.up * 1.15f;
            Vector3 eye = m.transform.position + Vector3.up * m.EyeHeight;
            Vector3 d = tgt - eye;
            m.yaw = Mathf.Atan2(d.x, d.z) * Mathf.Rad2Deg;
            m.pitch = Mathf.Atan2(d.y, new Vector2(d.x, d.z).magnitude) * Mathf.Rad2Deg;
            yield return new WaitForSeconds(0.5f);
            int hits0 = g.Gun.Hits;
            fire = true;
            yield return new WaitForSeconds(0.12f);
            yield return Shot("07_3p_tiro");
            yield return new WaitForSeconds(0.25f);
            fire = false;
            yield return new WaitForSeconds(0.3f);
            Check("tiro acerta alvo de 25 m", g.Gun.Hits > hits0, (g.Gun.Hits - hits0) + " acertos de " + g.Gun.ShotsFired + " tiros");

            // 1ª pessoa e mira
            yield return Press(() => pView = true);
            yield return new WaitForSeconds(0.5f);
            Check("1ª pessoa", cam.firstPerson, "");
            yield return Shot("08_1p");
            yield return Press(() => pAds = true);
            yield return new WaitForSeconds(0.5f);
            Check("mira (ADS)", m.ads, "");
            fire = true;
            yield return new WaitForSeconds(0.1f);
            yield return Shot("09_1p_mira_tiro");
            fire = false;
            yield return Press(() => pAds = true);
            yield return Press(() => pView = true);
            // visão geral da pista
            m.yaw = -60f; m.pitch = -8f;
            yield return new WaitForSeconds(0.6f);
            yield return Shot("10_pista_obstaculos");

            Log(fails == 0 ? "RESULTADO: TUDO OK" : "RESULTADO: " + fails + " FALHA(S)");
            File.WriteAllText(Path.Combine(outDir, "nk_autotest.txt"), log.ToString());
            NKInput.Scripted = false;
            yield return new WaitForSeconds(0.3f);
#if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
#else
            Application.Quit(fails == 0 ? 0 : 1);
#endif
        }
    }
}
