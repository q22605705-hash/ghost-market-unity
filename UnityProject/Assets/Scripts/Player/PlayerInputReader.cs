using UnityEngine;

namespace GhostMarket.Player
{
    public class PlayerInputReader : MonoBehaviour
    {
        public PlayerInputFrame ReadFrame()
        {
            var frame = new PlayerInputFrame
            {
                MoveX = GetMoveX(),
                JumpPressed = Input.GetKeyDown(KeyCode.Space),
                DashPressed = Input.GetKeyDown(KeyCode.LeftShift) || Input.GetKeyDown(KeyCode.RightShift),
                LightAttackPressed = Input.GetKeyDown(KeyCode.J) || Input.GetMouseButtonDown(0),
                HeavyAttackPressed = Input.GetKeyDown(KeyCode.K) || Input.GetMouseButtonDown(1),
                SkillQPressed = Input.GetKeyDown(KeyCode.Q),
                SkillEPressed = Input.GetKeyDown(KeyCode.E),
                SkillRPressed = Input.GetKeyDown(KeyCode.R),
                PausePressed = Input.GetKeyDown(KeyCode.Escape)
            };
            return frame;
        }

        private static float GetMoveX()
        {
            var x = 0f;
            if (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow)) x -= 1f;
            if (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow)) x += 1f;
            return Mathf.Clamp(x, -1f, 1f);
        }
    }
}
