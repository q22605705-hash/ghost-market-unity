using System.Collections;
using UnityEngine;

namespace GhostMarket.Combat
{
    public class HitstopManager : MonoBehaviour
    {
        public static HitstopManager Instance { get; private set; }

        private Coroutine routine;

        private void Awake()
        {
            if (Instance && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        public void StopFor(float seconds)
        {
            if (seconds <= 0f) return;
            if (routine != null) StopCoroutine(routine);
            routine = StartCoroutine(StopRoutine(seconds));
        }

        private IEnumerator StopRoutine(float seconds)
        {
            var previousScale = Time.timeScale;
            Time.timeScale = 0f;
            yield return new WaitForSecondsRealtime(seconds);
            Time.timeScale = previousScale;
            routine = null;
        }
    }
}
