using System.Collections.Generic;
using UnityEngine;

namespace NK
{
    /// <summary>
    /// Tiro provisório da etapa 1 (tiro instantâneo do centro da tela, estilo M416: 700 tiros/min, pente 30).
    /// A balística de verdade (velocidade da bala, queda, zeragem 100 m) entra na etapa de armas.
    /// Clarão no cano com luz, rastro, marca de bala, faísca, coice com mola, som gerado por código e marcador de acerto.
    /// </summary>
    public class SimpleGun : MonoBehaviour
    {
        public PlayerMotor motor;
        public PlayerCamera pcam;
        public HumanoidRig rig;
        public ViewModel vm;

        public int magSize = 30, mag = 30, reserve = 150;
        public float rpm = 700f, damage = 34f, reloadTime = 2.2f;
        public int ShotsFired { get; private set; }
        public int Hits { get; private set; }

        float nextShot, reloadEnd = -1;
        AudioSource audioSrc; AudioClip shotClip;
        Light flashLight; Transform flashQuad; float flashT;
        LineRenderer[] tracers = new LineRenderer[6]; float[] tracerT = new float[6]; int tracerI;
        readonly Queue<GameObject> marks = new Queue<GameObject>();
        Material markMat, sparkMat;

        public bool Reloading => reloadEnd > Time.time;

        void Start()
        {
            audioSrc = gameObject.AddComponent<AudioSource>();
            audioSrc.playOnAwake = false; audioSrc.spatialBlend = 0f; audioSrc.volume = 0.55f;
            shotClip = NKRes.GunshotClip();

            var fl = new GameObject("MuzzleLight");
            flashLight = fl.AddComponent<Light>();
            flashLight.type = LightType.Point; flashLight.range = 6f; flashLight.intensity = 0; flashLight.color = new Color(1f, 0.75f, 0.4f);
            flashLight.shadows = LightShadows.None;
            flashQuad = NKRes.Prim(PrimitiveType.Quad, null, Vector3.zero, Vector3.one * 0.25f, NKRes.Add(new Color(1f, 0.7f, 0.3f, 1f)), false, "Flash").transform;
            flashQuad.gameObject.SetActive(false);
            NKRes.SetLayerRecursive(flashQuad.gameObject, NKRes.PlayerLayer);

            var trMat = NKRes.Add(new Color(1f, 0.85f, 0.5f, 1f));
            for (int i = 0; i < tracers.Length; i++)
            {
                var g = new GameObject("Tracer" + i);
                var lr = g.AddComponent<LineRenderer>();
                lr.sharedMaterial = trMat; lr.widthMultiplier = 0.025f; lr.positionCount = 2; lr.enabled = false;
                lr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
                tracers[i] = lr;
            }
            markMat = NKRes.Unlit(new Color(0.05f, 0.05f, 0.05f, 1));
            sparkMat = NKRes.Add(new Color(1f, 0.8f, 0.4f, 1));
        }

        Transform CurrentMuzzle => (pcam != null && (pcam.firstPerson || motor.ads)) ? vm.Muzzle : rig.Muzzle;

        void Update()
        {
            float now = Time.time;
            if (NKInput.ReloadPressed) StartReload();
            if (reloadEnd > 0 && now >= reloadEnd)
            {
                int take = Mathf.Min(magSize - mag, reserve);
                mag += take; reserve -= take; reloadEnd = -1;
            }

            if (NKInput.Fire)
            {
                motor.FireSprintBlockUntil = now + 0.35f; // atirar interrompe a corrida
                NKInput.SprintLock = false;
                if (!Reloading && now >= nextShot && !motor.Sprinting)
                {
                    if (mag > 0) { Shoot(); nextShot = now + 60f / rpm; }
                    else { StartReload(); }
                }
            }

            // efeitos
            flashT -= Time.deltaTime;
            flashLight.intensity = flashT > 0 ? 6f : 0f;
            flashQuad.gameObject.SetActive(flashT > 0);
            for (int i = 0; i < tracers.Length; i++)
            {
                tracerT[i] -= Time.deltaTime;
                if (tracers[i].enabled && tracerT[i] <= 0) tracers[i].enabled = false;
            }

            if (TouchControls.I != null)
            {
                var tc = TouchControls.I;
                tc.ammoText.text = Reloading ? "RECARREGANDO..." : mag + " / " + reserve;
                float sp = motor.HVel.magnitude;
                tc.CrosshairSpread = 6f + sp * 3.2f + (motor.Grounded ? 0 : 25f) - motor.StanceBlend * 5f;
            }
        }

        void StartReload()
        {
            if (Reloading || mag >= magSize || reserve <= 0) return;
            reloadEnd = Time.time + reloadTime;
        }

        void Shoot()
        {
            mag--; ShotsFired++;
            var cam = pcam.Cam.transform;
            // dispersão (graus): menor mirando, agachado e deitado; maior andando e no ar
            float sp = motor.HVel.magnitude;
            float spread = (motor.ads ? 0.12f : 0.9f) + sp * 0.12f + (motor.Grounded ? 0 : 2.5f);
            spread *= 1f - motor.StanceBlend * 0.45f;
            Vector2 r = Random.insideUnitCircle * spread;
            Vector3 dir = Quaternion.AngleAxis(r.x, cam.up) * Quaternion.AngleAxis(r.y, cam.right) * cam.forward;
            // em 3ª pessoa começa o raio na altura do jogador (não acerta o que está entre a câmera e ele)
            Vector3 org = cam.position;
            float skip = Vector3.Dot(motor.transform.position + Vector3.up * motor.EyeHeight - org, cam.forward);
            if (skip > 0) org += dir * skip;

            Vector3 end = org + dir * 800f;
            if (Physics.Raycast(org, dir, out var hit, 800f, NKRes.ShotMask, QueryTriggerInteraction.Ignore))
            {
                end = hit.point;
                var part = hit.collider.GetComponent<TargetPart>();
                if (part != null && part.owner != null)
                {
                    bool kill = part.owner.Hit(damage * part.mult, hit.point, dir);
                    Hits++;
                    TouchControls.I?.ShowHit(kill);
                }
                else Mark(hit);
                Spark(hit.point, hit.normal);
            }

            Transform mz = CurrentMuzzle;
            Vector3 mpos = mz.position;
            var lr = tracers[tracerI = (tracerI + 1) % tracers.Length];
            lr.SetPosition(0, mpos + dir * 0.3f); lr.SetPosition(1, end); lr.enabled = true; tracerT[tracerI] = 0.04f;

            flashT = 0.045f;
            flashLight.transform.position = mpos;
            flashQuad.position = mpos + mz.forward * 0.05f;
            flashQuad.rotation = Quaternion.LookRotation(cam.position - flashQuad.position) * Quaternion.Euler(0, 0, Random.Range(0, 360f));
            flashQuad.localScale = Vector3.one * Random.Range(0.18f, 0.3f);

            audioSrc.pitch = Random.Range(0.94f, 1.06f);
            audioSrc.PlayOneShot(shotClip);

            // coice: sobe a mira e balança para o lado
            float k = motor.ads ? 0.55f : 0.8f;
            k *= motor.stance == Stance.Prone ? 0.55f : motor.stance == Stance.Crouch ? 0.78f : 1f;
            motor.pitch += k;
            motor.yaw += Random.Range(-0.3f, 0.3f) * k;
            pcam.Kick += 0.5f * k;
            rig.Kick();
            vm.Kick(0.6f);
        }

        void Mark(RaycastHit hit)
        {
            var g = marks.Count >= 60 ? marks.Dequeue() : NKRes.Prim(PrimitiveType.Quad, null, Vector3.zero, Vector3.one * 0.07f, markMat, false, "BulletMark");
            g.transform.position = hit.point + hit.normal * 0.005f;
            g.transform.rotation = Quaternion.LookRotation(-hit.normal);
            g.transform.SetParent(hit.collider.transform, true);
            marks.Enqueue(g);
        }

        void Spark(Vector3 p, Vector3 n)
        {
            for (int i = 0; i < 4; i++)
            {
                var s = NKRes.Prim(PrimitiveType.Cube, null, p, Vector3.one * 0.025f, sparkMat, false, "Spark");
                var fx = s.AddComponent<Spark>();
                fx.vel = (n + Random.insideUnitSphere * 0.8f).normalized * Random.Range(2f, 5f);
            }
        }
    }

    public class Spark : MonoBehaviour
    {
        public Vector3 vel; float life = 0.25f;
        void Update()
        {
            vel += Vector3.down * 9.81f * Time.deltaTime;
            transform.position += vel * Time.deltaTime;
            life -= Time.deltaTime;
            transform.localScale = Vector3.one * 0.025f * Mathf.Clamp01(life * 4);
            if (life <= 0) Destroy(gameObject);
        }
    }
}
