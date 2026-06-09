using UnityEngine;

namespace GhostMarket.Data
{
    [CreateAssetMenu(menuName = "Ghost Market/Enemy Definition")]
    public class EnemyDefinition : ScriptableObject
    {
        public string enemyId;
        public string displayName;
        public int maxHp = 40;
        public int contactDamage = 10;
        public float moveSpeed = 2.5f;
        public bool isBoss;
    }
}
