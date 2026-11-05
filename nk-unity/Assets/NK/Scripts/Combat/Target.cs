using System;
using UnityEngine;

namespace NK
{
    /// <summary>Parte do alvo que recebe tiro (cabeça vale mais).</summary>
    public class TargetPart : MonoBehaviour
    {
        public Target owner;
        public float mult = 1f;
    }

    /// <summary>Boneco de treino: pisca ao levar tiro, cai com 100 de dano e levanta depois de 3 s.</summary>
    public class Target : MonoBehaviour
    {
        public static event Action<Target> Eliminated;
        public float hp = 100f;
        public int Kills { get; private set; }
        Transform pivot;
        Renderer[] rends;
        Material normal, flash;
        float flashT, downT = -1, fall;

        public static Target Create(Transform parent, Vector3 feet, float yawDeg, string name)
        {
            var g = new GameObject(name);
            g.transform.SetParent(parent, true);
            g.transform.SetPositionAndRotation(feet, Quaternion.Euler(0, yawDeg, 0));
            var t = g.AddComponent<Target>();
            t.Build();
            return t;
        }

        void Build()
        {
            normal = NKRes.Lit(new Color(0.85f, 0.83f, 0.78f), 0.2f);
            flash = NKRes.Lit(new Color(1f, 0.25f, 0.2f), 0.2f);
            var post = NKRes.Lit(new Color(0.35f, 0.25f, 0.15f), 0.1f);
            NKRes.Prim(PrimitiveType.Cube, transform, new Vector3(0, 0.05f, 0), new Vector3(0.8f, 0.1f, 0.5f), post, true);
            pivot = new GameObject("Pivot").transform;
            pivot.SetParent(transform, false);
            pivot.localPosition = new Vector3(0, 0.1f, 0);
            Part(PrimitiveType.Capsule, new Vector3(0, 0.45f, 0), new Vector3(0.28f, 0.45f, 0.28f), 0.8f);   // pernas
            Part(PrimitiveType.Cube, new Vector3(0, 1.15f, 0), new Vector3(0.46f, 0.6f, 0.24f), 1f);         // tronco
            Part(PrimitiveType.Sphere, new Vector3(0, 1.62f, 0), new Vector3(0.24f, 0.27f, 0.24f), 2.35f);   // cabeça
            var stripe = NKRes.Lit(new Color(0.8f, 0.1f, 0.1f), 0.2f);
            NKRes.Prim(PrimitiveType.Cube, pivot, new Vector3(0, 1.15f, 0.125f), new Vector3(0.2f, 0.2f, 0.01f), stripe);
            rends = pivot.GetComponentsInChildren<Renderer>();
        }

        void Part(PrimitiveType t, Vector3 p, Vector3 s, float mult)
        {
            var g = NKRes.Prim(t, pivot, p, s, normal, true);
            var tp = g.AddComponent<TargetPart>();
            tp.owner = this; tp.mult = mult;
        }

        /// <summary>Retorna true se o tiro derrubou.</summary>
        public bool Hit(float dmg, Vector3 point, Vector3 dir)
        {
            if (downT > 0) return false;
            hp -= dmg;
            flashT = 0.08f;
            if (hp <= 0) { downT = 3f; Kills++; Eliminated?.Invoke(this); return true; }
            return false;
        }

        void Update()
        {
            flashT -= Time.deltaTime;
            bool f = flashT > 0;
            for (int i = 0; i < 3 && i < rends.Length; i++) rends[i].sharedMaterial = f ? flash : normal;

            if (downT > 0)
            {
                downT -= Time.deltaTime;
                fall = Mathf.MoveTowards(fall, 1, Time.deltaTime * 4f);
                if (downT <= 0) hp = 100f;
            }
            else fall = Mathf.MoveTowards(fall, 0, Time.deltaTime * 2f);
            pivot.localRotation = Quaternion.Euler(-85f * Mathf.SmoothStep(0, 1, fall), 0, 0);
        }
    }
}
