using System.Collections;
using GhostMarket.Core;
using GhostMarket.Combat;
using UnityEngine;

namespace GhostMarket.Player
{
    public class PlayerCombat : MonoBehaviour
    {
        [SerializeField] private HitboxComponent lightHitbox;
        [SerializeField] private HitboxComponent heavyHitbox;
        [SerializeField] private PlayerMovement movement;
        [SerializeField] private int lightDamage = 12;
        [SerializeField] private int heavyDamage = 28;
        [SerializeField] private float lightActiveSeconds = 0.08f;
        [SerializeField] private float heavyActiveSeconds = 0.13f;
        [SerializeField] private float lightRecoverySeconds = 0.18f;
        [SerializeField] private float heavyRecoverySeconds = 0.34f;

        private int comboIndex;
        private float lastLightInputTime = -99f;
        private Coroutine attackRoutine;

        public bool IsAttacking => attackRoutine != null;
        public int ComboIndex => comboIndex;

        private void Reset()
        {
            movement = GetComponent<PlayerMovement>();
        }

        public bool TryLightAttack()
        {
            if (IsAttacking) return false;
            if (Time.time - lastLightInputTime > GameConstants.ComboInputWindowSeconds) comboIndex = 0;
            comboIndex = (comboIndex % 3) + 1;
            lastLightInputTime = Time.time;
            attackRoutine = StartCoroutine(LightAttackRoutine(comboIndex));
            return true;
        }

        public bool TryHeavyAttack()
        {
            if (IsAttacking) return false;
            comboIndex = 0;
            attackRoutine = StartCoroutine(HeavyAttackRoutine());
            return true;
        }

        public void CancelAttack()
        {
            if (attackRoutine != null) StopCoroutine(attackRoutine);
            lightHitbox?.Close();
            heavyHitbox?.Close();
            attackRoutine = null;
        }

        private IEnumerator LightAttackRoutine(int step)
        {
            yield return new WaitForSeconds(step == 2 ? 0.06f : 0.04f);
            lightHitbox?.Open(BuildDamage(step));
            yield return new WaitForSeconds(lightActiveSeconds);
            lightHitbox?.Close();
            yield return new WaitForSeconds(lightRecoverySeconds);
            attackRoutine = null;
        }

        private IEnumerator HeavyAttackRoutine()
        {
            yield return new WaitForSeconds(0.14f);
            heavyHitbox?.Open(new DamageInfo
            {
                Damage = heavyDamage,
                AttackType = AttackType.Heavy,
                Direction = new Vector2(movement ? movement.Facing : 1, 0f),
                HitstopSeconds = GameConstants.HeavyAttackHitstopSeconds,
                KnockbackDistance = Random.Range(60f, 90f),
                Source = gameObject
            });
            yield return new WaitForSeconds(heavyActiveSeconds);
            heavyHitbox?.Close();
            yield return new WaitForSeconds(heavyRecoverySeconds);
            attackRoutine = null;
        }

        private DamageInfo BuildDamage(int step)
        {
            var knockback = step == 3 ? Random.Range(40f, 60f) : Random.Range(20f, 40f);
            var attackType = step switch
            {
                1 => AttackType.Light1,
                2 => AttackType.Light2,
                _ => AttackType.Light3
            };
            return new DamageInfo
            {
                Damage = lightDamage + (step - 1) * 3,
                AttackType = attackType,
                Direction = new Vector2(movement ? movement.Facing : 1, step == 2 ? 0.35f : 0f),
                HitstopSeconds = GameConstants.LightAttackHitstopSeconds,
                KnockbackDistance = knockback,
                Source = gameObject
            };
        }
    }
}
