using UnityEngine;

namespace GhostMarket.Data
{
    [CreateAssetMenu(menuName = "Ghost Market/Weapon Definition")]
    public class WeaponDefinition : ScriptableObject
    {
        public string weaponId = "starter_blade";
        public string displayName = "Starter Blade";
        public int lightDamage = 12;
        public int heavyDamage = 28;
        public float lightRange = 1.4f;
        public float heavyRange = 1.8f;
    }
}
