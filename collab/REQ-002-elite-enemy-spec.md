# REQ-002 Elite Enemy Content Specs

Status: ready

These are content-only proposals for Claude to implement later. Codex did not edit runtime code or scripts.

## Elite 1: Mirror Lantern

- Kind id: `mirror_lantern`
- Display name: `鏡燈使`
- Role: ranged elite / angle-control pressure
- Combat fantasy: a shrine lantern spirit that bends talisman shots through mirrored flames, forcing the player to move diagonally instead of only kiting backward.

### Suggested Enemy Profile

```js
{
  baseHp: 92,
  hpPerMinute: 19,
  baseSpeed: 56,
  speedPerMinute: 2.2,
  baseDamage: 15,
  radius: 20,
  xp: 7
}
```

### Behavior

- Keeps medium range, similar to a mage but slower and tankier.
- Every 2.8-3.6 seconds, telegraphs a three-point mirror shot:
  - first marker appears at the lantern,
  - second marker appears offset left or right of the player,
  - final projectile travels from the offset marker toward the player.
- The projectile should be avoidable by moving perpendicular to the final line.
- When below 45% HP, the next shot splits into two weaker mirrored bolts.

### Visual/Readability Notes

- Telegraph color: amber core with pale teal rim.
- Projectile shape: small lantern flame or crescent mirror shard.
- Hit source label suggestion: `鏡燈法彈`.
- Do not reuse bomber death hazards; this enemy is about projectile angles, not ground denial.

### Stage Placement

- Introduce after the player has seen normal mages, around phase 2 or after 35-45 kills.
- Spawn rarely with skitters so the player must dodge both line pressure and contact pressure.

## Elite 2: Talisman Binder

- Kind id: `talisman_binder`
- Display name: `縛符師`
- Role: debuff elite / movement trap
- Combat fantasy: a talisman priest enemy that pins a small area with paper seals, briefly reducing player speed if the player crosses the marked zone.

### Suggested Enemy Profile

```js
{
  baseHp: 128,
  hpPerMinute: 23,
  baseSpeed: 44,
  speedPerMinute: 1.7,
  baseDamage: 12,
  radius: 22,
  xp: 8
}
```

### Behavior

- Moves slowly and tries to stay just outside orbit-blade range.
- Every 4.2-5.0 seconds, places two seal traps near the player's projected path.
- Seal traps arm after 0.55 seconds, last 3.0 seconds, and apply:
  - small damage on contact,
  - 35-45% slow for 0.9 seconds,
  - no hard stun.
- If the player never touches a seal, the trap expires harmlessly with a small paper-burn effect.

### Visual/Readability Notes

- Telegraph color: parchment gold plus purple outline.
- Trap should be a flat circular talisman seal, readable under enemies.
- Hit source label suggestion: `縛符陷阱`.
- Avoid full immobilize. The game is about flow and kiting; this enemy should punish careless pathing without stopping play.

### Stage Placement

- Introduce around phase 3 or as an elite event enemy.
- Pair with ghoul/brute waves, not heavy ranged waves, so the trap creates pathing decisions instead of unavoidable projectile clutter.

## Balance Intent

- `mirror_lantern` expands ranged pressure with readable angle attacks.
- `talisman_binder` expands ground/path pressure without copying bomber hazards.
- Both enemies should be rare elites, not baseline swarm units.
- Both should feed existing run-log/threat language with clear hit-source labels.
