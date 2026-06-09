using UnityEngine;

namespace GhostMarket.Core
{
    public static class PauseController
    {
        public static bool IsPaused { get; private set; }

        public static void TogglePause()
        {
            SetPaused(!IsPaused);
        }

        public static void SetPaused(bool paused)
        {
            IsPaused = paused;
            Time.timeScale = paused ? 0f : 1f;
        }
    }
}
