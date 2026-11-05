using UnityEngine;
using UnityEngine.Rendering;

namespace NK
{
    /// <summary>
    /// Boneco humano feito por código (primitivas) com animação procedural: parado (respiração), andar/correr com
    /// pernas que viram para onde anda, agachar, deitar (rastejar), pulo com pernas encolhidas, tronco e cabeça
    /// seguindo a mira, arma nas mãos. Provisório até trocarmos pelos avatares Rocketbox (MIT) com Animator.
    /// </summary>
    public class HumanoidRig : MonoBehaviour
    {
        public PlayerMotor motor;
        public Transform Muzzle { get; private set; }
        public Transform GunRoot { get; private set; }

        Transform body, hips, spine, neck, head;
        Transform shL, shR, elL, elR, hipL, hipR, knL, knR;
        Renderer[] rends;
        Material shirtMat, vestMat;
        GameObject imperialHelmet;
        float walkPhase, bodyYaw, breathe, recoil;
        bool shadowOnly;

        public Color shirt = new Color(0.33f, 0.36f, 0.24f), pants = new Color(0.2f, 0.22f, 0.2f), skin = new Color(0.78f, 0.58f, 0.45f), boots = new Color(0.09f, 0.08f, 0.07f);

        static Transform Pivot(string n, Transform parent, Vector3 lpos)
        {
            var g = new GameObject(n).transform;
            g.SetParent(parent, false);
            g.localPosition = lpos;
            return g;
        }

        public void Build()
        {
            var mShirt = NKRes.Lit(shirt, 0.15f);
            shirtMat = mShirt;
            var mPants = NKRes.Lit(pants, 0.15f);
            var mSkin = NKRes.Lit(skin, 0.3f);
            var mBoot = NKRes.Lit(boots, 0.35f);
            var mVest = NKRes.Lit(new Color(0.24f, 0.25f, 0.18f), 0.1f);
            vestMat = mVest;
            var mHair = NKRes.Lit(new Color(0.1f, 0.07f, 0.05f), 0.2f);

            body = Pivot("Body", transform, Vector3.zero);
            hips = Pivot("Hips", body, new Vector3(0, 0.95f, 0));
            NKRes.Prim(PrimitiveType.Cube, hips, new Vector3(0, 0.0f, 0), new Vector3(0.34f, 0.16f, 0.2f), mPants);
            spine = Pivot("Spine", hips, new Vector3(0, 0.06f, 0));
            NKRes.Prim(PrimitiveType.Cube, spine, new Vector3(0, 0.27f, 0), new Vector3(0.38f, 0.52f, 0.21f), mShirt);
            NKRes.Prim(PrimitiveType.Cube, spine, new Vector3(0, 0.3f, 0.01f), new Vector3(0.4f, 0.36f, 0.25f), mVest); // colete
            neck = Pivot("Neck", spine, new Vector3(0, 0.55f, 0));
            NKRes.Prim(PrimitiveType.Cylinder, neck, new Vector3(0, 0.04f, 0), new Vector3(0.1f, 0.05f, 0.1f), mSkin);
            head = Pivot("Head", neck, new Vector3(0, 0.08f, 0));
            NKRes.Prim(PrimitiveType.Sphere, head, new Vector3(0, 0.11f, 0.01f), new Vector3(0.21f, 0.25f, 0.23f), mSkin);
            NKRes.Prim(PrimitiveType.Sphere, head, new Vector3(0, 0.16f, -0.01f), new Vector3(0.22f, 0.17f, 0.23f), mHair);

            // pernas
            hipL = Pivot("HipL", hips, new Vector3(-0.1f, -0.04f, 0));
            hipR = Pivot("HipR", hips, new Vector3(0.1f, -0.04f, 0));
            foreach (var h in new[] { hipL, hipR })
            {
                NKRes.Prim(PrimitiveType.Capsule, h, new Vector3(0, -0.22f, 0), new Vector3(0.15f, 0.25f, 0.15f), mPants);
                var kn = Pivot("Knee", h, new Vector3(0, -0.44f, 0));
                NKRes.Prim(PrimitiveType.Capsule, kn, new Vector3(0, -0.21f, 0), new Vector3(0.12f, 0.23f, 0.12f), mPants);
                NKRes.Prim(PrimitiveType.Cube, kn, new Vector3(0, -0.43f, 0.05f), new Vector3(0.11f, 0.08f, 0.26f), mBoot);
                if (h == hipL) knL = kn; else knR = kn;
            }
            // braços
            shL = Pivot("ShL", spine, new Vector3(-0.23f, 0.48f, 0));
            shR = Pivot("ShR", spine, new Vector3(0.23f, 0.48f, 0));
            foreach (var s in new[] { shL, shR })
            {
                NKRes.Prim(PrimitiveType.Capsule, s, new Vector3(0, -0.15f, 0), new Vector3(0.11f, 0.17f, 0.11f), mShirt);
                var el = Pivot("Elbow", s, new Vector3(0, -0.29f, 0));
                NKRes.Prim(PrimitiveType.Capsule, el, new Vector3(0, -0.13f, 0), new Vector3(0.09f, 0.15f, 0.09f), mShirt);
                NKRes.Prim(PrimitiveType.Sphere, el, new Vector3(0, -0.29f, 0), new Vector3(0.09f, 0.1f, 0.09f), mSkin);
                if (s == shL) elL = el; else elR = el;
            }

            // arma (no tronco, segue a mira)
            GunRoot = Pivot("Gun", spine, new Vector3(0.1f, 0.36f, 0.32f));
            Muzzle = GunModel.Build(GunRoot, 1f);

            rends = GetComponentsInChildren<Renderer>();
            ApplyCosmetic(CosmeticInventory.Equipped);
            NKRes.SetLayerRecursive(gameObject, NKRes.PlayerLayer);
        }


        /// <summary>Compatibilidade com o inventário antigo.</summary>
        public void ApplyCosmetic(string id) { ApplyCosmetics(string.IsNullOrEmpty(id) ? new string[0] : new[] { id }); }

        /// <summary>Aplica simultaneamente traje, capacete e acabamento da arma.</summary>
        public void ApplyCosmetics(string[] ids)
        {
            if (shirtMat == null || vestMat == null) return;
            bool outfit = false, helmet = false, rifle = false;
            if (ids != null) foreach (string id in ids)
            {
                if (id == "imperial_outfit") outfit = true;
                if (id == "imperial_helmet") helmet = true;
                if (id == "imperial_rifle") rifle = true;
            }
            shirtMat.color = outfit ? new Color(.16f, .025f, .045f) : shirt;
            vestMat.color = outfit ? new Color(.72f, .48f, .16f) : new Color(.24f, .25f, .18f);
            if (imperialHelmet != null) Destroy(imperialHelmet);
            if (helmet && head != null)
            {
                Material hm = NKRes.Lit(new Color(.58f, .075f, .11f), .72f, .35f);
                imperialHelmet = NKRes.Prim(PrimitiveType.Sphere, head, new Vector3(0, .27f, 0), new Vector3(.27f, .18f, .27f), hm, false, "Capacete_Coroa_Imperial");
                NKRes.Prim(PrimitiveType.Cube, imperialHelmet.transform, new Vector3(0, -.12f, .72f), new Vector3(.22f, .045f, .12f), NKRes.Lit(new Color(.78f, .57f, .22f), .8f, .7f));
            }
            ImperialWeaponVisual.Apply(GunRoot, rifle);
        }

        /// <summary>Em 1ª pessoa o corpo fica invisível mas continua fazendo sombra.</summary>
        public void SetShadowOnly(bool on)
        {
            if (shadowOnly == on || rends == null) return;
            shadowOnly = on;
            foreach (var r in rends) r.shadowCastingMode = on ? ShadowCastingMode.ShadowsOnly : ShadowCastingMode.On;
        }

        public void Kick() { recoil = 1f; }

        static float Damp(float a, float b, float rate, float dt) => Mathf.Lerp(a, b, 1 - Mathf.Exp(-rate * dt));

        void LateUpdate()
        {
            if (motor == null || body == null) return;
            float dt = Time.deltaTime;
            Vector3 hv = motor.HVel;
            float sp = hv.magnitude;
            float c = motor.CrouchBlend, p = motor.ProneBlend;
            bool air = !motor.Grounded;
            recoil = Mathf.MoveTowards(recoil, 0, dt * 7f);
            breathe += dt * 1.6f;

            // ---- direção do corpo: segue a mira; parado, o tronco gira até ~60° antes dos pés acompanharem ----
            float aimYaw = motor.yaw;
            float diff = Mathf.DeltaAngle(bodyYaw, aimYaw);
            if (sp > 0.4f || p > 0.5f) bodyYaw = Mathf.MoveTowardsAngle(bodyYaw, aimYaw, dt * 540f);
            else if (Mathf.Abs(diff) > 60f) bodyYaw = Mathf.MoveTowardsAngle(bodyYaw, aimYaw - Mathf.Sign(diff) * 55f, dt * 360f);
            transform.rotation = Quaternion.Euler(0, bodyYaw, 0);
            float twist = Mathf.DeltaAngle(bodyYaw, aimYaw);

            // movimento no espaço do corpo (para pernas de lado / de ré)
            Vector3 lv = Quaternion.Euler(0, -bodyYaw, 0) * hv;
            float back = lv.z < -0.3f ? -1f : 1f;
            float legYaw = sp > 0.5f ? Mathf.Clamp(Mathf.Atan2(lv.x, Mathf.Abs(lv.z)) * Mathf.Rad2Deg, -60, 60) : 0;

            walkPhase += dt * sp * (p > 0.5f ? 2.5f : 1.9f) * back;
            float stride = Mathf.Clamp01(sp / 5f) * (1 - p);
            float run = Mathf.Clamp01((sp - 5f) / 1.4f);
            float sw = Mathf.Sin(walkPhase * 2.2f);

            // ---- quadril / tronco ----
            float hipY = 0.95f - c * 0.36f - motor.LandDip * 0.12f + Mathf.Abs(Mathf.Cos(walkPhase * 2.2f)) * 0.03f * stride;
            hips.localPosition = new Vector3(0, hipY, 0);
            hips.localRotation = Quaternion.Euler(0, legYaw * 0.5f, 0);

            float lean = c * 18f + run * 10f + stride * 3f;
            float aimPitch = motor.pitch;
            float spinePitch = lean - aimPitch * 0.45f * (1 - p);
            spine.localRotation = Quaternion.Euler(spinePitch, twist * 0.6f - legYaw * 0.5f, 0) * Quaternion.Euler(Mathf.Sin(breathe) * 0.8f, 0, 0);
            neck.localRotation = Quaternion.Euler(-aimPitch * 0.4f * (1 - p) - lean * 0.6f - p * 70f, twist * 0.35f, 0);

            // ---- deitado: corpo inteiro gira 90° para frente em volta do quadril ----
            // (gira em volta dos pés; depois recua 0,9 m para o centro do corpo ficar no centro da cápsula e sobe a espessura do peito)
            body.localRotation = Quaternion.Euler(p * 88f, 0, 0);
            body.localPosition = new Vector3(0, p * 0.14f, -p * 0.9f);

            // ---- pernas ----
            float thighSwing = sw * (28f + run * 14f) * stride;
            float kneeL = Mathf.Max(0, Mathf.Sin(walkPhase * 2.2f + 1.3f)) * (40f + run * 30f) * stride;
            float kneeR = Mathf.Max(0, Mathf.Sin(walkPhase * 2.2f + 1.3f + Mathf.PI)) * (40f + run * 30f) * stride;
            // agachado: coxas para frente, joelhos dobrados
            float cThigh = -70f * c, cKnee = 98f * c;
            float airTuck = air ? 1f : 0f;
            float crawl = Mathf.Sin(walkPhase * 2.5f) * 12f * Mathf.Clamp01(sp) * p;
            hipL.localRotation = Quaternion.Euler(-thighSwing + cThigh - airTuck * 35f + crawl, 0, -2f);
            hipR.localRotation = Quaternion.Euler(thighSwing + cThigh * 0.75f - airTuck * 20f - crawl, 0, 2f);
            knL.localRotation = Quaternion.Euler(kneeL + cKnee + airTuck * 60f + Mathf.Abs(crawl), 0, 0);
            knR.localRotation = Quaternion.Euler(kneeR + cKnee * 0.9f + airTuck * 40f, 0, 0);

            // ---- braços segurando a arma (arma acompanha a mira) ----
            // em pé a arma aponta para +Z do tronco; deitado o tronco está na horizontal e a arma aponta para +Y do tronco (-88°)
            float gunPitch = Mathf.Lerp(-aimPitch * 0.55f, -88f - aimPitch * 0.3f, p);
            float lower = run * 35f; // arma baixa ao correr
            GunRoot.localRotation = Quaternion.Euler(gunPitch + lower, 0, 0);
            GunRoot.localPosition = Vector3.Lerp(new Vector3(0.1f, 0.36f, 0.32f), new Vector3(0.1f, 0.72f, 0.06f), p) - GunRoot.localRotation * Vector3.forward * (recoil * 0.05f);
            float armP = Mathf.Lerp(-70f - aimPitch * 0.4f + lower * 0.8f, -160f, p);
            shR.localRotation = Quaternion.Euler(armP + recoil * 6f, 0, 18f * (1 - p));
            elR.localRotation = Quaternion.Euler(Mathf.Lerp(-55f, -20f, p), 0, -10f);
            shL.localRotation = Quaternion.Euler(armP - 12f * (1 - p), 0, -38f * (1 - p) - 8f);
            elL.localRotation = Quaternion.Euler(Mathf.Lerp(-30f, -15f, p), 0, 30f * (1 - p));
        }
    }

    /// <summary>Fuzil genérico estilo M416 feito com primitivas. Retorna o transform da boca do cano.</summary>
    public static class GunModel
    {
        public static Transform Build(Transform parent, float scale)
        {
            var metal = NKRes.Lit(new Color(0.12f, 0.12f, 0.13f), 0.55f, 0.6f);
            var poly = NKRes.Lit(new Color(0.18f, 0.18f, 0.17f), 0.25f);
            var root = new GameObject("Rifle").transform;
            root.SetParent(parent, false);
            root.localScale = Vector3.one * scale;
            NKRes.Prim(PrimitiveType.Cube, root, new Vector3(0, 0, 0.05f), new Vector3(0.055f, 0.085f, 0.42f), metal);   // corpo
            NKRes.Prim(PrimitiveType.Cube, root, new Vector3(0, 0.055f, 0.08f), new Vector3(0.03f, 0.022f, 0.36f), metal); // trilho
            var barrel = NKRes.Prim(PrimitiveType.Cylinder, root, new Vector3(0, 0.012f, 0.42f), new Vector3(0.022f, 0.17f, 0.022f), metal);
            barrel.transform.localRotation = Quaternion.Euler(90, 0, 0);
            NKRes.Prim(PrimitiveType.Cube, root, new Vector3(0, 0.0f, 0.27f), new Vector3(0.06f, 0.07f, 0.2f), poly);     // guarda-mão
            var mag = NKRes.Prim(PrimitiveType.Cube, root, new Vector3(0, -0.1f, 0.1f), new Vector3(0.035f, 0.16f, 0.07f), poly);
            mag.transform.localRotation = Quaternion.Euler(-12, 0, 0);
            var grip = NKRes.Prim(PrimitiveType.Cube, root, new Vector3(0, -0.08f, -0.06f), new Vector3(0.035f, 0.11f, 0.05f), poly);
            grip.transform.localRotation = Quaternion.Euler(18, 0, 0);
            NKRes.Prim(PrimitiveType.Cube, root, new Vector3(0, -0.01f, -0.25f), new Vector3(0.045f, 0.09f, 0.2f), poly);   // coronha
            NKRes.Prim(PrimitiveType.Cube, root, new Vector3(0, 0.085f, 0.05f), new Vector3(0.035f, 0.04f, 0.07f), metal);  // red dot
            var lens = NKRes.Prim(PrimitiveType.Quad, root, new Vector3(0, 0.088f, 0.015f), new Vector3(0.026f, 0.026f, 1), NKRes.Lit(new Color(0.3f, 0.6f, 0.6f, 1), 0.95f));
            lens.transform.localRotation = Quaternion.Euler(0, 180, 0);
            var muzzle = new GameObject("Muzzle").transform;
            muzzle.SetParent(root, false);
            muzzle.localPosition = new Vector3(0, 0.012f, 0.6f);
            return muzzle;
        }
    }
}
