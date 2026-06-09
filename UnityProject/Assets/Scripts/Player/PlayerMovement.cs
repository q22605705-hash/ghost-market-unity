using System.Collections;
using GhostMarket.Core;
using GhostMarket.Combat;
using UnityEngine;

namespace GhostMarket.Player
{
    public class PlayerMovement : MonoBehaviour
    {
        [SerializeField] private Rigidbody2D body;
        [SerializeField] private HealthComponent health;
        [SerializeField] private float moveSpeed = 7f;
        [SerializeField] private float jumpForce = 13f;
        [SerializeField] private float dashSpeed = 18f;
        [SerializeField] private float dashSeconds = 0.18f;
        [SerializeField] private Transform groundCheck;
        [SerializeField] private float groundCheckRadius = 0.12f;
        [SerializeField] private LayerMask groundMask;

        private Coroutine dashRoutine;

        public bool IsGrounded { get; private set; }
        public bool IsDashing { get; private set; }
        public int Facing { get; private set; } = 1;
        public float MoveX { get; private set; }

        private void Reset()
        {
            body = GetComponent<Rigidbody2D>();
            health = GetComponent<HealthComponent>();
        }

        private void Update()
        {
            if (groundCheck)
            {
                IsGrounded = Physics2D.OverlapCircle(groundCheck.position, groundCheckRadius, groundMask);
            }
        }

        public void SetMove(float x)
        {
            MoveX = Mathf.Clamp(x, -1f, 1f);
            if (Mathf.Abs(MoveX) > 0.01f) Facing = MoveX > 0 ? 1 : -1;
        }

        public void ApplyHorizontalVelocity()
        {
            if (IsDashing || !body) return;
            body.linearVelocity = new Vector2(MoveX * moveSpeed, body.linearVelocity.y);
        }

        public void Jump()
        {
            if (!body || !IsGrounded || IsDashing) return;
            body.linearVelocity = new Vector2(body.linearVelocity.x, jumpForce);
        }

        public bool TryDash()
        {
            if (IsDashing || !body) return false;
            dashRoutine = StartCoroutine(DashRoutine());
            return true;
        }

        private IEnumerator DashRoutine()
        {
            IsDashing = true;
            health?.SetInvulnerable(GameConstants.DashInvulnerableSeconds);
            var timer = 0f;
            while (timer < dashSeconds)
            {
                timer += Time.deltaTime;
                body.linearVelocity = new Vector2(Facing * dashSpeed, 0f);
                yield return null;
            }
            IsDashing = false;
            dashRoutine = null;
        }
    }
}
