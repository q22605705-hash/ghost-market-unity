# Ghost Market Unity

Unity 2D action roguelite framework for Ghost Market.

## Project

Open the Unity project from:

```powershell
UnityProject
```

The project targets Unity `6000.0.40f1` and uses Unity 2D Animation, Physics 2D, Cinemachine, UGUI, Timeline, and Visual Scripting packages.

## CLI

Because Unity Package Manager can fail on Windows paths containing Chinese characters, the helper script mirrors the project to `C:\UnityProjects\GhostMarketUnity` before launching Unity:

```powershell
& ".\UnityProject\unity-cli.ps1" -batchmode -quit
```

The helper was verified with Unity batchmode and compiled `GhostMarket.dll` successfully.
