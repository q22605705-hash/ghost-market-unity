using System.Collections.Generic;
using UnityEngine;

namespace GhostMarket.Combat
{
    public class HitboxComponent : MonoBehaviour
    {
        [SerializeField] private Collider2D hitbox;

        private readonly HashSet<IDamageable> hitTargets = new();
        private DamageInfo activeDamage;

        private void Reset()
        {
            hitbox = GetComponent<Collider2D>();
            if (hitbox) hitbox.isTrigger = true;
        }

        private void Awake()
        {
            if (hitbox) hitbox.enabled = false;
        }

        public void Open(DamageInfo damage)
        {
            activeDamage = damage;
            hitTargets.Clear();
            if (hitbox) hitbox.enabled = true;
        }

        public void Close()
        {
            if (hitbox) hitbox.enabled = false;
            hitTargets.Clear();
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (!hitbox || !hitbox.enabled) return;
            var damageable = other.GetComponentInParent<IDamageable>();
            if (damageable == null || hitTargets.Contains(damageable)) return;

            hitTargets.Add(damageable);
            damageable.ApplyDamage(activeDamage);
        }
    }
}
