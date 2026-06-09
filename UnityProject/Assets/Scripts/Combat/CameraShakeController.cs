using System.Collections;
using UnityEngine;

namespace GhostMarket.Combat
{
    public class CameraShakeController : MonoBehaviour
    {
        [SerializeField] private Transform targetCamera;
        [SerializeField] private float defaultAmplitude = 0.08f;

        private Vector3 originalLocalPosition;
        private Coroutine routine;

        private void Awake()
        {
            if (!targetCamera && Camera.main) targetCamera = Camera.main.transform;
            if (targetCamera) originalLocalPosition = targetCamera.localPosition;
        }

        public void Shake(float duration, float amplitudeMultiplier = 1f)
        {
            if (!targetCamera) return;
            if (routine != null) StopCoroutine(routine);
            routine = StartCoroutine(ShakeRoutine(duration, defaultAmplitude * amplitudeMultiplier));
        }

        private IEnumerator ShakeRoutine(float duration, float amplitude)
        {
            var timer = 0f;
            while (timer < duration)
            {
                timer += Time.unscaledDeltaTime;
                var offset = Random.insideUnitCircle * amplitude;
                targetCamera.localPosition = originalLocalPosition + new Vector3(offset.x, offset.y, 0f);
                yield return null;
            }
            targetCamera.localPosition = originalLocalPosition;
            routine = null;
        }
    }
}
