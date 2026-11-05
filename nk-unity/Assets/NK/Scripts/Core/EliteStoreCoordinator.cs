using System;
using UnityEngine;

namespace NK
{
    /// <summary>
    /// Contrato para um adaptador real de loja. A implementação concreta deve usar Unity IAP,
    /// validar recibo/servidor e só então informar sucesso. Nenhuma compra é simulada aqui.
    /// </summary>
    public abstract class EliteStoreProvider : MonoBehaviour
    {
        public abstract void PurchaseElite(Action<bool, string> completed);
        public abstract void RestoreElite(Action<bool, string> completed);
    }

    public static class EliteStoreCoordinator
    {
        public static void RequestPurchase(BattlePassUI ui)
        {
            EliteStoreProvider provider = UnityEngine.Object.FindObjectOfType<EliteStoreProvider>();
            if (provider == null)
            {
                if (ui != null) ui.SetStoreMessage("LOJA NÃO CONFIGURADA: ADICIONE O ADAPTADOR UNITY IAP");
                return;
            }
            provider.PurchaseElite((verified, message) =>
            {
                if (verified && ui != null) ui.SetEliteEntitlement(true);
                else if (ui != null) ui.SetStoreMessage(string.IsNullOrEmpty(message) ? "COMPRA NÃO VALIDADA" : message);
            });
        }

        public static void RequestRestore(BattlePassUI ui)
        {
            EliteStoreProvider provider = UnityEngine.Object.FindObjectOfType<EliteStoreProvider>();
            if (provider == null)
            {
                if (ui != null) ui.SetStoreMessage("RESTAURAÇÃO INDISPONÍVEL: LOJA NÃO CONFIGURADA");
                return;
            }
            provider.RestoreElite((verified, message) =>
            {
                if (verified && ui != null) ui.SetEliteEntitlement(true);
                else if (ui != null) ui.SetStoreMessage(string.IsNullOrEmpty(message) ? "NENHUMA COMPRA VALIDADA" : message);
            });
        }
    }
}
