using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.EnhancedTouch;
using ETouch = UnityEngine.InputSystem.EnhancedTouch.Touch;

namespace NK
{
    /// <summary>
    /// Controles de toque do NK Mobile (celular deitado), no mesmo esquema da versão navegador:
    /// joystick à esquerda (empurre além do círculo para correr, arraste bem para cima para travar a corrida),
    /// arraste no lado direito para olhar, botões de tiro direito e esquerdo (arrastar o próprio botão mira),
    /// MIRA, PULAR, AGACHAR, DEITAR, RECARREGAR e 1P/3P.
    /// No computador/editor: o mouse funciona como um dedo; teclado WASD, Shift corre, Espaço pula, C agacha,
    /// Z deita, R recarrega, V 1ª/3ª pessoa, F atira, Q mira. Tab = modo mouse travado (clique esquerdo atira, direito mira).
    /// </summary>
    [DefaultExecutionOrder(-100)]
    public class TouchControls : MonoBehaviour
    {
        public static TouchControls I;
        public float lookSensitivity = 1f;   // graus por altura de tela * 140
        public float mouseLockSensitivity = 0.12f;

        Canvas canvas;
        RectTransform safeRoot;
        Rect lastSafe;

        // joystick
        RectTransform joyBase, joyKnob, joyZone;
        Image joyKnobImg, joyBaseImg;
        Text joyLabel;
        Vector2 joyHome; // posição de repouso (coordenadas do canvas dentro da área segura)
        int joyFinger = int.MinValue;
        Vector2 joyCenterScreen;

        class Btn
        {
            public RectTransform rt; public Image img; public Text label;
            public Color col; public int finger = int.MinValue; public bool held, pressed; public bool lookDrag;
            public Vector2 lastPos;
        }
        readonly List<Btn> buttons = new List<Btn>();
        Btn bFire, bFireL, bAds, bJump, bCrouch, bProne, bReload, bView;

        readonly Dictionary<int, Vector2> lookFingers = new Dictionary<int, Vector2>();
        const int MouseId = 9999;

        // HUD
        public Text infoText, ammoText, centerText;
        RectTransform[] crossBars = new RectTransform[4];
        Image hitMarker; float hitMarkerT;
        public float CrosshairSpread = 12f; // pixels de canvas
        public bool AdsActive, FirstPerson;
        bool mouseLock;

        void Awake()
        {
            I = this;
            EnhancedTouchSupport.Enable();
            BuildUI();
        }

        void OnDestroy()
        {
            if (EnhancedTouchSupport.enabled) EnhancedTouchSupport.Disable();
        }

        // ============================== UI ==============================
        void BuildUI()
        {
            var cg = new GameObject("NK_Canvas");
            cg.transform.SetParent(transform, false);
            canvas = cg.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 10;
            var sc = cg.AddComponent<CanvasScaler>();
            sc.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            sc.referenceResolution = new Vector2(1920, 1080);
            sc.matchWidthOrHeight = 1f;

            var sr = new GameObject("SafeArea", typeof(RectTransform));
            sr.transform.SetParent(cg.transform, false);
            safeRoot = (RectTransform)sr.transform;
            ApplySafeArea();

            // área do joystick (metade esquerda, parte de baixo)
            joyZone = NewRect("JoyZone", safeRoot, new Vector2(0, 0), new Vector2(0.42f, 0.78f), Vector2.zero, Vector2.zero);
            joyHome = new Vector2(300, 290);
            joyBase = Img("JoyBase", safeRoot, NKRes.Ring, new Color(1, 1, 1, 0.55f), new Vector2(0, 0), joyHome, new Vector2(300, 300), out joyBaseImg);
            Img("JoyFill", joyBase, NKRes.Disc, new Color(0, 0, 0, 0.18f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(290, 290), out _);
            joyKnob = Img("JoyKnob", joyBase, NKRes.Disc, new Color(1, 1, 1, 0.75f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(125, 125), out joyKnobImg);
            joyLabel = Label("JoyLabel", safeRoot, "", 28, new Vector2(0, 0), new Vector2(300, 490), new Vector2(420, 50), TextAnchor.MiddleCenter);

            Color red = new Color(0.86f, 0.12f, 0.12f, 0.8f), dark = new Color(0.08f, 0.08f, 0.1f, 0.55f);
            bFire = MakeBtn("ATIRAR", new Vector2(1, 0), new Vector2(-270, 310), 210, red, 30);
            bFireL = MakeBtn("ATIRAR", new Vector2(0, 0), new Vector2(240, 640), 150, red, 24);
            bAds = MakeBtn("MIRA", new Vector2(1, 0), new Vector2(-500, 230), 135, dark, 26);
            bJump = MakeBtn("PULAR", new Vector2(1, 0), new Vector2(-140, 540), 125, dark, 24);
            bCrouch = MakeBtn("AGACHAR", new Vector2(1, 0), new Vector2(-330, 105), 120, dark, 20);
            bProne = MakeBtn("DEITAR", new Vector2(1, 0), new Vector2(-150, 105), 120, dark, 22);
            bReload = MakeBtn("RECARR.", new Vector2(1, 0), new Vector2(-480, 430), 110, dark, 20);
            bView = MakeBtn("1P/3P", new Vector2(1, 1), new Vector2(-130, -130), 110, dark, 24);
            bFire.lookDrag = bFireL.lookDrag = true;

            // mira (cruz) no centro
            var center = NewRect("Cross", safeRoot, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, Vector2.zero);
            for (int i = 0; i < 4; i++)
            {
                bool vert = i < 2;
                crossBars[i] = Img("Bar" + i, center, null, new Color(1, 1, 1, 0.9f), new Vector2(0.5f, 0.5f), Vector2.zero,
                    vert ? new Vector2(4, 18) : new Vector2(18, 4), out _);
            }
            Img("Dot", center, NKRes.Disc, new Color(1, 1, 1, 0.9f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(6, 6), out _);
            var hm = Img("HitMarker", center, null, new Color(1, 1, 1, 0), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(30, 30), out hitMarker);
            hm.localRotation = Quaternion.Euler(0, 0, 45);

            infoText = Label("Info", safeRoot, "", 24, new Vector2(0, 1), new Vector2(330, -70), new Vector2(620, 120), TextAnchor.UpperLeft);
            ammoText = Label("Ammo", safeRoot, "30 / 120", 40, new Vector2(1, 0), new Vector2(-270, 460), new Vector2(300, 60), TextAnchor.MiddleCenter);
            centerText = Label("Center", safeRoot, "", 34, new Vector2(0.5f, 1), new Vector2(0, -90), new Vector2(900, 60), TextAnchor.MiddleCenter);
            var title = Label("Title", safeRoot, "NK MOBILE · terreno de teste", 26, new Vector2(0.5f, 1), new Vector2(0, -36), new Vector2(900, 44), TextAnchor.MiddleCenter);
            title.color = new Color(1, 0.85f, 0.85f, 0.9f);
        }

        Btn MakeBtn(string text, Vector2 anchor, Vector2 pos, float size, Color col, int font)
        {
            var b = new Btn { col = col };
            b.rt = Img("Btn_" + text, safeRoot, NKRes.Disc, col, anchor, pos, new Vector2(size, size), out b.img);
            Img("Rim", b.rt, NKRes.Ring, new Color(1, 1, 1, 0.45f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(size, size), out _);
            b.label = Label("L", b.rt, text, font, new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(size * 1.4f, size), TextAnchor.MiddleCenter);
            buttons.Add(b);
            return b;
        }

        static RectTransform NewRect(string name, Transform parent, Vector2 aMin, Vector2 aMax, Vector2 pos, Vector2 size)
        {
            var g = new GameObject(name, typeof(RectTransform));
            g.transform.SetParent(parent, false);
            var rt = (RectTransform)g.transform;
            rt.anchorMin = aMin; rt.anchorMax = aMax; rt.anchoredPosition = pos; rt.sizeDelta = size;
            return rt;
        }

        static RectTransform Img(string name, Transform parent, Sprite s, Color c, Vector2 anchor, Vector2 pos, Vector2 size, out Image img)
        {
            var rt = NewRect(name, parent, anchor, anchor, pos, size);
            img = rt.gameObject.AddComponent<Image>();
            img.sprite = s; img.color = c; img.raycastTarget = false;
            return rt;
        }

        static Font _font;
        static Font UIFont => _font ??= Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");

        static Text Label(string name, Transform parent, string s, int size, Vector2 anchor, Vector2 pos, Vector2 box, TextAnchor align)
        {
            var rt = NewRect(name, parent, anchor, anchor, pos, box);
            var t = rt.gameObject.AddComponent<Text>();
            t.font = UIFont; t.fontSize = size; t.text = s; t.alignment = align; t.color = Color.white;
            t.fontStyle = FontStyle.Bold; t.raycastTarget = false;
            t.horizontalOverflow = HorizontalWrapMode.Overflow; t.verticalOverflow = VerticalWrapMode.Overflow;
            var sh = rt.gameObject.AddComponent<Shadow>(); sh.effectColor = new Color(0, 0, 0, 0.7f); sh.effectDistance = new Vector2(2, -2);
            return t;
        }

        void ApplySafeArea()
        {
            var s = Screen.safeArea;
            if (s == lastSafe && safeRoot.anchorMax != Vector2.zero) return;
            lastSafe = s;
            safeRoot.anchorMin = new Vector2(s.xMin / Screen.width, s.yMin / Screen.height);
            safeRoot.anchorMax = new Vector2(s.xMax / Screen.width, s.yMax / Screen.height);
            safeRoot.offsetMin = safeRoot.offsetMax = Vector2.zero;
        }

        float CanvasScale => canvas.scaleFactor;

        // ============================== entrada ==============================
        struct Ptr { public int id; public Vector2 pos; public bool began, ended; }
        readonly List<Ptr> ptrs = new List<Ptr>();

        void GatherPointers()
        {
            ptrs.Clear();
            foreach (var t in ETouch.activeTouches)
            {
                var ph = t.phase;
                ptrs.Add(new Ptr
                {
                    id = t.touchId,
                    pos = t.screenPosition,
                    began = ph == UnityEngine.InputSystem.TouchPhase.Began,
                    ended = ph == UnityEngine.InputSystem.TouchPhase.Ended || ph == UnityEngine.InputSystem.TouchPhase.Canceled
                });
            }
            var m = Mouse.current;
            if (m != null && !mouseLock && ETouch.activeTouches.Count == 0)
            {
                var b = m.leftButton;
                if (b.isPressed || b.wasReleasedThisFrame)
                    ptrs.Add(new Ptr { id = MouseId, pos = m.position.ReadValue(), began = b.wasPressedThisFrame, ended = b.wasReleasedThisFrame });
            }
        }

        bool InCircle(RectTransform rt, Vector2 screen, float extra = 1.1f)
        {
            Vector2 c = rt.position; // overlay: posição do mundo = pixels da tela
            float r = rt.rect.width * 0.5f * rt.lossyScale.x * extra;
            return (screen - c).sqrMagnitude <= r * r;
        }

        void Update()
        {
            NKInput.ClearFrame();
            ApplySafeArea();
            GatherPointers();

            Vector2 move = Vector2.zero; bool sprint = false; bool fire = false; Vector2 look = Vector2.zero;
            float pxToDeg = 140f / Mathf.Max(1, Screen.height) * lookSensitivity;
            foreach (var b in buttons) b.pressed = false;

            foreach (var p in ptrs)
            {
                if (p.began)
                {
                    Btn hit = null;
                    foreach (var b in buttons) if (b.finger == int.MinValue && InCircle(b.rt, p.pos)) { hit = b; break; }
                    if (hit != null) { hit.finger = p.id; hit.held = true; hit.pressed = true; hit.lastPos = p.pos; }
                    else if (joyFinger == int.MinValue && RectTransformUtility.RectangleContainsScreenPoint(joyZone, p.pos, null))
                    {
                        joyFinger = p.id;
                        // joystick flutuante: se tocou fora do círculo, o círculo vem até o dedo
                        if (!InCircle(joyBase, p.pos, 1.0f))
                        {
                            RectTransformUtility.ScreenPointToLocalPointInRectangle(safeRoot, p.pos, null, out var lp);
                            joyBase.anchoredPosition = lp - safeRoot.rect.min; // âncora (0,0)
                        }
                        joyCenterScreen = joyBase.position;
                        NKInput.SprintLock = false;
                    }
                    else lookFingers[p.id] = p.pos;
                    continue;
                }

                if (p.id == joyFinger)
                {
                    float R = joyBase.rect.width * 0.5f * joyBase.lossyScale.x;
                    Vector2 d = (p.pos - joyCenterScreen) / R; // 1 = borda do círculo
                    float len = d.magnitude;
                    Vector2 m = len > 1 ? d / len : d;
                    move = m;
                    sprint = len > 1.3f && m.y > 0.55f;
                    if (d.y > 2.4f && Mathf.Abs(d.x) < 1.2f) NKInput.SprintLock = true; // trava de corrida
                    joyKnob.anchoredPosition = m * (joyBase.rect.width * 0.5f);
                    if (p.ended) { joyFinger = int.MinValue; joyKnob.anchoredPosition = Vector2.zero; joyBase.anchoredPosition = joyHome; }
                    continue;
                }

                bool owned = false;
                foreach (var b in buttons)
                {
                    if (b.finger != p.id) continue;
                    owned = true;
                    if (b.lookDrag) look += (p.pos - b.lastPos) * pxToDeg;
                    b.lastPos = p.pos;
                    if (p.ended) { b.finger = int.MinValue; b.held = false; }
                }
                if (owned) continue;

                if (lookFingers.TryGetValue(p.id, out var last))
                {
                    look += (p.pos - last) * pxToDeg;
                    if (p.ended) lookFingers.Remove(p.id); else lookFingers[p.id] = p.pos;
                }
            }
            // dedos que sumiram sem "ended" (por segurança)
            if (ptrs.Count == 0)
            {
                lookFingers.Clear();
                foreach (var b in buttons) { b.finger = int.MinValue; b.held = false; }
                if (joyFinger != int.MinValue) { joyFinger = int.MinValue; joyKnob.anchoredPosition = Vector2.zero; joyBase.anchoredPosition = joyHome; }
            }

            fire = bFire.held || bFireL.held;
            bool jump = bJump.pressed, crouch = bCrouch.pressed, prone = bProne.pressed, reload = bReload.pressed, view = bView.pressed, ads = bAds.pressed;

            // ---------------- teclado / mouse (teste no editor) ----------------
            var kb = Keyboard.current;
            if (kb != null)
            {
                Vector2 k = new Vector2((kb.dKey.isPressed ? 1 : 0) - (kb.aKey.isPressed ? 1 : 0), (kb.wKey.isPressed ? 1 : 0) - (kb.sKey.isPressed ? 1 : 0));
                if (k != Vector2.zero) { move = k.normalized; sprint = kb.leftShiftKey.isPressed && k.y > 0; }
                if (kb.spaceKey.wasPressedThisFrame) jump = true;
                if (kb.cKey.wasPressedThisFrame) crouch = true;
                if (kb.zKey.wasPressedThisFrame) prone = true;
                if (kb.rKey.wasPressedThisFrame) reload = true;
                if (kb.vKey.wasPressedThisFrame) view = true;
                if (kb.qKey.wasPressedThisFrame) ads = true;
                if (kb.fKey.isPressed) fire = true;
                if (kb.tabKey.wasPressedThisFrame) SetMouseLock(!mouseLock);
                if (kb.escapeKey.wasPressedThisFrame) SetMouseLock(false);
            }
            var mouse = Mouse.current;
            if (mouseLock && mouse != null)
            {
                look += mouse.delta.ReadValue() * mouseLockSensitivity;
                if (mouse.leftButton.isPressed) fire = true;
                if (mouse.rightButton.wasPressedThisFrame) ads = true;
            }

            // trava de corrida: continua correndo sem o dedo; mirar, atirar, agachar/deitar destravam
            if (NKInput.SprintLock)
            {
                if (fire || ads || crouch || prone || (joyFinger != int.MinValue && move.y < 0.2f)) NKInput.SprintLock = false;
                else if (joyFinger == int.MinValue && move == Vector2.zero) { move = Vector2.up; sprint = true; }
                else sprint = true;
            }

            if (!NKInput.Scripted)
            {
                NKInput.Move = move; NKInput.Sprint = sprint; NKInput.Fire = fire;
                NKInput.Look = new Vector2(look.x, look.y);
                NKInput.JumpPressed = jump; NKInput.CrouchPressed = crouch; NKInput.PronePressed = prone;
                NKInput.ReloadPressed = reload; NKInput.ViewPressed = view; NKInput.AdsPressed = ads;
            }
        }

        void SetMouseLock(bool on)
        {
            mouseLock = on;
            Cursor.lockState = on ? CursorLockMode.Locked : CursorLockMode.None;
            Cursor.visible = !on;
        }

        // ============================== visual ==============================
        void LateUpdate()
        {
            // joystick
            bool sprinting = NKInput.Sprint || NKInput.SprintLock;
            joyKnobImg.color = sprinting ? new Color(1f, 0.55f, 0.15f, 0.9f) : new Color(1, 1, 1, 0.75f);
            joyLabel.text = NKInput.SprintLock ? "CORRENDO (TRAVADO)" : sprinting ? "CORRENDO" : "";
            if (NKInput.Scripted)
            {
                joyKnob.anchoredPosition = Vector2.ClampMagnitude(NKInput.Move, 1) * (joyBase.rect.width * 0.5f);
            }

            foreach (var b in buttons)
            {
                bool lit = b.held || (b == bFire || b == bFireL) && NKInput.Fire || b == bAds && AdsActive || b == bView && FirstPerson;
                b.img.color = lit ? Color.Lerp(b.col, Color.white, 0.35f) : b.col;
                b.rt.localScale = Vector3.one * (b.held ? 0.94f : 1f);
            }

            // cruz da mira abre com o movimento
            float s = AdsActive ? 0 : CrosshairSpread;
            if (crossBars[0] != null)
            {
                crossBars[0].anchoredPosition = new Vector2(0, 12 + s);
                crossBars[1].anchoredPosition = new Vector2(0, -12 - s);
                crossBars[2].anchoredPosition = new Vector2(12 + s, 0);
                crossBars[3].anchoredPosition = new Vector2(-12 - s, 0);
                foreach (var c in crossBars) c.gameObject.SetActive(!AdsActive);
            }

            hitMarkerT -= Time.deltaTime;
            var hc = hitMarker.color; hc.a = Mathf.Clamp01(hitMarkerT * 5); hitMarker.color = hc;
        }

        public void ShowHit(bool kill)
        {
            hitMarkerT = 0.25f;
            hitMarker.color = kill ? new Color(1, 0.2f, 0.2f, 1) : new Color(1, 1, 1, 1);
        }
    }
}
