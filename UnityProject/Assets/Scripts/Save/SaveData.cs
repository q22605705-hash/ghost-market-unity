using System;
using System.Collections.Generic;

namespace GhostMarket.Save
{
    [Serializable]
    public class SaveData
    {
        public int playerLevel = 1;
        public int demonBone = 0;
        public int soulFire = 0;
        public List<string> unlockedWeapons = new() { "starter_blade" };
        public List<string> unlockedCharms = new() { "basic_fire_charm" };
        public UpgradeData upgrades = new();
        public BestRunData bestRun = new();
        public SettingsData settings = new();
    }

    [Serializable]
    public class UpgradeData
    {
        public int maxHp = 0;
        public int attackPower = 0;
        public int dashCooldown = 0;
        public int charmSlots = 0;
        public int staminaMax = 0;
        public int heavyAttackPower = 0;
    }

    [Serializable]
    public class BestRunData
    {
        public int roomsCleared = 0;
        public int bossKilled = 0;
    }

    [Serializable]
    public class SettingsData
    {
        public float masterVolume = 1f;
        public float musicVolume = 0.8f;
        public float sfxVolume = 0.9f;
    }
}
