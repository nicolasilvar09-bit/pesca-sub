using UnityEngine;
using UnityEngine.Rendering;

namespace NK
{
    /// <summary>
    /// Arma e braços em 1ª pessoa (presos à câmera): arma com peso (atrasa ao virar), balança com os passos,
    /// abaixa correndo, fica mais baixa agachado/deitado, coice com mola e mira que desliza até o olho.
    /// </summary>
    public class ViewModel : MonoBehaviour
    {
        public PlayerMotor motor;
        public Transform Muzzle { get; private set; }
        Transform root;
        Renderer[] rends;
        bool visible = true;
        float swx, swy, lastYaw, lastPitch, bob, recoil, recoilV, runK, adsK;

        public void Build()
        {
            root = new GameObject("VM").transform;
            root.SetParent(transform, false);
            Muzzle = GunModel.Build(root, 1f);
            var sleeve = NKRes.Lit(new Color(0.3f, 0.33f, 0.22f), 0.15f);
            var glove = NKRes.Lit(new Color(0.08f, 0.08f, 0.08f), 0.3f);
            // antebraço direito (punho) e esquerdo (guarda-mão)
            var r = NKRes.Prim(PrimitiveType.Capsule, root, new Vector3(0.06f, -0.12f, -0.2f), new Vector3(0.07f, 0.17f, 0.07f), sleeve);
            r.transform.localRotation = Quaternion.Euler(70, -15, 0);
            NKRes.Prim(PrimitiveType.Sphere, root, new Vector3(0.0f, -0.075f, -0.06f), new Vector3(0.065f, 0.075f, 0.09f), glove);
            var l = NKRes.Prim(PrimitiveType.Capsule, root, new Vector3(-0.1f, -0.1f, 0.08f), new Vector3(0.07f, 0.2f, 0.07f), sleeve);
            l.transform.localRotation = Quaternion.Euler(65, 35, 0);
            NKRes.Prim(PrimitiveType.Sphere, root, new Vector3(-0.025f, -0.045f, 0.25f), new Vector3(0.07f, 0.07f, 0.1f), glove);
            rends = root.GetComponentsInChildren<Renderer>();
            foreach (var x in rends) x.shadowCastingMode = ShadowCastingMode.Off;
            NKRes.SetLayerRecursive(root.gameObject, NKRes.PlayerLayer);
        }

        /// <summary>Aplica o mesmo acabamento do rifle no modelo em primeira pessoa.</summary>
        public void ApplyWeaponSkin(string id)
        {
            if (root != null) ImperialWeaponVisual.Apply(root, id == "imperial_rifle");
        }

        public void SetVisible(bool v)
        {
            if (v == visible || rends == null) return;
            visible = v;
            foreach (var x in rends) x.enabled = v;
        }

        public void Kick(float k) { recoilV += k; }

        void LateUpdate()
        {
            if (motor == null || root == null) return;
            float dt = Mathf.Max(Time.deltaTime, 1e-4f);
            float dyaw = Mathf.DeltaAngle(lastYaw, motor.yaw), dp = motor.pitch - lastPitch;
            lastYaw = motor.yaw; lastPitch = motor.pitch;
            // atraso ao virar (peso)
            swx = Mathf.Lerp(swx, Mathf.Clamp(-dyaw / dt * 0.0006f, -0.03f, 0.03f), 1 - Mathf.Exp(-dt * 10f));
            swy = Mathf.Lerp(swy, Mathf.Clamp(-dp / dt * 0.0006f, -0.03f, 0.03f), 1 - Mathf.Exp(-dt * 10f));
            float sp = motor.HVel.magnitude;
            if (motor.Grounded) bob += dt * sp * 2.1f;
            float bk = Mathf.Clamp01(sp / 5f);
            runK = Mathf.Lerp(runK, motor.Sprinting ? 1 : 0, 1 - Mathf.Exp(-dt * 8f));
            adsK = Mathf.MoveTowards(adsK, motor.ads ? 1 : 0, dt * 6f);
            // mola do coice
            recoilV += (-recoil * 180f - recoilV * 18f) * dt;
            recoil += recoilV * dt;

            float st = motor.StanceBlend;
            float k = 1 - adsK;
            Vector3 hip = new Vector3(0.16f + swx - runK * 0.05f, -0.15f + swy - runK * 0.05f - st * 0.025f, 0.32f);
            Vector3 aim = new Vector3(0f, -0.088f, 0.22f); // lente do red dot no centro da tela no centro da tela
            Vector3 p = Vector3.Lerp(aim, hip, k);
            p.x += Mathf.Sin(bob) * 0.012f * bk * (0.3f + 0.7f * k);
            p.y += Mathf.Abs(Mathf.Cos(bob)) * 0.01f * bk * (0.3f + 0.7f * k) + Mathf.Sin(Time.time * 1.6f) * 0.002f;
            p.z -= recoil;
            root.localPosition = p;
            root.localRotation = Quaternion.Euler(-recoil * 60f + runK * 25f, -runK * 35f * k, runK * 10f);
        }
    }
}
