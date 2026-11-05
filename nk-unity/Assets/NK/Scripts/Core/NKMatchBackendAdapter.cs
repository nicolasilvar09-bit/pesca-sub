using System;
using UnityEngine;

namespace NK
{
    /// <summary>
    /// Ponto de integração do servidor autoritativo. A implementação deve autenticar o jogador,
    /// validar resultado e impedir replay/fraude antes de devolver XP.
    /// </summary>
    public abstract class NKMatchBackendAdapter : MonoBehaviour
    {
        public abstract void SubmitTrainingResult(int eliminations, float durationSeconds, Action<bool, int> verifiedResult);
        public abstract void SubmitPvPResult(string matchId, int eliminations, int deaths, Action<bool, int> verifiedResult);
    }
}
