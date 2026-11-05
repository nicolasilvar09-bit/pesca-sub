using System;
using System.Collections.Generic;
using UnityEngine;

namespace NK
{
    /// <summary>Inventário local de cosméticos. Itens e equipamentos são locais; compras Elite precisam de validação oficial.</summary>
    public static class CosmeticInventory
    {
        const string OwnedKey = "NK_COSMETICS_OWNED_V2";
        const string EquippedKey = "NK_COSMETICS_EQUIPPED_V2";
        const string LegacyEquippedKey = "NK_COSMETICS_EQUIPPED_V1";
        static readonly string[] Catalog = { "imperial_rifle", "imperial_outfit", "imperial_car", "imperial_helmet" };
        static readonly string[] Names = { "Rifle Coroa Imperial", "Traje Coroa Imperial", "Veículo Coroa Imperial", "Capacete Coroa Imperial" };
        static HashSet<string> owned;
        static readonly Dictionary<string, string> equipped = new Dictionary<string, string>();
        static bool loaded;
        public static event Action Changed;

        static string SlotOf(string id)
        {
            if (id == "imperial_rifle") return "weapon";
            if (id == "imperial_outfit") return "outfit";
            if (id == "imperial_car") return "vehicle";
            if (id == "imperial_helmet") return "head";
            return "";
        }
        static void Load()
        {
            if (loaded) return;
            loaded = true;
            owned = new HashSet<string>(PlayerPrefs.GetString(OwnedKey, "").Split(new[] { '|' }, StringSplitOptions.RemoveEmptyEntries));
            string packed = PlayerPrefs.GetString(EquippedKey, "");
            foreach (string pair in packed.Split(new[] { ';' }, StringSplitOptions.RemoveEmptyEntries))
            {
                int i = pair.IndexOf('=');
                if (i > 0) equipped[pair.Substring(0, i)] = pair.Substring(i + 1);
            }
            // Migra a versão anterior, que guardava somente um item equipado.
            if (equipped.Count == 0)
            {
                string old = PlayerPrefs.GetString(LegacyEquippedKey, "");
                string slot = SlotOf(old);
                if (!string.IsNullOrEmpty(slot) && owned.Contains(old)) equipped[slot] = old;
            }
        }
        public static int Count { get { Load(); return owned.Count; } }
        public static string Equipped { get { Load(); return equipped.ContainsKey("weapon") ? equipped["weapon"] : ""; } }
        public static string EquippedFor(string slot) { Load(); return equipped.TryGetValue(slot, out string id) ? id : ""; }
        public static string[] EquippedItems()
        {
            Load(); var list = new List<string>();
            foreach (string slot in new[] { "weapon", "outfit", "vehicle", "head" })
                if (equipped.TryGetValue(slot, out string id)) list.Add(id);
            return list.ToArray();
        }
        public static string NameOf(string id)
        {
            int i = Array.IndexOf(Catalog, id);
            return i >= 0 ? Names[i] : id;
        }
        public static bool Owns(string id) { Load(); return owned.Contains(id); }
        public static bool Grant(string id)
        {
            Load();
            if (Array.IndexOf(Catalog, id) < 0 || !owned.Add(id)) return false;
            Save(); return true;
        }
        public static bool Equip(string id)
        {
            Load();
            if (!owned.Contains(id)) return false;
            string slot = SlotOf(id);
            if (string.IsNullOrEmpty(slot)) return false;
            equipped[slot] = id;
            SaveEquipped();
            ApplyToGame();
            Changed?.Invoke();
            return true;
        }
        static void ApplyToGame()
        {
            if (GameRoot.I == null) return;
            if (GameRoot.I.Rig != null) GameRoot.I.Rig.ApplyCosmetics(EquippedItems());
            if (GameRoot.I.ViewModel != null) GameRoot.I.ViewModel.ApplyWeaponSkin(EquippedFor("weapon"));
            if (GameRoot.I.VehicleDisplay != null) GameRoot.I.VehicleDisplay.SetSkin(EquippedFor("vehicle"));
        }
        public static string[] OwnedItems()
        {
            Load(); var a = new List<string>();
            foreach (var id in Catalog) if (owned.Contains(id)) a.Add(id);
            return a.ToArray();
        }
        static void Save()
        {
            PlayerPrefs.SetString(OwnedKey, string.Join("|", OwnedItems()));
            SaveEquipped(); PlayerPrefs.Save(); Changed?.Invoke();
        }
        static void SaveEquipped()
        {
            var pairs = new List<string>();
            foreach (string slot in new[] { "weapon", "outfit", "vehicle", "head" })
                if (equipped.TryGetValue(slot, out string id)) pairs.Add(slot + "=" + id);
            PlayerPrefs.SetString(EquippedKey, string.Join(";", pairs));
            PlayerPrefs.Save();
        }
        public static string RewardFor(bool elite, int tier)
        {
            if (!elite && tier == 5) return "imperial_helmet";
            if (!elite && tier == 9) return "imperial_rifle";
            if (elite && tier == 4) return "imperial_outfit";
            if (elite && tier == 7) return "imperial_car";
            return null;
        }
    }

    /// <summary>Overlay de consulta e equipamento dos cosméticos resgatados.</summary>
    public class CosmeticInventoryUI : MonoBehaviour
    {
        bool open;
        GUIStyle title, body, button;
        void EnsureStyles()
        {
            if (title != null) return;
            title = new GUIStyle(GUI.skin.label) { fontSize = Mathf.Max(18, Screen.height / 34), fontStyle = FontStyle.Bold, normal = { textColor = new Color(.94f, .72f, .35f) } };
            body = new GUIStyle(GUI.skin.label) { fontSize = Mathf.Max(14, Screen.height / 48), normal = { textColor = Color.white } };
            button = new GUIStyle(GUI.skin.button) { fontSize = Mathf.Max(14, Screen.height / 48), fixedHeight = Mathf.Max(42, Screen.height / 15) };
        }
        void OnGUI()
        {
            EnsureStyles();
            float w = Mathf.Min(560, Screen.width - 28), h = Mathf.Min(600, Screen.height - 40);
            if (GUI.Button(new Rect(Screen.width - 190, 16, 174, 48), "INVENTÁRIO")) open = !open;
            if (!open) return;
            Rect r = new Rect((Screen.width - w) / 2, (Screen.height - h) / 2, w, h);
            GUI.Box(r, GUIContent.none);
            GUILayout.BeginArea(new Rect(r.x + 18, r.y + 14, r.width - 36, r.height - 28));
            GUILayout.Label("ARSENAL  /  COROA IMPERIAL", title);
            GUILayout.Label("Itens resgatados: " + CosmeticInventory.Count, body);
            GUILayout.Space(12);
            string[] items = CosmeticInventory.OwnedItems();
            if (items.Length == 0) GUILayout.Label("Resgate recompensas cosméticas no Passe para preencher seu inventário.", body);
            foreach (string id in items)
            {
                string slot = id == "imperial_rifle" ? "weapon" : id == "imperial_outfit" ? "outfit" : id == "imperial_car" ? "vehicle" : "head";
                bool isEquipped = CosmeticInventory.EquippedFor(slot) == id;
                GUILayout.BeginHorizontal();
                GUILayout.Label(CosmeticInventory.NameOf(id) + (isEquipped ? "  •  EQUIPADO" : ""), body, GUILayout.ExpandWidth(true));
                if (!isEquipped && GUILayout.Button("EQUIPAR", button, GUILayout.Width(120))) CosmeticInventory.Equip(id);
                GUILayout.EndHorizontal(); GUILayout.Space(6);
            }
            GUILayout.FlexibleSpace();
            if (GUILayout.Button("FECHAR", button)) open = false;
            GUILayout.EndArea();
        }
    }
}
