using GhostMarket.Core;

namespace GhostMarket.Player
{
    public class PlayerStateMachine
    {
        public PlayerState Current { get; private set; } = PlayerState.Idle;

        public bool TryChange(PlayerState next)
        {
            if (!CanChange(Current, next)) return false;
            Current = next;
            return true;
        }

        public void Force(PlayerState next)
        {
            Current = next;
        }

        public static bool CanChange(PlayerState from, PlayerState to)
        {
            if (from == PlayerState.Dead) return false;
            if (from == to) return true;

            return from switch
            {
                PlayerState.Idle => to is PlayerState.Run or PlayerState.Jump or PlayerState.Attack or PlayerState.Dash or PlayerState.Skill,
                PlayerState.Run => to is PlayerState.Idle or PlayerState.Jump or PlayerState.Attack or PlayerState.Dash or PlayerState.Skill,
                PlayerState.Jump => to is PlayerState.Fall or PlayerState.Attack or PlayerState.Skill or PlayerState.Hurt or PlayerState.Dead,
                PlayerState.Fall => to is PlayerState.Idle or PlayerState.Attack or PlayerState.Skill or PlayerState.Hurt or PlayerState.Dead,
                PlayerState.Attack => to is PlayerState.Idle or PlayerState.Run or PlayerState.Attack or PlayerState.Dash or PlayerState.Hurt or PlayerState.Dead,
                PlayerState.Dash => to is PlayerState.Idle or PlayerState.Run or PlayerState.Fall or PlayerState.Hurt or PlayerState.Dead,
                PlayerState.Skill => to is PlayerState.Idle or PlayerState.Run or PlayerState.Fall or PlayerState.Hurt or PlayerState.Dead,
                PlayerState.Hurt => to is PlayerState.Idle or PlayerState.Dead,
                _ => false
            };
        }
    }
}
