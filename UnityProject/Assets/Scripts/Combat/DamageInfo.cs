using GhostMarket.Core;
using UnityEngine;

namespace GhostMarket.Combat
{
    public struct DamageInfo
    {
        public int Damage;
        public AttackType AttackType;
        public Vector2 Direction;
        public float HitstopSeconds;
        public float KnockbackDistance;
        public GameObject Source;

        public bool IsHeavy => AttackType == AttackType.Heavy;
        public bool IsBossTarget { get; set; }
    }
}
