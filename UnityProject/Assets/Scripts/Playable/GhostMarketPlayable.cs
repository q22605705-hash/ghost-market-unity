using System.Collections.Generic;
using UnityEngine;

namespace GhostMarket.Playable
{
    public class GhostMarketPlayable : MonoBehaviour
    {
        private enum State { Idle, Run, Jump, Fall, Dash, Attack, Skill, Hurt, Dead }

        private struct Enemy
        {
            public Rect Rect;
            public float Hp;
            public float MaxHp;
            public float HurtFlash;
            public bool Elite;
        }

        private readonly List<Enemy> enemies = new();
        private readonly List<Rect> platforms = new();
        private Texture2D white = null!;
        private Rect player;
        private Vector2 velocity;
        private State state;
        private float hp;
        private float stamina;
        private float invulnerableUntil;
        private float dashUntil;
        private float attackUntil;
        private float skillUntil;
        private float hurtUntil;
        private float hitstopUntil;
        private float shakeUntil;
        private float shakePower;
        private int facing = 1;
        private int combo;
        private float comboWindowUntil;
        private int room = 1;
        private int soulFire;
        private bool paused;
        private bool won;
        private bool runStarted;
        private string message = "A/D or Arrows move | Space jump | Shift dodge | J/LMB light | K/RMB heavy | Q/E/R charm | Esc pause";

        private const float GroundY = 472f;
        private const float Gravity = 2200f;
        private const float MoveSpeed = 320f;
        private const float JumpSpeed = 760f;
        private const float DashSpeed = 760f;

        private void Awake()
        {
            white = new Texture2D(1, 1);
            white.SetPixel(0, 0, Color.white);
            white.Apply();
            ResetRun();
        }

        private void ResetRun()
        {
            player = new Rect(140, GroundY - 92, 46, 92);
            velocity = Vector2.zero;
            state = State.Idle;
            hp = 100;
            stamina = 100;
            invulnerableUntil = 0;
            dashUntil = 0;
            attackUntil = 0;
            skillUntil = 0;
            hurtUntil = 0;
            hitstopUntil = 0;
            shakeUntil = 0;
            facing = 1;
            combo = 0;
            room = 1;
            soulFire = 0;
            won = false;
            paused = false;
            runStarted = false;
            BuildPlatforms();
            SpawnRoom();
            message = "UNITY WEBGL BUILD. Press A/D, Space, J, K, Q/E/R, or click to start.";
        }

        private void BuildPlatforms()
        {
            platforms.Clear();
            platforms.Add(new Rect(0, GroundY, 1280, 120));
            platforms.Add(new Rect(330, 360, 180, 22));
            platforms.Add(new Rect(680, 305, 210, 22));
            platforms.Add(new Rect(980, 380, 180, 22));
        }

        private void SpawnRoom()
        {
            enemies.Clear();
            var count = Mathf.Min(2 + room, 8);
            for (var i = 0; i < count; i++)
            {
                var elite = room % 3 == 0 && i == count - 1;
                enemies.Add(new Enemy
                {
                    Rect = new Rect(700 + i * 86, GroundY - (elite ? 86 : 62), elite ? 58 : 42, elite ? 86 : 62),
                    MaxHp = elite ? 95 + room * 12 : 42 + room * 7,
                    Hp = elite ? 95 + room * 12 : 42 + room * 7,
                    Elite = elite
                });
            }
            message = room >= 6 ? "Boss room: kill the mask god." : "Combat room: clear enemies to open the next gate.";
        }

        private void Update()
        {
            if (Input.GetKeyDown(KeyCode.Escape)) paused = !paused;
            if (Input.GetKeyDown(KeyCode.Return) && (state == State.Dead || won)) ResetRun();
            if (paused || state == State.Dead || won) return;

            var now = Time.time;
            if (now < hitstopUntil) return;

            var dt = Time.deltaTime;
            for (var i = 0; i < enemies.Count; i++)
            {
                var e = enemies[i];
                e.HurtFlash = Mathf.Max(0, e.HurtFlash - dt);
                enemies[i] = e;
            }

            ReadInput(now);
            SimulatePlayer(dt, now);
            if (runStarted) SimulateEnemies(dt, now);
            ResolveRoom();
        }

        private void ReadInput(float now)
        {
            var anyAction =
                Input.anyKeyDown ||
                Input.GetMouseButtonDown(0) ||
                Input.GetMouseButtonDown(1) ||
                Mathf.Abs(Input.GetAxisRaw("Horizontal")) > 0.01f;
            if (anyAction && !runStarted)
            {
                runStarted = true;
                message = "Combat room: clear enemies to open the next gate.";
            }

            var move = 0f;
            if (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow)) move -= 1;
            if (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow)) move += 1;
            if (Mathf.Abs(move) > 0.01f) facing = move > 0 ? 1 : -1;

            if (now < hurtUntil) return;

            if (Input.GetKeyDown(KeyCode.LeftShift) || Input.GetKeyDown(KeyCode.RightShift))
            {
                dashUntil = now + 0.22f;
                invulnerableUntil = now + 0.25f;
                state = State.Dash;
            }

            var light = Input.GetKeyDown(KeyCode.J) || Input.GetMouseButtonDown(0);
            var heavy = Input.GetKeyDown(KeyCode.K) || Input.GetMouseButtonDown(1);
            if (light || heavy)
            {
                combo = now <= comboWindowUntil ? (combo % 3) + 1 : 1;
                comboWindowUntil = now + 0.45f;
                attackUntil = now + (heavy ? 0.42f : 0.28f);
                state = State.Attack;
                ResolveAttack(heavy, now);
            }

            if (Input.GetKeyDown(KeyCode.Q) || Input.GetKeyDown(KeyCode.E) || Input.GetKeyDown(KeyCode.R))
            {
                skillUntil = now + 0.35f;
                state = State.Skill;
                ResolveSkill(now);
            }

            velocity.x = move * MoveSpeed;
        }

        private void SimulatePlayer(float dt, float now)
        {
            var grounded = IsGrounded();
            if (Input.GetKeyDown(KeyCode.Space) && grounded && now >= hurtUntil)
            {
                velocity.y = -JumpSpeed;
                state = State.Jump;
            }

            if (now < dashUntil)
            {
                velocity.x = facing * DashSpeed;
                velocity.y = 0;
            }
            else
            {
                velocity.y += Gravity * dt;
            }

            player.x += velocity.x * dt;
            player.y += velocity.y * dt;
            player.x = Mathf.Clamp(player.x, 24, 1220);
            ResolvePlatformCollisions();

            if (now < hurtUntil) state = State.Hurt;
            else if (now < attackUntil) state = State.Attack;
            else if (now < skillUntil) state = State.Skill;
            else if (now < dashUntil) state = State.Dash;
            else if (!IsGrounded()) state = velocity.y < 0 ? State.Jump : State.Fall;
            else if (Mathf.Abs(velocity.x) > 1) state = State.Run;
            else state = State.Idle;
        }

        private void ResolvePlatformCollisions()
        {
            foreach (var p in platforms)
            {
                if (player.Overlaps(p) && velocity.y >= 0 && player.yMax - velocity.y * Time.deltaTime <= p.y + 10)
                {
                    player.y = p.y - player.height;
                    velocity.y = 0;
                }
            }
        }

        private bool IsGrounded()
        {
            var feet = new Rect(player.x + 4, player.yMax, player.width - 8, 3);
            foreach (var p in platforms)
            {
                if (feet.Overlaps(p)) return true;
            }
            return false;
        }

        private void SimulateEnemies(float dt, float now)
        {
            for (var i = enemies.Count - 1; i >= 0; i--)
            {
                var e = enemies[i];
                var dir = Mathf.Sign(player.center.x - e.Rect.center.x);
                e.Rect.x += dir * (e.Elite ? 85 : 120) * dt;
                if (e.Rect.Overlaps(player) && now > invulnerableUntil)
                {
                    hp -= e.Elite ? 18 : 11;
                    invulnerableUntil = now + 0.8f;
                    hurtUntil = now + 0.3f;
                    hitstopUntil = now + 0.12f;
                    shakeUntil = now + 0.12f;
                    shakePower = 8f;
                    velocity.x = -dir * 260;
                    if (hp <= 0) state = State.Dead;
                }
                enemies[i] = e;
            }
        }

        private void ResolveAttack(bool heavy, float now)
        {
            var range = heavy ? 122f : 88f;
            var hit = new Rect(facing > 0 ? player.xMax : player.x - range, player.y + 12, range, 58);
            var any = false;
            for (var i = enemies.Count - 1; i >= 0; i--)
            {
                var e = enemies[i];
                if (!hit.Overlaps(e.Rect)) continue;
                any = true;
                e.Hp -= heavy ? 34 : 20;
                e.HurtFlash = 0.12f;
                e.Rect.x += facing * (heavy ? 82 : 34);
                if (e.Hp <= 0)
                {
                    soulFire += e.Elite ? 5 : 2;
                    enemies.RemoveAt(i);
                }
                else
                {
                    enemies[i] = e;
                }
            }
            if (any)
            {
                hitstopUntil = now + (heavy ? 0.10f : 0.06f);
                shakeUntil = now + (heavy ? 0.15f : 0.08f);
                shakePower = heavy ? 7f : 4f;
            }
        }

        private void ResolveSkill(float now)
        {
            for (var i = enemies.Count - 1; i >= 0; i--)
            {
                var e = enemies[i];
                if (Mathf.Abs(e.Rect.center.x - player.center.x) > 220 || Mathf.Abs(e.Rect.center.y - player.center.y) > 120) continue;
                e.Hp -= 26;
                e.HurtFlash = 0.16f;
                if (e.Hp <= 0)
                {
                    soulFire += e.Elite ? 5 : 2;
                    enemies.RemoveAt(i);
                }
                else enemies[i] = e;
            }
            hitstopUntil = now + 0.08f;
            shakeUntil = now + 0.12f;
            shakePower = 6f;
        }

        private void ResolveRoom()
        {
            if (enemies.Count > 0) return;
            room++;
            if (room > 6)
            {
                won = true;
                message = "Run cleared. Press Enter to restart.";
                return;
            }
            SpawnRoom();
        }

        private void OnGUI()
        {
            var offset = Vector2.zero;
            if (Time.time < shakeUntil) offset = Random.insideUnitCircle * shakePower;
            GUI.matrix = Matrix4x4.TRS(offset, Quaternion.identity, Vector3.one);
            DrawRect(new Rect(0, 0, Screen.width, Screen.height), new Color(0.04f, 0.06f, 0.08f));
            DrawBackdrop();
            foreach (var p in platforms) DrawPlatform(p);
            foreach (var e in enemies) DrawEnemy(e);
            DrawPlayer();
            DrawHud();
            GUI.matrix = Matrix4x4.identity;
        }

        private void DrawBackdrop()
        {
            DrawRect(new Rect(0, 0, 1280, 520), new Color(0.03f, 0.09f, 0.12f));
            for (var i = 0; i < 12; i++)
            {
                var x = i * 128 + Mathf.Sin(i) * 24;
                DrawRect(new Rect(x, 150 + (i % 3) * 42, 92, 260), new Color(0.07f, 0.10f, 0.12f));
                DrawRect(new Rect(x + 16, 180 + (i % 4) * 18, 10, 22), new Color(0.90f, 0.45f, 0.18f));
            }
            DrawRect(new Rect(0, GroundY - 18, 1280, 70), new Color(0.32f, 0.23f, 0.18f));
        }

        private void DrawPlatform(Rect r)
        {
            DrawRect(r, new Color(0.30f, 0.21f, 0.15f));
            DrawRect(new Rect(r.x, r.y, r.width, 10), new Color(0.55f, 0.36f, 0.22f));
            for (var x = r.x + 36; x < r.xMax; x += 58) DrawRect(new Rect(x, r.y + 3, 2, r.height - 6), new Color(0.16f, 0.10f, 0.08f));
        }

        private void DrawPlayer()
        {
            var flash = Time.time < invulnerableUntil && Mathf.FloorToInt(Time.time * 18) % 2 == 0;
            DrawRect(player, flash ? Color.white : new Color(0.12f, 0.70f, 0.74f));
            DrawRect(new Rect(player.x + 8, player.y + 10, 30, 36), new Color(0.16f, 0.16f, 0.20f));
            DrawRect(new Rect(player.x + (facing > 0 ? 34 : -18), player.y + 42, 28, 8), new Color(0.90f, 0.80f, 0.50f));
            if (state == State.Attack)
            {
                DrawRect(new Rect(facing > 0 ? player.xMax : player.x - 82, player.y + 18, 82, 28), new Color(0.8f, 1f, 0.95f, 0.45f));
            }
        }

        private void DrawEnemy(Enemy e)
        {
            DrawRect(e.Rect, e.HurtFlash > 0 ? Color.white : e.Elite ? new Color(0.72f, 0.20f, 0.18f) : new Color(0.95f, 0.75f, 0.25f));
            DrawRect(new Rect(e.Rect.x, e.Rect.y - 10, e.Rect.width, 5), new Color(0.15f, 0.08f, 0.08f));
            DrawRect(new Rect(e.Rect.x, e.Rect.y - 10, e.Rect.width * Mathf.Clamp01(e.Hp / e.MaxHp), 5), new Color(0.95f, 0.20f, 0.22f));
        }

        private void DrawHud()
        {
            DrawRect(new Rect(16, 16, 500, 94), new Color(0.02f, 0.03f, 0.04f, 0.78f));
            GUI.color = Color.white;
            GUI.Label(new Rect(28, 20, 460, 24), "UNITY WEBGL BUILD - Ghost Market Prototype");
            GUI.Label(new Rect(28, 44, 300, 24), $"State: {state}   Combo: {combo}   Room: {room}");
            GUI.Label(new Rect(28, 68, 430, 24), $"HP {Mathf.CeilToInt(hp)}   Stamina {Mathf.CeilToInt(stamina)}   SoulFire {soulFire}");
            GUI.Label(new Rect(28, Screen.height - 42, 900, 28), message);
            if (paused) GUI.Label(new Rect(560, 300, 220, 40), "PAUSED");
            if (state == State.Dead) GUI.Label(new Rect(500, 300, 380, 40), "DEAD - Press Enter to restart");
            if (won) GUI.Label(new Rect(470, 300, 430, 40), "CLEARED - Press Enter to restart");
        }

        private void DrawRect(Rect rect, Color color)
        {
            GUI.color = color;
            GUI.DrawTexture(rect, white);
            GUI.color = Color.white;
        }
    }
}
