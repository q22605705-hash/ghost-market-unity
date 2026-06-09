using System;
using System.Collections;
using GhostMarket.Core;
using UnityEngine;

namespace GhostMarket.Combat
{
    public class HealthComponent : MonoBehaviour, IDamageable
    {
        [SerializeField] private int maxHp = 100;
        [SerializeField] private bool isPlayer;
        [SerializeField] private SpriteRenderer[] flashRenderers;

        private float invulnerableUntil;
        private Coroutine flashRoutine;

        public event Action<DamageInfo> Damaged;
        public event Action Died;

        public int CurrentHp { get; private set; }
        public int MaxHp => maxHp;
        public bool IsAlive => CurrentHp > 0;
        public bool IsInvulnerable => Time.time < invulnerableUntil;

        private void Awake()
        {
            CurrentHp = maxHp;
        }

        public void SetMaxHp(int value, bool refill)
        {
            maxHp = Mathf.Max(1, value);
            if (refill) CurrentHp = maxHp;
            else CurrentHp = Mathf.Clamp(CurrentHp, 0, maxHp);
        }

        public void SetInvulnerable(float seconds)
        {
            invulnerableUntil = Mathf.Max(invulnerableUntil, Time.time + seconds);
        }

        public void ApplyDamage(DamageInfo damage)
        {
            if (!IsAlive || IsInvulnerable) return;

            CurrentHp = Mathf.Max(0, CurrentHp - Mathf.Max(0, damage.Damage));
            if (isPlayer) SetInvulnerable(GameConstants.PlayerInvulnerableAfterHitSeconds);
            Flash();
            Damaged?.Invoke(damage);

            if (CurrentHp <= 0)
            {
                Died?.Invoke();
            }
        }

        private void Flash()
        {
            if (flashRenderers == null || flashRenderers.Length == 0) return;
            if (flashRoutine != null) StopCoroutine(flashRoutine);
            flashRoutine = StartCoroutine(FlashRoutine());
        }

        private IEnumerator FlashRoutine()
        {
            foreach (var renderer in flashRenderers)
            {
                if (renderer) renderer.color = Color.white;
            }
            yield return new WaitForSeconds(0.08f);
            foreach (var renderer in flashRenderers)
            {
                if (renderer) renderer.color = Color.white;
            }
        }
    }
}
