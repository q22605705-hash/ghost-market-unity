$ErrorActionPreference = "Stop"

$UnityPath = "C:\Program Files\Unity\Hub\Editor\6000.0.40f1\Editor\Unity.exe"
$MirrorPath = "C:\UnityProjects\GhostMarketUnity"
$SourcePath = $PSScriptRoot

if (-not (Test-Path -LiteralPath $UnityPath)) {
    throw "Unity Editor not found: $UnityPath"
}

if ($SourcePath -ine $MirrorPath) {
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $MirrorPath) | Out-Null
    robocopy $SourcePath $MirrorPath /E /XD Library Temp UserSettings Logs /NFL /NDL /NJH /NJS /NC /NS | Out-Null
    if ($LASTEXITCODE -gt 7) {
        throw "Failed to sync Unity project to $MirrorPath"
    }
}

$unityArgs = @("-projectPath", $MirrorPath) + $args
$process = Start-Process -FilePath $UnityPath -ArgumentList $unityArgs -NoNewWindow -Wait -PassThru
exit $process.ExitCode
