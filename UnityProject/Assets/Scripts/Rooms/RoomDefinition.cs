using GhostMarket.Core;
using UnityEngine;

namespace GhostMarket.Rooms
{
    [CreateAssetMenu(menuName = "Ghost Market/Room Definition")]
    public class RoomDefinition : ScriptableObject
    {
        public string roomId;
        public RoomType type;
        public GameObject roomPrefab;
        public GameObject[] enemyPrefabs;
        public GameObject eliteRewardPrefab;
    }
}
