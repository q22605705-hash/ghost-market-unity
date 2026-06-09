# 妖市獵人 Unity 2D Framework Spec

## Engine

- Unity 2022.3 LTS
- Unity 2D Animation / Spine-compatible structure
- PC Steam first

## Controls

- A/D or Arrow Keys: Move
- Space: Jump
- Shift: Dash / Dodge
- J / Left Mouse: Light Attack
- K / Right Mouse: Heavy Attack
- Q / E / R: Charm Skills
- Esc: Pause

## Player States

`PlayerState`

- Idle
- Run
- Jump
- Fall
- Dash
- Attack
- Skill
- Hurt
- Dead

Allowed transitions:

- Idle -> Run / Jump / Attack / Dash / Skill
- Run -> Idle / Jump / Attack / Dash / Skill
- Jump -> Fall / Attack / Skill / Hurt / Dead
- Fall -> Idle / Attack / Skill / Hurt / Dead
- Attack -> Idle / Run / ComboAttack / Dash / Hurt / Dead
- Dash -> Idle / Run / Fall / Hurt / Dead
- Skill -> Idle / Run / Fall / Hurt / Dead
- Hurt -> Idle / Dead
- Dead -> no input

Input never directly drives animation. Input creates requests. The state machine decides whether requests are legal.

## Animation Rules

The player root must be the foot-center point. The body can move relative to the root, but the root may not drift during idle, attack, hurt, or skill startup.

Required animation clips:

- Idle
- Run
- Jump
- Fall
- Dash
- LightAttack_1
- LightAttack_2
- LightAttack_3
- HeavyAttack
- Skill_Q
- Skill_E
- Skill_R
- Hurt
- Dead

Character art should be layered for Unity 2D Animation or Spine:

- Root
- Pelvis
- Torso
- Head
- UpperArm_L / UpperArm_R
- Forearm_L / Forearm_R
- Weapon
- Thigh_L / Thigh_R
- Shin_L / Shin_R
- Foot_L / Foot_R
- Scarf / Coat / Charms

Attack slash effects are independent VFX objects and must not move the player root.

## Combat Numbers

- Light attack hitstop: 60ms
- Heavy attack hitstop: 100ms
- Boss hit reaction hitstop: 40ms
- Player hurt stop: 120ms
- Normal enemy knockback: 20-40px
- Heavy attack knockback: 60-90px
- Camera shake: 0.08-0.15 seconds

## Combo

Light attack has up to 3 hits.

- Combo input window: 0.45 seconds
- Hit 1: horizontal slash, medium range, fast
- Hit 2: upper slash, vertical hitbox, can hit airborne enemies
- Hit 3: thrust, long range, higher knockback
- If input exceeds the combo window, return to hit 1
- Hurt cancels attack
- Dash may cancel some attack recovery
- Jump may cancel selected grounded recovery windows

## Invulnerability and Hurt

- Player invulnerable after hit: 0.8 seconds
- Dash invulnerability: first 0.25 seconds
- Hurt lock: 0.3 seconds
- Contact damage has cooldown
- Boss contact damage has cooldown
- Dead state blocks all input

## Room Clear Conditions

- Combat: clear all enemies, then open doors
- Event: resolve event choice, then open doors
- Shop: may leave immediately
- Elite: kill elite, grant upgrade, then open doors
- Boss: kill boss, then end run

## Save Format

```json
{
  "playerLevel": 1,
  "demonBone": 0,
  "soulFire": 0,
  "unlockedWeapons": ["starter_blade"],
  "unlockedCharms": ["basic_fire_charm"],
  "upgrades": {
    "maxHp": 0,
    "attackPower": 0,
    "dashCooldown": 0,
    "charmSlots": 0,
    "staminaMax": 0,
    "heavyAttackPower": 0
  },
  "bestRun": {
    "roomsCleared": 0,
    "bossKilled": 0
  },
  "settings": {
    "masterVolume": 1,
    "musicVolume": 0.8,
    "sfxVolume": 0.9
  }
}
```

## Acceptance Checklist

- Idle for 30 seconds: root/feet do not drift
- Light attack 20 times: player root does not move unless movement cancel is intended
- Heavy attack 20 times: knockback and recovery are stable
- Dash grants invulnerability for the first 0.25 seconds
- Player cannot take repeated contact damage during invulnerability
- Death -> restart does not duplicate HUD or stale room state
- Combat room opens after all enemies die
- Event room opens only after event resolution
- Boss room ends run after boss death
- Save/load keeps upgrades and best run data
