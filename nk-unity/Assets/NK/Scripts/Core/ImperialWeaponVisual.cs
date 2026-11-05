using UnityEngine;

namespace NK
{
    /// <summary>Detalhes visuais procedurais da skin Coroa Imperial para o rifle de 3ª e 1ª pessoa.</summary>
    public static class ImperialWeaponVisual
    {
        static readonly Color Ruby = new Color(.55f, .035f, .07f);
        static readonly Color Gold = new Color(.86f, .62f, .22f);
        public static void Apply(Transform weaponRoot, bool enabled)
        {
            if (weaponRoot == null) return;
            Transform old = weaponRoot.Find("NK_Imperial_Finish");
            if (old != null) Object.Destroy(old.gameObject);
            if (!enabled) return;
            Transform fx = new GameObject("NK_Imperial_Finish").transform;
            fx.SetParent(weaponRoot, false);
            Material ruby = NKRes.Lit(Ruby, .72f, .35f);
            Material gold = NKRes.Lit(Gold, .82f, .7f);
            NKRes.Prim(PrimitiveType.Cube, fx, new Vector3(0, .045f, .02f), new Vector3(.105f, .025f, .48f), ruby, false, "Corpo_Rubi");
            NKRes.Prim(PrimitiveType.Cube, fx, new Vector3(0, .061f, .02f), new Vector3(.11f, .008f, .32f), gold, false, "Filete_Dourado");
            NKRes.Prim(PrimitiveType.Cube, fx, new Vector3(0, .075f, .14f), new Vector3(.035f, .018f, .12f), gold, false, "Trilho_Imperial");
        }
    }
}
