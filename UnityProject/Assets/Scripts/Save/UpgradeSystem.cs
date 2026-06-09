using GhostMarket.Combat;
using GhostMarket.Player;
using UnityEngine;

namespace GhostMarket.Save
{
    public class UpgradeSystem : MonoBehaviour
    {
        [SerializeField] private HealthComponent playerHealth;
        [SerializeField] private PlayerCombat playerCombat;

        public int GetUpgradeCost(int currentLevel, int baseCost = 3)
        {
            return baseCost + currentLevel * 2;
        }

        public bool TryBuyMaxHp()
        {
            var save = SaveSystem.Instance.Data;
            var cost = GetUpgradeCost(save.upgrades.maxHp);
            if (save.demonBone < cost) return false;

            save.demonBone -= cost;
            save.upgrades.maxHp++;
            SaveSystem.Instance.Save();
            ApplyUpgrades();
            return true;
        }

        public void ApplyUpgrades()
        {
            var save = SaveSystem.Instance.Data;
            if (playerHealth)
            {
                playerHealth.SetMaxHp(100 + save.upgrades.maxHp * 15, true);
            }
        }
    }
}
