using System.Collections;
using UnityEngine;

namespace GhostMarket.Combat
{
    public class KnockbackComponent : MonoBehaviour
    {
        [SerializeField] private Rigidbody2D body;
        [SerializeField] private float knockbackSeconds = 0.12f;

        private Coroutine routine;

        private void Reset()
        {
            body = GetComponent<Rigidbody2D>();
        }

        public void Apply(Vector2 direction, float distance)
        {
            if (!body || distance <= 0f) return;
            if (routine != null) StopCoroutine(routine);
            routine = StartCoroutine(KnockbackRoutine(direction.normalized, distance));
        }

        private IEnumerator KnockbackRoutine(Vector2 direction, float distance)
        {
            var velocity = direction * (distance / Mathf.Max(0.02f, knockbackSeconds));
            body.linearVelocity = new Vector2(velocity.x, Mathf.Max(body.linearVelocity.y, velocity.y));
            yield return new WaitForSeconds(knockbackSeconds);
            routine = null;
        }
    }
}
