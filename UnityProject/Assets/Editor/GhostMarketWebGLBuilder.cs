using System.IO;
using GhostMarket.Playable;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEditor.WebGL;
using UnityEngine;

namespace GhostMarket.EditorTools
{
    public static class GhostMarketWebGLBuilder
    {
        public static void Build()
        {
            const string sceneDir = "Assets/Scenes";
            const string scenePath = "Assets/Scenes/GhostMarketPlayable.unity";
            Directory.CreateDirectory(sceneDir);

            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var cameraObject = new GameObject("Main Camera");
            var camera = cameraObject.AddComponent<Camera>();
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = Color.black;
            camera.orthographic = true;
            camera.orthographicSize = 360;
            cameraObject.tag = "MainCamera";

            var game = new GameObject("GhostMarketPlayable");
            game.AddComponent<GhostMarketPlayable>();

            EditorSceneManager.SaveScene(scene, scenePath);
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(scenePath, true) };

            EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.WebGL, BuildTarget.WebGL);
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Disabled;
            PlayerSettings.WebGL.decompressionFallback = true;
            var options = new BuildPlayerOptions
            {
                scenes = new[] { scenePath },
                locationPathName = "Build/WebGL",
                target = BuildTarget.WebGL,
                options = BuildOptions.None
            };
            var report = BuildPipeline.BuildPlayer(options);
            if (report.summary.result != UnityEditor.Build.Reporting.BuildResult.Succeeded)
            {
                throw new System.Exception($"WebGL build failed: {report.summary.result}");
            }

            PatchPagesFriendlyWebGLOutput();
        }

        private static void PatchPagesFriendlyWebGLOutput()
        {
            const string output = "Build/WebGL";
            var workerPath = Path.Combine(output, "Build", "WebGL.worker.js");
            File.WriteAllText(workerPath, "self.onmessage = function () {};\n");

            var indexPath = Path.Combine(output, "index.html");
            var html = File.ReadAllText(indexPath);
            if (!html.Contains("workerUrl:"))
            {
                html = html.Replace(
                    "codeUrl: buildUrl + \"/WebGL.wasm\",",
                    "codeUrl: buildUrl + \"/WebGL.wasm\",\n        workerUrl: buildUrl + \"/WebGL.worker.js\",");
            }
            File.WriteAllText(indexPath, html);
        }
    }
}
