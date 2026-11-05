using System;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;

namespace NK
{
    /// <summary>
    /// NK Mobile seasonal pass. Responsive premium presentation, separate Free/Elite tracks,
    /// locally persisted XP and claim states. Elite entitlement must come from verified store/server.
    /// </summary>
    public class BattlePassUI : MonoBehaviour
    {
        const string XPKey = "NK_BP_S1_XP";
        const string ClaimPrefix = "NK_BP_S1_CLAIM_";
        const int TierCount = 10, XPPerTier = 500, SeasonXP = TierCount * XPPerTier;

        static readonly Color Background = new Color(.018f, .024f, .036f, .985f);
        static readonly Color Surface = new Color(.055f, .067f, .086f, 1f);
        static readonly Color Surface2 = new Color(.085f, .098f, .122f, 1f);
        static readonly Color Gold = new Color(.91f, .69f, .31f, 1f);
        static readonly Color GoldSoft = new Color(.57f, .40f, .18f, 1f);
        static readonly Color Red = new Color(.62f, .075f, .12f, 1f);
        static readonly Color White = new Color(.94f, .95f, .97f, 1f);
        static readonly Color Muted = new Color(.57f, .62f, .69f, 1f);

        static readonly string[] FreeNames = {
            "250 CRÉDITOS", "SPRAY COROA", "BÔNUS DE XP", "EMBLEMA IMPERIAL", "500 CRÉDITOS",
            "CAPACETE RUBRO", "SPRAY RUBRO", "VEÍCULO IMPERIAL", "750 CRÉDITOS", "RIFLE COROA REAL"
        };
        static readonly string[] EliteNames = {
            "500 CRÉDITOS", "TRILHA DOURADA", "LUVA REAL", "EMOTE SOBERANO", "TRAJE IMPERIAL",
            "1.000 CRÉDITOS", "CAPACETE ELITE", "VEÍCULO ELITE", "EXECUÇÃO COROA", "CONJUNTO COROA IMPERIAL"
        };
        static readonly string[] FreeMarks = {"¢", "✦", "2×", "✥", "¢", "◈", "✦", "▰", "¢", "✚"};
        static readonly string[] EliteMarks = {"¢", "✧", "◆", "♛", "♜", "¢", "◈", "▰", "✕", "♛"};

        int totalXP;
        bool eliteUnlocked;
        Canvas canvas;
        GameObject panel;
        Text xpText, levelText, progressText, seasonStatus;
        Image progressFill;
        Font font;
        Button eliteButton;

        public int CurrentTier => Mathf.Clamp(totalXP / XPPerTier, 0, TierCount);
        public int TotalXP => totalXP;
        public bool EliteUnlocked => eliteUnlocked;

        void Awake()
        {
            totalXP = Mathf.Clamp(PlayerPrefs.GetInt(XPKey, 0), 0, SeasonXP);
            // Entitlement premium não é confiada ao armazenamento local: a loja/servidor deve revalidá-la a cada sessão.
            eliteUnlocked = false;
            font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            if (font == null) font = Resources.GetBuiltinResource<Font>("Arial.ttf");
            BuildCanvas();
            BuildLauncher();
            BuildPanel();
            panel.SetActive(false);
        }

        /// <summary>Call once at match end. Default reward: 100 XP, plus 50 XP for a win.</summary>
        public void RegisterMatch(int xp, bool victory)
        {
            if (totalXP >= SeasonXP) return;
            int reward = Mathf.Max(0, xp) + (victory ? 50 : 0);
            totalXP = Mathf.Clamp(totalXP + reward, 0, SeasonXP);
            PlayerPrefs.SetInt(XPKey, totalXP);
            PlayerPrefs.Save();
            Refresh();
        }

        /// <summary>Only call after a verified Google Play/App Store/server entitlement response.</summary>
        public void SetEliteEntitlement(bool owned)
        {
            eliteUnlocked = owned;
            Refresh();
        }

        public void SetStoreMessage(string message)
        {
            if (seasonStatus != null) seasonStatus.text = message;
        }

        public void RestoreElitePurchase() { EliteStoreCoordinator.RequestRestore(this); }


        public bool IsRewardUnlocked(int tierIndex) => tierIndex >= 0 && tierIndex < TierCount && totalXP >= (tierIndex + 1) * XPPerTier;
        public bool IsRewardClaimed(int tierIndex, bool eliteTrack) => PlayerPrefs.GetInt(ClaimPrefix + (eliteTrack ? "E_" : "F_") + tierIndex, 0) == 1;

        public bool ClaimReward(int tierIndex, bool eliteTrack)
        {
            if (tierIndex < 0 || tierIndex >= TierCount || !IsRewardUnlocked(tierIndex)) return false;
            if (eliteTrack && !eliteUnlocked) return false;
            if (IsRewardClaimed(tierIndex, eliteTrack)) return false;
            PlayerPrefs.SetInt(ClaimPrefix + (eliteTrack ? "E_" : "F_") + tierIndex, 1);
            string cosmeticId = CosmeticInventory.RewardFor(eliteTrack, tierIndex);
            if (!string.IsNullOrEmpty(cosmeticId)) CosmeticInventory.Grant(cosmeticId);
            PlayerPrefs.Save();
            Refresh();
            if (!string.IsNullOrEmpty(cosmeticId) && seasonStatus != null)
                seasonStatus.text = "NOVO ITEM NO INVENTÁRIO: " + CosmeticInventory.NameOf(cosmeticId).ToUpperInvariant();
            return true;
        }

        void BuildCanvas()
        {
            GameObject go = new GameObject("NK_BattlePass_Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            go.transform.SetParent(transform, false);
            canvas = go.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 80;
            CanvasScaler scaler = go.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = .5f;
            scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
            if (FindObjectOfType<EventSystem>() == null)
            {
                GameObject es = new GameObject("NK_EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));
                es.transform.SetParent(go.transform, false);
            }
        }

        void BuildLauncher()
        {
            Button b = MakeButton(canvas.transform, "PASSE  /  S1", new Vector2(1, 1), new Vector2(1, 1),
                new Vector2(210, 62), new Vector2(-255, -52), Red, Gold, 21);
            b.onClick.AddListener(() => panel.SetActive(true));
        }

        void BuildPanel()
        {
            panel = MakeRect("BattlePass_Fullscreen", canvas.transform, Vector2.zero, Vector2.one);
            panel.AddComponent<Image>().color = Background;
            AddOutline(panel, new Color(Gold.r, Gold.g, Gold.b, .38f), 2f);

            // Top identity / season hero
            GameObject hero = MakeRect("Hero", panel.transform, new Vector2(.025f, .79f), new Vector2(.975f, .985f));
            hero.AddComponent<Image>().color = new Color(.035f, .043f, .058f, 1f);
            AddOutline(hero, new Color(Gold.r, Gold.g, Gold.b, .22f), 1f);
            GameObject heroStripe = MakeRect("HeroStripe", hero.transform, new Vector2(0, 0), new Vector2(.009f, 1));
            heroStripe.AddComponent<Image>().color = Red;
            Label(hero.transform, "NK MOBILE     /     TEMPORADA 01", new Vector2(.035f, .69f), new Vector2(.7f, .91f), 18, Gold, FontStyle.Bold);
            Label(hero.transform, "COROA IMPERIAL", new Vector2(.035f, .27f), new Vector2(.76f, .73f), 48, White, FontStyle.Bold);
            Label(hero.transform, "SUA JORNADA. SUAS CONQUISTAS. RECOMPENSAS A CADA PARTIDA.", new Vector2(.038f, .08f), new Vector2(.78f, .28f), 15, Muted, FontStyle.Normal);
            GameObject crest = MakeRect("CrestFrame", hero.transform, new Vector2(.82f, .13f), new Vector2(.95f, .87f));
            crest.AddComponent<Image>().color = new Color(.11f, .08f, .055f, 1f);
            AddOutline(crest, GoldSoft, 2f);
            Label(crest.transform, "♛", Vector2.zero, Vector2.one, 66, Gold, FontStyle.Bold, TextAnchor.MiddleCenter);
            Button close = MakeButton(hero.transform, "✕", new Vector2(1, 1), new Vector2(1, 1), new Vector2(54, 54), new Vector2(-18, -18), Surface2, White, 23);
            close.onClick.AddListener(() => panel.SetActive(false));

            // XP / progress card
            GameObject status = MakeRect("ProgressPanel", panel.transform, new Vector2(.025f, .675f), new Vector2(.975f, .765f));
            status.AddComponent<Image>().color = Surface;
            levelText = Label(status.transform, "NÍVEL 01", new Vector2(.025f, .47f), new Vector2(.22f, .9f), 24, Gold, FontStyle.Bold);
            xpText = Label(status.transform, "0 / 5.000 XP", new Vector2(.72f, .47f), new Vector2(.975f, .9f), 21, White, FontStyle.Bold, TextAnchor.MiddleRight);
            GameObject track = MakeRect("ProgressTrack", status.transform, new Vector2(.025f, .19f), new Vector2(.975f, .37f));
            track.AddComponent<Image>().color = new Color(.16f, .18f, .22f, 1f);
            GameObject fill = MakeRect("ProgressFill", track.transform, Vector2.zero, new Vector2(0, 1));
            RectTransform fr = fill.GetComponent<RectTransform>(); fr.pivot = new Vector2(0, .5f);
            progressFill = fill.AddComponent<Image>(); progressFill.color = Gold;
            progressText = Label(status.transform, "JOGUE PARTIDAS PARA AVANÇAR", new Vector2(.025f, .0f), new Vector2(.73f, .18f), 14, Muted, FontStyle.Normal);
            seasonStatus = Label(status.transform, "TRILHA GRATUITA ATIVA", new Vector2(.73f, .0f), new Vector2(.975f, .18f), 13, Gold, FontStyle.Bold, TextAnchor.MiddleRight);

            // Track labels
            GameObject trackTitles = MakeRect("TrackTitles", panel.transform, new Vector2(.025f, .615f), new Vector2(.975f, .66f));
            Label(trackTitles.transform, "01   TRILHA GRATUITA", new Vector2(0, 0), new Vector2(.49f, 1), 18, Gold, FontStyle.Bold);
            Label(trackTitles.transform, "02   TRILHA ELITE", new Vector2(.51f, 0), new Vector2(1, 1), 18, White, FontStyle.Bold);

            // Horizontal reward carousel
            GameObject viewport = MakeRect("TierViewport", panel.transform, new Vector2(.025f, .145f), new Vector2(.975f, .605f));
            viewport.AddComponent<RectMask2D>();
            ScrollRect scroll = viewport.AddComponent<ScrollRect>();
            scroll.horizontal = true; scroll.vertical = false; scroll.movementType = ScrollRect.MovementType.Elastic;
            scroll.inertia = true; scroll.decelerationRate = .12f; scroll.scrollSensitivity = 35f;
            GameObject content = MakeRect("TierContent", viewport.transform, Vector2.zero, new Vector2(0, 1));
            RectTransform cr = content.GetComponent<RectTransform>(); cr.pivot = new Vector2(0, .5f);
            HorizontalLayoutGroup layout = content.AddComponent<HorizontalLayoutGroup>();
            layout.spacing = 14; layout.padding = new RectOffset(5, 12, 8, 8);
            layout.childForceExpandWidth = false; layout.childForceExpandHeight = true;
            layout.childControlWidth = true; layout.childControlHeight = true;
            ContentSizeFitter fitter = content.AddComponent<ContentSizeFitter>();
            fitter.horizontalFit = ContentSizeFitter.FitMode.PreferredSize;
            fitter.verticalFit = ContentSizeFitter.FitMode.Unconstrained;
            scroll.content = cr; scroll.viewport = viewport.GetComponent<RectTransform>();
            for (int i = 0; i < TierCount; i++) BuildTier(content.transform, i);

            // Footer
            GameObject footer = MakeRect("Footer", panel.transform, new Vector2(.025f, .045f), new Vector2(.975f, .12f));
            footer.AddComponent<Image>().color = Surface;
            Label(footer.transform, "500 XP POR NÍVEL", new Vector2(.02f, .1f), new Vector2(.27f, .9f), 16, Gold, FontStyle.Bold);
            Label(footer.transform, "+50 XP POR VITÓRIA     •     5.000 XP PARA CONCLUIR", new Vector2(.28f, .1f), new Vector2(.72f, .9f), 14, Muted, FontStyle.Normal, TextAnchor.MiddleCenter);
            eliteButton = MakeButton(footer.transform, eliteUnlocked ? "ELITE ATIVA" : "TRILHA ELITE", new Vector2(1, .5f), new Vector2(1, .5f),
                new Vector2(220, 48), new Vector2(-116, 0), eliteUnlocked ? Gold : Red, eliteUnlocked ? Background : White, 16);
            // O adaptador de loja deve validar recibo antes de liberar a trilha.
            eliteButton.onClick.AddListener(() =>
            {
                if (eliteUnlocked) seasonStatus.text = "TRILHA ELITE DESBLOQUEADA";
                else EliteStoreCoordinator.RequestPurchase(this);
            });
            Button restoreButton = MakeButton(footer.transform, "RESTAURAR", new Vector2(1, .5f), new Vector2(1, .5f),
                new Vector2(118, 40), new Vector2(-365, 0), Surface2, Gold, 12);
            restoreButton.onClick.AddListener(RestoreElitePurchase);
            Refresh();
        }

        void BuildTier(Transform parent, int index)
        {
            GameObject card = MakeRect("Tier_" + (index + 1), parent, Vector2.zero, Vector2.one);
            RectTransform cardRect = card.GetComponent<RectTransform>(); cardRect.sizeDelta = new Vector2(264, 0);
            card.AddComponent<Image>().color = Surface;
            AddOutline(card, new Color(1, 1, 1, .08f), 1f);

            GameObject top = MakeRect("TierHeader", card.transform, new Vector2(0, .86f), new Vector2(1, 1));
            top.AddComponent<Image>().color = (index == 4 || index == 9) ? Red : Surface2;
            Label(top.transform, "NÍVEL  " + (index + 1).ToString("00"), new Vector2(.07f, .05f), new Vector2(.7f, .95f), 19, White, FontStyle.Bold);
            Label(top.transform, index == 9 ? "FINAL" : "S" + (index + 1).ToString("00"), new Vector2(.72f, .05f), new Vector2(.94f, .95f), 13, Gold, FontStyle.Bold, TextAnchor.MiddleRight);

            BuildReward(card.transform, "GRÁTIS", FreeNames[index], FreeMarks[index], new Vector2(.055f, .48f), new Vector2(.945f, .82f), Gold, false, index);
            BuildReward(card.transform, "ELITE", EliteNames[index], EliteMarks[index], new Vector2(.055f, .10f), new Vector2(.945f, .44f), Red, true, index);

            Text state = Label(card.transform, "", new Vector2(.06f, .015f), new Vector2(.94f, .085f), 12, Muted, FontStyle.Bold, TextAnchor.MiddleCenter);
            state.gameObject.AddComponent<TierState>().tier = index;
        }

        void BuildReward(Transform parent, string lane, string reward, string mark, Vector2 min, Vector2 max, Color accent, bool eliteTrack, int tier)
        {
            GameObject block = MakeRect(lane + "Reward", parent, min, max);
            Image blockImage = block.AddComponent<Image>();
            blockImage.color = new Color(.035f, .044f, .058f, 1f);
            Button rewardButton = block.AddComponent<Button>();
            rewardButton.targetGraphic = blockImage;
            rewardButton.onClick.AddListener(() =>
            {
                bool didClaim = ClaimReward(tier, eliteTrack);
                if (!didClaim && eliteTrack && !eliteUnlocked && seasonStatus != null)
                    seasonStatus.text = "ELITE: DESBLOQUEIO PELA LOJA OFICIAL";
                else if (!didClaim && !IsRewardUnlocked(tier) && seasonStatus != null)
                    seasonStatus.text = "JOGUE MAIS PARTIDAS PARA LIBERAR ESTE NÍVEL";
            });
            GameObject line = MakeRect("Accent", block.transform, new Vector2(0, 0), new Vector2(.018f, 1));
            line.AddComponent<Image>().color = accent;
            GameObject emblem = MakeRect("RewardEmblem", block.transform, new Vector2(.045f, .19f), new Vector2(.31f, .82f));
            emblem.AddComponent<Image>().color = new Color(accent.r, accent.g, accent.b, .13f);
            AddOutline(emblem, new Color(accent.r, accent.g, accent.b, .5f), 1f);
            Label(emblem.transform, mark, Vector2.zero, Vector2.one, 31, accent, FontStyle.Bold, TextAnchor.MiddleCenter);
            Label(block.transform, lane, new Vector2(.36f, .65f), new Vector2(.94f, .92f), 11, accent, FontStyle.Bold);
            Label(block.transform, reward, new Vector2(.36f, .31f), new Vector2(.94f, .68f), 14, White, FontStyle.Bold);
            Text action = Label(block.transform, eliteTrack ? "PREMIUM" : "JOGUE PARA LIBERAR", new Vector2(.36f, .07f), new Vector2(.94f, .29f), 10, Muted, FontStyle.Bold);
            action.gameObject.AddComponent<RewardState>().tier = tier;
            action.GetComponent<RewardState>().elite = eliteTrack;
            // Deixa o clique chegar ao botão do cartão, em vez de ser capturado pelos textos/ícone.
            foreach (Graphic graphic in block.GetComponentsInChildren<Graphic>(true)) graphic.raycastTarget = false;
            blockImage.raycastTarget = true;
        }

        void Refresh()
        {
            if (xpText == null) return;
            int completed = Mathf.Clamp(totalXP / XPPerTier, 0, TierCount);
            int currentLevel = Mathf.Clamp(completed + 1, 1, TierCount);
            int within = totalXP >= SeasonXP ? XPPerTier : totalXP % XPPerTier;
            levelText.text = totalXP >= SeasonXP ? "TEMPORADA CONCLUÍDA" : "NÍVEL " + currentLevel.ToString("00");
            xpText.text = totalXP.ToString("N0") + " / 5.000 XP";
            progressFill.rectTransform.anchorMax = new Vector2(totalXP / (float)SeasonXP, 1f);
            progressText.text = totalXP >= SeasonXP ? "TODAS AS RECOMPENSAS GRATUITAS LIBERADAS" : "PRÓXIMO NÍVEL EM " + (XPPerTier - within) + " XP";
            seasonStatus.text = eliteUnlocked ? "TRILHA ELITE DESBLOQUEADA" : "TRILHA GRATUITA ATIVA";
            if (eliteButton != null)
            {
                Text bt = eliteButton.GetComponentInChildren<Text>();
                if (bt != null) bt.text = eliteUnlocked ? "ELITE ATIVA" : "TRILHA ELITE";
                eliteButton.GetComponent<Image>().color = eliteUnlocked ? Gold : Red;
            }

            foreach (TierState s in panel.GetComponentsInChildren<TierState>(true))
            {
                bool unlocked = IsRewardUnlocked(s.tier);
                s.GetComponent<Text>().text = IsRewardClaimed(s.tier, false) ? "RECOMPENSA GRATUITA RESGATADA" :
                    unlocked ? "RECOMPENSA GRATUITA DISPONÍVEL" : "DESBLOQUEIE NO NÍVEL " + (s.tier + 1).ToString("00");
                s.GetComponent<Text>().color = unlocked ? Gold : Muted;
            }
            foreach (RewardState s in panel.GetComponentsInChildren<RewardState>(true))
            {
                bool unlocked = IsRewardUnlocked(s.tier);
                bool owned = s.elite && eliteUnlocked;
                bool claimed = IsRewardClaimed(s.tier, s.elite);
                if (s.elite)
                    s.GetComponent<Text>().text = claimed ? "RESGATADO" : !eliteUnlocked ? "TRILHA PREMIUM" : unlocked ? "DISPONÍVEL" : "NÍVEL " + (s.tier + 1).ToString("00");
                else
                    s.GetComponent<Text>().text = claimed ? "RESGATADO" : unlocked ? "DISPONÍVEL PARA RESGATE" : "NÍVEL " + (s.tier + 1).ToString("00");
                s.GetComponent<Text>().color = claimed ? Gold : (unlocked && (!s.elite || owned) ? White : Muted);
            }
        }

        GameObject MakeRect(string name, Transform parent, Vector2 min, Vector2 max)
        {
            GameObject go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            RectTransform r = go.GetComponent<RectTransform>();
            r.anchorMin = min; r.anchorMax = max; r.offsetMin = Vector2.zero; r.offsetMax = Vector2.zero;
            return go;
        }

        Text Label(Transform parent, string value, Vector2 min, Vector2 max, int size, Color color, FontStyle style, TextAnchor align = TextAnchor.MiddleLeft)
        {
            GameObject go = MakeRect("Text_" + value, parent, min, max);
            Text t = go.AddComponent<Text>();
            t.font = font; t.text = value; t.fontSize = size; t.color = color; t.fontStyle = style; t.alignment = align;
            t.horizontalOverflow = HorizontalWrapMode.Wrap; t.verticalOverflow = VerticalWrapMode.Overflow;
            t.resizeTextForBestFit = true; t.resizeTextMinSize = Mathf.Max(9, size - 3); t.resizeTextMaxSize = size;
            return t;
        }

        Button MakeButton(Transform parent, string value, Vector2 min, Vector2 max, Vector2 size, Vector2 pos, Color bg, Color fg, int fontSize)
        {
            GameObject go = MakeRect("Button_" + value, parent, min, max);
            RectTransform r = go.GetComponent<RectTransform>(); r.sizeDelta = size; r.anchoredPosition = pos;
            Image image = go.AddComponent<Image>(); image.color = bg;
            Button button = go.AddComponent<Button>(); button.targetGraphic = image;
            ColorBlock colors = button.colors; colors.normalColor = bg; colors.highlightedColor = Color.Lerp(bg, White, .12f);
            colors.pressedColor = Color.Lerp(bg, Color.black, .2f); colors.selectedColor = colors.highlightedColor; button.colors = colors;
            Label(go.transform, value, Vector2.zero, Vector2.one, fontSize, fg, FontStyle.Bold, TextAnchor.MiddleCenter);
            return button;
        }

        void AddOutline(GameObject go, Color color, float width)
        {
            Outline outline = go.AddComponent<Outline>(); outline.effectColor = color; outline.effectDistance = new Vector2(width, -width);
        }

        class TierState : MonoBehaviour { public int tier; }
        class RewardState : MonoBehaviour { public int tier; public bool elite; }
    }
}
