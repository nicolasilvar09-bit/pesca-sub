using UnityEngine;

namespace NK
{
    /// <summary>
    /// Câmera em 1ª e 3ª pessoa (10_player.js): 3ª pessoa por cima do ombro direito a ~3 m, segue o corpo com leve
    /// atraso, afasta um pouco correndo e olhando para baixo, encosta na parede na hora e volta devagar.
    /// 1ª pessoa no olho, com balanço dos passos, respiração e afundar ao aterrissar. MIRA leva a câmera ao olho
    /// (também em 3ª pessoa, como no PUBG). Campo de visão medido na horizontal (padrão 90).
    /// </summary>
    [DefaultExecutionOrder(100)]
    public class PlayerCamera : MonoBehaviour
    {
        public PlayerMotor motor;
        public HumanoidRig rig;
        public ViewModel viewModel;
        public bool firstPerson;
        public float hFov = 90f, adsHFov = 62f;

        Camera cam;
        Vector3 piv; bool hasPiv;
        float camDist = 3f;
        float bob, eyeY;
        float adsK; // 0..1
        public float Kick; // recuo visual (graus)

        public Camera Cam => cam;

        void Awake()
        {
            cam = GetComponent<Camera>();
            cam.nearClipPlane = 0.03f;
            cam.farClipPlane = 1500f;
        }

        static float VFov(float h, float aspect) => 2f * Mathf.Atan(Mathf.Tan(h * 0.5f * Mathf.Deg2Rad) / aspect) * Mathf.Rad2Deg;

        void LateUpdate()
        {
            if (motor == null) return;
            float dt = Time.deltaTime;
            if (NKInput.ViewPressed) firstPerson = !firstPerson;
            adsK = Mathf.MoveTowards(adsK, motor.ads ? 1f : 0f, dt * 6f);
            bool fpp = firstPerson || adsK > 0.5f;
            Kick = Mathf.Lerp(Kick, 0, 1 - Mathf.Exp(-dt * 14f));

            Quaternion rot = Quaternion.Euler(-(motor.pitch + Kick), motor.yaw, 0);
            Vector3 dir = rot * Vector3.forward;
            Vector3 feet = motor.transform.position;
            float sp = motor.HVel.magnitude;

            // ---------- olho (1ª pessoa) ----------
            Vector3 eye = feet + Vector3.up * motor.EyeHeight;
            if (motor.ProneBlend > 0.5f) eye += motor.Forward * (0.75f * motor.ProneBlend); // deitado o olho fica à frente do quadril
            if (Mathf.Abs(eyeY - eye.y) > 2f) eyeY = eye.y;
            eyeY = Mathf.Lerp(eyeY, eye.y, 1 - Mathf.Exp(-dt * 14f));
            bool moving = motor.Grounded && sp > 0.5f;
            if (moving) bob += dt * sp * 2.1f;
            float bk = Mathf.Clamp01(sp / 5f) * (1 - adsK * 0.8f);
            float breath = Mathf.Sin(Time.time * 1.6f) * 0.004f;
            Vector3 fpPos = new Vector3(eye.x, eyeY, eye.z) + motor.Forward * 0.12f
                            + Vector3.up * (Mathf.Abs(Mathf.Sin(bob)) * 0.03f * bk + breath - motor.LandDip * 0.11f)
                            + motor.Right * (Mathf.Sin(bob) * 0.015f * bk);

            // ---------- 3ª pessoa ----------
            bool sprint = motor.Sprinting;
            float dist = motor.stance == Stance.Prone ? 2.6f : sprint ? 3.25f : 3.0f;
            if (motor.pitch < -23f) dist *= 1 + (-motor.pitch * Mathf.Deg2Rad - 0.4f) * 0.35f;
            float ty = motor.stance == Stance.Prone ? 0.85f : motor.stance == Stance.Crouch ? 1.35f : 1.72f;
            Vector3 head = feet + Vector3.up * Mathf.Min(ty, motor.Height + 0.1f);
            Vector3 shoulder = head + motor.Right * 0.72f + Vector3.down * (motor.LandDip * 0.16f);
            // o ombro não pode atravessar parede
            if (Physics.SphereCast(head, 0.15f, motor.Right, out var sh, 0.72f, NKRes.ShotMask, QueryTriggerInteraction.Ignore))
                shoulder = head + motor.Right * Mathf.Max(0, sh.distance - 0.05f);
            if (!hasPiv || (piv - shoulder).sqrMagnitude > 16f) { piv = shoulder; hasPiv = true; camDist = dist; }
            float kh = 1 - Mathf.Exp(-dt * 26f), kv = 1 - Mathf.Exp(-dt * 9f);
            piv.x = Mathf.Lerp(piv.x, shoulder.x, kh);
            piv.z = Mathf.Lerp(piv.z, shoulder.z, kh);
            piv.y = Mathf.Lerp(piv.y, shoulder.y, kv);
            float d = dist;
            if (Physics.SphereCast(piv, 0.2f, -dir, out var hit, dist + 0.3f, NKRes.ShotMask, QueryTriggerInteraction.Ignore))
                d = Mathf.Max(0.3f, hit.distance - 0.1f);
            camDist = d < camDist ? d : Mathf.Min(d, camDist + dt * 3.5f); // encosta na hora, volta devagar
            Vector3 tpPos = piv - dir * camDist;
            if (sprint) tpPos.y += Mathf.Sin(Time.time * 11f) * 0.012f;
            if (Physics.Raycast(tpPos + Vector3.up * 50f, Vector3.down, out var gh, 50.3f, NKRes.ShotMask) && tpPos.y < gh.point.y + 0.3f)
                tpPos.y = gh.point.y + 0.3f;

            // ---------- mistura ----------
            Vector3 pos;
            if (firstPerson) pos = fpPos;
            else pos = Vector3.Lerp(tpPos, fpPos, Mathf.SmoothStep(0, 1, adsK));
            transform.SetPositionAndRotation(pos, rot * Quaternion.Euler(0, 0, -Mathf.Sin(bob * 0.5f) * 0.25f * bk));

            float h = Mathf.Lerp(hFov, adsHFov, adsK);
            cam.fieldOfView = VFov(h, cam.aspect);

            if (rig != null) rig.SetShadowOnly(fpp);
            if (viewModel != null) viewModel.SetVisible(fpp);
            if (TouchControls.I != null) { TouchControls.I.FirstPerson = firstPerson; TouchControls.I.AdsActive = motor.ads; }
        }
    }
}
