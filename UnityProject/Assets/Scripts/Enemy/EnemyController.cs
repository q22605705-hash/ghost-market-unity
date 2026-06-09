using GhostMarket.Core;
using GhostMarket.Combat;
using UnityEngine;

namespace GhostMarket.Enemy
{
    public class EnemyController : MonoBehaviour
    {
        [SerializeField] private HealthComponent health;
        [SerializeField] private KnockbackComponent knockback;
        [SerializeField] private Animator animator;
        [SerializeField] private CameraShakeController cameraShake;
        [SerializeField] private bool isBoss;

        public EnemyState State { get; private set; } = EnemyState.Idle;
        public bool IsBoss => isBoss;

        private void Reset()
        {
            health = GetComponent<HealthComponent>();
            knockback = GetComponent<KnockbackComponent>();
            animator = GetComponentInChildren<Animator>();
            cameraShake = FindFirstObjectByType<CameraShakeController>();
        }

        private void Awake()
        {
            if (health)
            {
                health.Damaged += OnDamaged;
                health.Died += OnDied;
            }
        }

        private void OnDestroy()
        {
            if (health)
            {
                health.Damaged -= OnDamaged;
                health.Died -= OnDied;
            }
        }

        private void OnDamaged(DamageInfo damage)
        {
            if (State == EnemyState.Dead) return;
            State = EnemyState.Hurt;
            HitstopManager.Instance?.StopFor(isBoss ? GameConstants.BossHitstopSeconds : damage.HitstopSeconds);
            knockback?.Apply(damage.Direction, damage.KnockbackDistance);
            cameraShake?.Shake(isBoss ? GameConstants.CameraShakeMinSeconds : GameConstants.CameraShakeMaxSeconds, damage.IsHeavy ? 1.3f : 0.8f);
            UpdateAnimator();
        }

        private void OnDied()
        {
            State = EnemyState.Dead;
            UpdateAnimator();
        }

        private void UpdateAnimator()
        {
            if (!animator) return;
            animator.SetInteger("State", (int)State);
        }
    }
}
