using GhostMarket.Core;
using UnityEngine;

namespace GhostMarket.Rooms
{
    public class RunManager : MonoBehaviour
    {
        [SerializeField] private RoomManager roomManager;
        [SerializeField] private RoomDefinition[] route;

        private int roomIndex;
        public int RoomsCleared { get; private set; }
        public bool BossKilled { get; private set; }

        private void Awake()
        {
            if (roomManager) roomManager.RoomCleared += OnRoomCleared;
        }

        private void OnDestroy()
        {
            if (roomManager) roomManager.RoomCleared -= OnRoomCleared;
        }

        public void StartRun()
        {
            roomIndex = 0;
            RoomsCleared = 0;
            BossKilled = false;
            LoadCurrentRoom();
        }

        public void AdvanceRoom()
        {
            roomIndex++;
            LoadCurrentRoom();
        }

        private void LoadCurrentRoom()
        {
            if (!roomManager || route == null || roomIndex >= route.Length) return;
            roomManager.StartRoom(route[roomIndex]);
        }

        private void OnRoomCleared(RoomDefinition room)
        {
            RoomsCleared++;
            if (room != null && room.type == RoomType.Boss) BossKilled = true;
        }
    }
}
