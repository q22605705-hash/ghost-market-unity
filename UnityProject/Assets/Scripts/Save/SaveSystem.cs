using System.IO;
using UnityEngine;

namespace GhostMarket.Save
{
    public class SaveSystem : MonoBehaviour
    {
        public static SaveSystem Instance { get; private set; }

        public SaveData Data { get; private set; }

        private string SavePath => Path.Combine(Application.persistentDataPath, "ghost_market_save.json");

        private void Awake()
        {
            if (Instance && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
            Load();
        }

        public void Load()
        {
            if (!File.Exists(SavePath))
            {
                Data = new SaveData();
                Save();
                return;
            }

            var json = File.ReadAllText(SavePath);
            Data = JsonUtility.FromJson<SaveData>(json) ?? new SaveData();
        }

        public void Save()
        {
            Data ??= new SaveData();
            var json = JsonUtility.ToJson(Data, true);
            File.WriteAllText(SavePath, json);
        }

        public void ResetSave()
        {
            Data = new SaveData();
            Save();
        }
    }
}
