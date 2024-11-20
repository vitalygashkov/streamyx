$ErrorActionPreference = 'Stop'

# Repository information
$Repo = "vitalygashkov/streamyx"
$GithubApi = "https://api.github.com/repos/$Repo/releases/latest"

function Write-Message {
    param([string]$Message)
    Write-Host "==> $Message" -ForegroundColor Blue
}

function Get-LatestVersion {
    $release = Invoke-RestMethod -Uri $GithubApi
    return $release.tag_name
}

function Get-Architecture {
    if ([Environment]::Is64BitOperatingSystem) {
        return "x64"
    } else {
        return "x86"
    }
}

function Download-AndInstall {
    $arch = Get-Architecture
    $version = Get-LatestVersion
    $filename = "streamyx-$arch-win.zip"
    $downloadUrl = "https://github.com/$Repo/releases/download/$version/$filename"

    # Create temporary directory
    $tmpDir = Join-Path $env:TEMP ([System.Guid]::NewGuid().ToString())
    New-Item -ItemType Directory -Path $tmpDir | Out-Null

    try {
        Write-Message "Downloading Streamyx $version for Windows ($arch)..."
        $zipPath = Join-Path $tmpDir $filename
        Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath

        Write-Message "Extracting..."
        Expand-Archive -Path $zipPath -DestinationPath $tmpDir -Force

        Write-Message "Installing..."
        $exePath = Join-Path $tmpDir "streamyx.exe"
        Start-Process -FilePath $exePath -ArgumentList "install" -Wait

        Write-Message "Cleaning up..."
        Remove-Item -Path $tmpDir -Recurse -Force

        Write-Host "Streamyx has been successfully installed!" -ForegroundColor Green
    }
    catch {
        Write-Host "Error: Installation failed - $_" -ForegroundColor Red
        if (Test-Path $tmpDir) {
            Remove-Item -Path $tmpDir -Recurse -Force
        }
        exit 1
    }
}

# Run the installation
Download-AndInstall
