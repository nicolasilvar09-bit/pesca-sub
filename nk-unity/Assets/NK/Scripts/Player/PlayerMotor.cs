using UnityEngine;

namespace NK
{
    public enum Stance { Stand, Crouch, Prone }

    /// <summary>
    /// Movimento do jogador com os mesmos números da versão navegador (06_physics.js / 05_actor.js):
    /// andar 5,0 m/s, correr 6,4, agachado 2,7, deitado 1,1, mirando no máximo 2,9; acelera em ~0,3 s e freia um pouco
    /// mais rápido; mais lento subindo ladeira; pulo 5,3 m/s com gravidade 20; aterrissagem amortecida.
    /// Alturas: em pé 1,8 m (olho 1,62), agachado 1,25 (1,15), deitado 0,6 (0,4). Não levanta embaixo de algo baixo.
    /// O transform fica nos pés.
    /// </summary>
    [RequireComponent(typeof(CharacterController))]
    public class PlayerMotor : MonoBehaviour
    {
        public const float WalkSpeed = 5.0f, SprintSpeed = 6.4f, CrouchSpeed = 2.7f, ProneSpeed = 1.1f, AdsSpeed = 2.9f;
        public const float JumpVel = 5.3f, Gravity = 20f;

        public static float HeightOf(Stance s) => s == Stance.Prone ? 0.6f : s == Stance.Crouch ? 1.25f : 1.8f;
        public static float EyeOf(Stance s) => s == Stance.Prone ? 0.4f : s == Stance.Crouch ? 1.15f : 1.62f;

        [Header("Mira (graus)")]
        public float yaw, pitch; // pitch positivo = olhando para cima
        public Stance stance = Stance.Stand;
        public bool ads;

        public Vector3 HVel => hv;
        public float VVel => vy;
        public bool Grounded { get; private set; }
        public bool Sprinting { get; private set; }
        public float Height => curH;
        /// <summary>0 em pé, ~0,55 agachado, 1 deitado (suave, para animação e câmera).</summary>
        public float StanceBlend { get; private set; }
        public float CrouchBlend { get; private set; }
        public float ProneBlend { get; private set; }
        public float EyeHeight { get; private set; } = 1.62f;
        /// <summary>0..1, quanto a aterrissagem atual está afundando o corpo.</summary>
        public float LandDip { get; private set; }
        public float JumpPeak { get; private set; }
        public bool StandBlocked { get; private set; } // tentou levantar e havia teto baixo
        public float FireSprintBlockUntil;

        CharacterController cc;
        Vector3 hv; float vy;
        float curH = 1.8f;
        float airTopY; bool wasGrounded = true;
        float landAt = -99, landK;
        Vector3 groundNormal = Vector3.up;
        float jumpBaseY;

        void Awake()
        {
            cc = GetComponent<CharacterController>();
            cc.radius = 0.35f;
            cc.height = curH;
            cc.center = new Vector3(0, curH * 0.5f, 0);
            cc.stepOffset = 0.4f;
            cc.slopeLimit = 50f;
            cc.skinWidth = 0.04f;
            cc.minMoveDistance = 0f;
        }

        public void Teleport(Vector3 feet, float yawDeg)
        {
            cc.enabled = false;
            transform.position = feet;
            cc.enabled = true;
            hv = Vector3.zero; vy = 0; yaw = yawDeg;
        }

        public Vector3 Forward => Quaternion.Euler(0, yaw, 0) * Vector3.forward;
        public Vector3 Right => Quaternion.Euler(0, yaw, 0) * Vector3.right;
        public Quaternion AimRotation => Quaternion.Euler(-pitch, yaw, 0);

        void Update()
        {
            float dt = Mathf.Min(Time.deltaTime, 0.05f);

            // ---------------- olhar ----------------
            yaw += NKInput.Look.x * (ads ? 0.55f : 1f);
            float pMin = stance == Stance.Prone ? -35f : -80f, pMax = stance == Stance.Prone ? 45f : 80f;
            pitch = Mathf.Clamp(pitch + NKInput.Look.y * (ads ? 0.55f : 1f), pMin, pMax);
            yaw = Mathf.Repeat(yaw + 180f, 360f) - 180f;

            // ---------------- postura ----------------
            if (NKInput.CrouchPressed) SetStance(Stance.Crouch);
            if (NKInput.PronePressed) SetStance(Stance.Prone);
            if (NKInput.JumpPressed) TryJump();
            if (NKInput.AdsPressed) ads = !ads;

            // ---------------- velocidade desejada ----------------
            Vector2 m = Vector2.ClampMagnitude(NKInput.Move, 1f);
            bool sprint = (NKInput.Sprint || NKInput.SprintLock) && m.y > 0.6f && !ads && stance == Stance.Stand && Time.time > FireSprintBlockUntil;
            Sprinting = sprint && Grounded && hv.magnitude > 0.5f;
            float speed = stance == Stance.Prone ? ProneSpeed : stance == Stance.Crouch ? CrouchSpeed : sprint ? SprintSpeed : WalkSpeed;
            if (ads && stance != Stance.Prone) speed = Mathf.Min(speed, AdsSpeed);

            Vector3 wdir = Forward * m.y + Right * m.x; // comprimento 0..1
            float wl = wdir.magnitude;
            if (Grounded && wl > 0.05f)
            {
                Vector3 u = wdir / wl;
                // inclinação ao longo do movimento (subida positiva)
                float g = groundNormal.y > 0.1f ? -(groundNormal.x * u.x + groundNormal.z * u.z) / groundNormal.y : 0;
                if (g > 0.22f) speed *= Mathf.Clamp(1 - (g - 0.22f) * 0.85f, 0.45f, 1f);
                else if (g < -0.5f) speed *= 1.06f;
            }
            float lt = Time.time - landAt;
            if (lt < 0.45f) speed *= 1 - landK * 0.55f * (1 - lt / 0.45f);
            LandDip = lt < 0.45f ? landK * Mathf.Sin(Mathf.Clamp01(lt / 0.45f) * Mathf.PI) : 0f;

            Vector3 target = wdir * speed;
            float rate = !Grounded ? 1.6f : target.sqrMagnitude > hv.sqrMagnitude + 0.01f ? 8.5f : 11f;
            hv += (target - hv) * (1 - Mathf.Exp(-dt * rate));

            // ---------------- vertical ----------------
            if (Grounded && vy < 0) vy = -2f;
            vy -= Gravity * dt;

            // ---------------- altura da cápsula (transição suave) ----------------
            float wantH = HeightOf(stance);
            float prevH = curH;
            curH = Mathf.MoveTowards(curH, wantH, dt * (wantH > curH ? 3.2f : 4.5f));
            if (!Mathf.Approximately(prevH, curH))
            {
                cc.radius = curH < 0.8f ? 0.3f : 0.35f;
                cc.height = curH;
                cc.center = new Vector3(0, curH * 0.5f, 0);
                cc.stepOffset = Mathf.Min(0.4f, curH * 0.45f);
            }

            var flags = cc.Move((hv + Vector3.up * vy) * dt);
            bool grounded = (flags & CollisionFlags.Below) != 0 || cc.isGrounded;
            if ((flags & CollisionFlags.Above) != 0 && vy > 0) vy = 0;
            // velocidade real (para não acumular contra paredes)
            Grounded = grounded;

            if (!Grounded) airTopY = Mathf.Max(airTopY, transform.position.y);
            if (Grounded && !wasGrounded)
            {
                float drop = airTopY - transform.position.y;
                landK = Mathf.Clamp01((drop - 0.4f) / 3f);
                landAt = Time.time;
            }
            if (!Grounded) JumpPeak = Mathf.Max(JumpPeak, transform.position.y - jumpBaseY);
            else airTopY = transform.position.y;
            wasGrounded = Grounded;

            // normal do chão
            if (Physics.SphereCast(transform.position + Vector3.up * 0.5f, 0.25f, Vector3.down, out var gh, 0.8f, NKRes.ShotMask, QueryTriggerInteraction.Ignore))
                groundNormal = gh.normal;
            else groundNormal = Vector3.up;

            // misturas suaves para animação/câmera
            float sb = stance == Stance.Prone ? 1f : stance == Stance.Crouch ? 0.55f : 0f;
            StanceBlend = Mathf.Lerp(StanceBlend, sb, 1 - Mathf.Exp(-dt * 8f));
            CrouchBlend = Mathf.Lerp(CrouchBlend, stance == Stance.Crouch ? 1f : 0f, 1 - Mathf.Exp(-dt * 8f));
            ProneBlend = Mathf.Lerp(ProneBlend, stance == Stance.Prone ? 1f : 0f, 1 - Mathf.Exp(-dt * 6f));
            EyeHeight = Mathf.Lerp(EyeHeight, EyeOf(stance), 1 - Mathf.Exp(-dt * 10f));
        }

        public void TryJump()
        {
            if (!Grounded) return;
            if (stance != Stance.Stand) { SetStance(stance == Stance.Prone ? Stance.Crouch : Stance.Stand, true); return; }
            vy = JumpVel; Grounded = false;
            airTopY = jumpBaseY = transform.position.y; JumpPeak = 0;
        }

        /// <summary>Alterna a postura (apertar de novo volta a ficar em pé). Não levanta embaixo de teto baixo.</summary>
        public bool SetStance(Stance s, bool direct = false)
        {
            if (!direct && stance == s) s = Stance.Stand;
            if (HeightOf(s) > curH + 0.01f && !HasHeadroom(HeightOf(s)))
            {
                StandBlocked = true;
                // se não dá para ficar em pé, tenta agachar
                if (s == Stance.Stand && stance == Stance.Prone && HasHeadroom(HeightOf(Stance.Crouch))) { stance = Stance.Crouch; return true; }
                return false;
            }
            StandBlocked = false;
            stance = s;
            return true;
        }

        public bool HasHeadroom(float h)
        {
            float r = 0.3f;
            Vector3 a = transform.position + Vector3.up * (r + 0.05f);
            Vector3 b = transform.position + Vector3.up * (h - r);
            return !Physics.CheckCapsule(a, b, r, NKRes.ShotMask, QueryTriggerInteraction.Ignore);
        }
    }
}
