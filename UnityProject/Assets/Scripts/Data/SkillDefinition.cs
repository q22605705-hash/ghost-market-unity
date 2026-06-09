using UnityEngine;

namespace GhostMarket.Data
{
    [CreateAssetMenu(menuName = "Ghost Market/Skill Definition")]
    public class SkillDefinition : ScriptableObject
    {
        public string skillId = "basic_fire_charm";
        public string displayName = "Basic Fire Charm";
        public float cooldownSeconds = 6f;
        public int damage = 20;
        public GameObject effectPrefab;
    }
}
