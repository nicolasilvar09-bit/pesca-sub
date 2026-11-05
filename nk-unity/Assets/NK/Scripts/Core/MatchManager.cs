using UnityEngine;

namespace NK
{
    /// <summary>Partidas locais de treino de 3 minutos; concede XP uma única vez ao concluir cada rodada.</summary>
    public class MatchManager : MonoBehaviour
    {
        const float MatchDuration = 180f;
        float remaining = MatchDuration, resultUntil;
        int kills;
        bool finished;
        GUIStyle label, result;
        void OnEnable() { Target.Eliminated += OnTargetEliminated; }
        void OnDisable() { Target.Eliminated -= OnTargetEliminated; }
        void OnTargetEliminated(Target target) { if (!finished) kills++; }
        void Update()
        {
            if (finished)
            {
                if (Time.time >= resultUntil) { finished = false; kills = 0; remaining = MatchDuration; }
                return;
            }
            remaining -= Time.deltaTime;
            if (remaining <= 0) FinishMatch();
        }
        void FinishMatch()
        {
            if (finished) return;
            finished = true; remaining = 0; resultUntil = Time.time + 10f;
            bool victory = kills >= 5;
            NKMatchBackendAdapter backend = FindObjectOfType<NKMatchBackendAdapter>();
            if (backend != null)
            {
                backend.SubmitTrainingResult(kills, MatchDuration, (verified, xp) =>
                {
                    if (verified && GameRoot.I != null && GameRoot.I.Pass != null)
                        GameRoot.I.Pass.RegisterMatch(Mathf.Max(0, xp), victory);
                });
            }
            else if (GameRoot.I != null && GameRoot.I.Pass != null)
            {
                // Fallback apenas para treino offline; nunca usar como fonte de XP em PvP/produção.
                GameRoot.I.Pass.RegisterMatch(100, victory);
            }
        }
        void OnGUI()
        {
            if (label == null) label = new GUIStyle(GUI.skin.box) { fontSize = Mathf.Max(14, Screen.height / 55), alignment = TextAnchor.MiddleCenter, normal = { textColor = Color.white } };
            if (result == null) result = new GUIStyle(GUI.skin.box) { fontSize = Mathf.Max(18, Screen.height / 38), alignment = TextAnchor.MiddleCenter, wordWrap = true, normal = { textColor = new Color(1f, .78f, .38f) } };
            string time = string.Format("{0:00}:{1:00}", Mathf.FloorToInt(remaining / 60), Mathf.FloorToInt(remaining % 60));
            GUI.Box(new Rect(16, 70, 220, 78), "TREINO  •  " + time + "\nELIMINAÇÕES: " + kills, label);
            if (finished)
            {
                bool win = kills >= 5;
                GUI.Box(new Rect((Screen.width - 390) / 2, Screen.height * .28f, 390, 160),
                    (win ? "VITÓRIA NO TREINO" : "TREINO CONCLUÍDO") + "\n" + kills + " eliminações\n+" + (win ? "150" : "100") + " XP  •  NOVA RODADA EM INSTANTES", result);
            }
        }
    }
}
