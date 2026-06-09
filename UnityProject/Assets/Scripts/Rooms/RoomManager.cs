using System;
using System.Collections.Generic;
using GhostMarket.Core;
using GhostMarket.Combat;
using UnityEngine;

namespace GhostMarket.Rooms
{
    public class RoomManager : MonoBehaviour
    {
        [SerializeField] private RoomDefinition currentRoom;
        [SerializeField] private Transform[] spawnPoints;
        [SerializeField] private GameObject exitDoor;

        private readonly List<HealthComponent> trackedEnemies = new();
        private bool eventResolved;

        public event Action<RoomDefinition> RoomCleared;

        public void StartRoom(RoomDefinition room)
        {
            currentRoom = room;
            trackedEnemies.Clear();
            eventResolved = false;
            SetDoorOpen(false);

            if (room == null)
            {
                ClearRoom();
                return;
            }

            switch (room.type)
            {
                case RoomType.Combat:
                case RoomType.Elite:
                case RoomType.Boss:
                    SpawnEnemies(room);
                    break;
                case RoomType.Shop:
                    ClearRoom();
                    break;
            }
        }

        public void ResolveEventRoom()
        {
            if (currentRoom != null && currentRoom.type == RoomType.Event)
            {
                eventResolved = true;
                ClearRoom();
            }
        }

        private void SpawnEnemies(RoomDefinition room)
        {
            for (var i = 0; i < room.enemyPrefabs.Length; i++)
            {
                var prefab = room.enemyPrefabs[i];
                if (!prefab) continue;
                var point = spawnPoints.Length > 0 ? spawnPoints[i % spawnPoints.Length] : transform;
                var enemy = Instantiate(prefab, point.position, Quaternion.identity);
                var health = enemy.GetComponentInChildren<HealthComponent>();
                if (!health) continue;
                trackedEnemies.Add(health);
                health.Died += CheckCombatClear;
            }
            CheckCombatClear();
        }

        private void CheckCombatClear()
        {
            trackedEnemies.RemoveAll(enemy => !enemy || !enemy.IsAlive);
            if (trackedEnemies.Count == 0) ClearRoom();
        }

        private void ClearRoom()
        {
            if (currentRoom != null && currentRoom.type == RoomType.Event && !eventResolved) return;
            SetDoorOpen(true);
            RoomCleared?.Invoke(currentRoom);
        }

        private void SetDoorOpen(bool open)
        {
            if (exitDoor) exitDoor.SetActive(!open);
        }
    }
}
