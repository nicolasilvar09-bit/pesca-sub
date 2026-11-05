using UnityEngine;

namespace NK
{
    /// <summary>Veículo 3D de exposição da skin Coroa Imperial. É um modelo estático, não dirigível nesta etapa.</summary>
    public class ImperialVehicleDisplay : MonoBehaviour
    {
        Material bodyMat, trimMat, glassMat, tireMat;
        bool built;
        public void Initialize(TestWorld world, Vector3 position)
        {
            if (built || world == null) return;
            built = true;
            float ground = world.Ground(position.x, position.z);
            transform.position = new Vector3(position.x, ground + .08f, position.z);
            transform.rotation = Quaternion.Euler(0, 135f, 0);
            bodyMat = NKRes.Lit(new Color(.12f, .13f, .15f), .55f, .55f);
            trimMat = NKRes.Lit(new Color(.78f, .56f, .2f), .8f, .7f);
            glassMat = NKRes.Lit(new Color(.035f, .07f, .09f), .8f, .25f);
            tireMat = NKRes.Lit(new Color(.025f, .025f, .03f), .15f);
            NKRes.Prim(PrimitiveType.Cube, transform, new Vector3(0, .72f, 0), new Vector3(2.1f, .62f, 4.35f), bodyMat, false, "Carroceria");
            NKRes.Prim(PrimitiveType.Cube, transform, new Vector3(0, 1.2f, -.25f), new Vector3(1.82f, .72f, 2.15f), bodyMat, false, "Cabine");
            NKRes.Prim(PrimitiveType.Cube, transform, new Vector3(0, 1.22f, .84f), new Vector3(1.68f, .52f, .035f), glassMat, false, "Parabrisa");
            NKRes.Prim(PrimitiveType.Cube, transform, new Vector3(0, 1.22f, -1.34f), new Vector3(1.68f, .52f, .035f), glassMat, false, "Vidro_Traseiro");
            NKRes.Prim(PrimitiveType.Cube, transform, new Vector3(0, .91f, .015f), new Vector3(2.12f, .07f, 3.4f), trimMat, false, "Filete_Dourado");
            NKRes.Prim(PrimitiveType.Cube, transform, new Vector3(0, .46f, 2.12f), new Vector3(1.7f, .18f, .12f), trimMat, false, "Grade");
            foreach (float x in new[] { -1.04f, 1.04f })
                foreach (float z in new[] { -1.45f, 1.45f })
                {
                    var wheel = NKRes.Prim(PrimitiveType.Cylinder, transform, new Vector3(x, .38f, z), new Vector3(.42f, .16f, .42f), tireMat, false, "Roda");
                    wheel.transform.localRotation = Quaternion.Euler(0, 0, 90);
                    NKRes.Prim(PrimitiveType.Cylinder, wheel.transform, Vector3.zero, new Vector3(.19f, 1.04f, .19f), trimMat, false, "Cubo_Dourado");
                }
            NKRes.Prim(PrimitiveType.Cube, transform, new Vector3(-.72f, .85f, 2.2f), new Vector3(.35f, .18f, .06f), trimMat, false, "Farol_Esq");
            NKRes.Prim(PrimitiveType.Cube, transform, new Vector3(.72f, .85f, 2.2f), new Vector3(.35f, .18f, .06f), trimMat, false, "Farol_Dir");
            SetSkin(CosmeticInventory.EquippedFor("vehicle"));
        }
        public void SetSkin(string id)
        {
            if (bodyMat == null) return;
            bool imperial = id == "imperial_car";
            bodyMat.color = imperial ? new Color(.52f, .035f, .075f) : new Color(.12f, .13f, .15f);
            trimMat.color = imperial ? new Color(.9f, .67f, .24f) : new Color(.78f, .56f, .2f);
        }
    }
}
