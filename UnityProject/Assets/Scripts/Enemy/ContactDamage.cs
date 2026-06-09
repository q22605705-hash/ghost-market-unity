using System.Collections.Generic;
using GhostMarket.Core;
using GhostMarket.Combat;
using UnityEngine;

namespace GhostMarket.Enemy
{
    public class ContactDamage : MonoBehaviour
    {
        [SerializeField] private int damage = 10;
        [SerializeField] private float cooldownSeconds = 0.65f;

        private readonly Dictionary<IDamageable, float> nextHitTime = new();

        private void OnCollisionStay2D(Collision2D collision)
        {
            TryDamage(collision.collider);
        }

        private void OnTriggerStay2D(Collider2D other)
        {
            TryDamage(other);
        }

        private void TryDamage(Collider2D other)
        {
            var target = other.GetComponentInParent<IDamageable>();
            if (target == null || !target.IsAlive) return;
            if (nextHitTime.TryGetValue(target, out var next) && Time.time < next) return;

            var direction = ((Vector2)other.transform.position - (Vector2)transform.position).normalized;
            target.ApplyDamage(new DamageInfo
            {
                Damage = damage,
                AttackType = AttackType.Light1,
                Direction = direction,
                HitstopSeconds = GameConstants.PlayerHurtStopSeconds,
                KnockbackDistance = 30f,
                Source = gameObject
            });
            nextHitTime[target] = Time.time + cooldownSeconds;
        }
    }
}
