using System.Collections;
using GhostMarket.Core;
using GhostMarket.Combat;
using UnityEngine;

namespace GhostMarket.Player
{
    public class PlayerController : MonoBehaviour
    {
        [SerializeField] private PlayerInputReader input;
        [SerializeField] private PlayerMovement movement;
        [SerializeField] private PlayerCombat combat;
        [SerializeField] private HealthComponent health;
        [SerializeField] private KnockbackComponent knockback;
        [SerializeField] private CameraShakeController cameraShake;
        [SerializeField] private Animator animator;

        private readonly PlayerStateMachine stateMachine = new();
        private Coroutine hurtRoutine;

        public PlayerState CurrentState => stateMachine.Current;

        private void Reset()
        {
            input = GetComponent<PlayerInputReader>();
            movement = GetComponent<PlayerMovement>();
            combat = GetComponent<PlayerCombat>();
            health = GetComponent<HealthComponent>();
            knockback = GetComponent<KnockbackComponent>();
            cameraShake = FindFirstObjectByType<CameraShakeController>();
            animator = GetComponentInChildren<Animator>();
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

        private void Update()
        {
            if (stateMachine.Current == PlayerState.Dead) return;

            var frame = input ? input.ReadFrame() : default;
            if (frame.PausePressed)
            {
                PauseController.TogglePause();
                return;
            }
            if (PauseController.IsPaused) return;

            movement?.SetMove(frame.MoveX);

            if (stateMachine.Current == PlayerState.Hurt) return;

            if (frame.JumpPressed && movement && movement.IsGrounded && stateMachine.TryChange(PlayerState.Jump))
            {
                movement.Jump();
            }

            if (frame.DashPressed && stateMachine.TryChange(PlayerState.Dash))
            {
                combat?.CancelAttack();
                movement?.TryDash();
            }

            if (frame.LightAttackPressed && stateMachine.TryChange(PlayerState.Attack))
            {
                combat?.TryLightAttack();
            }
            else if (frame.HeavyAttackPressed && stateMachine.TryChange(PlayerState.Attack))
            {
                combat?.TryHeavyAttack();
            }
            else if ((frame.SkillQPressed || frame.SkillEPressed || frame.SkillRPressed) && stateMachine.TryChange(PlayerState.Skill))
            {
                StartCoroutine(SkillStubRoutine());
            }

            ResolveLocomotionState();
            UpdateAnimator();
        }

        private void FixedUpdate()
        {
            if (stateMachine.Current is PlayerState.Dead or PlayerState.Hurt) return;
            movement?.ApplyHorizontalVelocity();
        }

        private void ResolveLocomotionState()
        {
            if (stateMachine.Current is PlayerState.Attack or PlayerState.Skill or PlayerState.Dash or PlayerState.Hurt or PlayerState.Dead)
            {
                if (stateMachine.Current == PlayerState.Dash && movement != null && !movement.IsDashing)
                {
                    stateMachine.TryChange(Mathf.Abs(movement.MoveX) > 0.01f ? PlayerState.Run : PlayerState.Idle);
                }
                if (stateMachine.Current == PlayerState.Attack && combat != null && !combat.IsAttacking)
                {
                    stateMachine.TryChange(Mathf.Abs(movement.MoveX) > 0.01f ? PlayerState.Run : PlayerState.Idle);
                }
                return;
            }

            if (movement == null) return;
            if (!movement.IsGrounded)
            {
                stateMachine.TryChange(PlayerState.Fall);
            }
            else if (Mathf.Abs(movement.MoveX) > 0.01f)
            {
                stateMachine.TryChange(PlayerState.Run);
            }
            else
            {
                stateMachine.TryChange(PlayerState.Idle);
            }
        }

        private IEnumerator SkillStubRoutine()
        {
            yield return new WaitForSeconds(0.25f);
            stateMachine.TryChange(movement != null && Mathf.Abs(movement.MoveX) > 0.01f ? PlayerState.Run : PlayerState.Idle);
        }

        private void OnDamaged(DamageInfo damage)
        {
            if (stateMachine.Current == PlayerState.Dead) return;
            combat?.CancelAttack();
            knockback?.Apply(damage.Direction, damage.KnockbackDistance);
            cameraShake?.Shake(GameConstants.CameraShakeMaxSeconds, 1.0f);
            if (hurtRoutine != null) StopCoroutine(hurtRoutine);
            hurtRoutine = StartCoroutine(HurtRoutine());
        }

        private IEnumerator HurtRoutine()
        {
            stateMachine.Force(PlayerState.Hurt);
            HitstopManager.Instance?.StopFor(GameConstants.PlayerHurtStopSeconds);
            yield return new WaitForSeconds(GameConstants.HurtLockSeconds);
            if (stateMachine.Current != PlayerState.Dead) stateMachine.TryChange(PlayerState.Idle);
            hurtRoutine = null;
        }

        private void OnDied()
        {
            combat?.CancelAttack();
            stateMachine.Force(PlayerState.Dead);
            UpdateAnimator();
        }

        private void UpdateAnimator()
        {
            if (!animator) return;
            animator.SetInteger("State", (int)stateMachine.Current);
            animator.SetInteger("ComboIndex", combat ? combat.ComboIndex : 0);
            animator.SetFloat("MoveX", movement ? Mathf.Abs(movement.MoveX) : 0f);
            animator.SetBool("Grounded", movement && movement.IsGrounded);
        }
    }
}
