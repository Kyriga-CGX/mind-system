#Requires -Version 5.1
<#
.SYNOPSIS
    Fotografa lo stato SOLO-locale di opencode (cio' che git non vede).
.DESCRIPTION
    sync.ps1 distribuisce il repo e lascia .bak sui file che sovrascrive, ma
    i file che esistono solo in locale - mind\barra.md (conoscenza appresa),
    mind-memory.json, opencode.jsonc (personalizzazioni), mind\sessions -
    non stanno in nessun repo: un disco che muore li porta via tutti.
    Questo script li chiude in uno zip timestampato in mind\backups con
    retention, e sa rimetterli al loro posto (-Restore).
    Non tocca i file sincronizzati da sync.ps1 e non duplica i suoi .bak.
.PARAMETER ConfigRoot
    Directory config globale di opencode. Default: $HOME/.config/opencode
.PARAMETER KeepBackups
    Zip da tenere. Default: 5
.PARAMETER Restore
    Ripristina uno snapshot (l'ultimo se -Stamp e' omesso). Prima fotografa
    lo stato corrente in un pre-restore-<stamp>.zip.
.PARAMETER Stamp
    Quale snapshot ripristinare (formato yyyyMMdd-HHmmss).
.PARAMETER ListBackups
    Elenca gli snapshot disponibili e esce.
.EXAMPLE
    .\backup-local.ps1
.EXAMPLE
    .\backup-local.ps1 -ListBackups
.EXAMPLE
    .\backup-local.ps1 -Restore
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [string]$ConfigRoot = (Join-Path $HOME '.config\opencode'),
    [int]$KeepBackups = 5,
    [switch]$Restore,
    [string]$Stamp,
    [switch]$ListBackups
)

$ErrorActionPreference = 'Stop'
$whatIf = [bool]$WhatIfPreference
$WhatIfPreference = $false
$runStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupDir = Join-Path $ConfigRoot 'mind\backups'

# percorsi relativi a ConfigRoot: l'unica fonte di verita' su cosa e' locale
$items = @('mind\barra.md', 'mind-memory.json', 'opencode.jsonc', 'mind\sessions')

function Get-Snapshots {
    if (-not (Test-Path -LiteralPath $backupDir)) { return @() }
    return @(Get-ChildItem -LiteralPath $backupDir -File -Filter 'locale-*.zip' -ErrorAction SilentlyContinue |
        Sort-Object Name -Descending)
}

if ($ListBackups) {
    $snaps = Get-Snapshots
    if ($snaps.Count -eq 0) { Write-Host 'Nessuno snapshot.'; return }
    Write-Host 'Snapshot (piu recente in alto):'
    foreach ($s in $snaps) {
        Write-Host ("  {0}  {1} KB" -f $s.BaseName, [math]::Round($s.Length / 1KB, 1))
    }
    return
}

function New-Snapshot {
    param([string]$Name)
    $existing = @()
    foreach ($rel in $items) {
        $p = Join-Path $ConfigRoot $rel
        if (Test-Path -LiteralPath $p) { $existing += $p }
        else { Write-Warning "assente, salto: $rel" }
    }
    if ($existing.Count -eq 0) { Write-Host 'Niente da fotografare.' -ForegroundColor Red; exit 1 }
    if ($whatIf) {
        Write-Host "WhatIf: creerei $Name con $($existing.Count) percorsi."
        foreach ($p in $existing) { Write-Host ("  + {0}" -f $p) }
        return $null
    }
    if (-not (Test-Path -LiteralPath $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    }
    $dest = Join-Path $backupDir $Name
    # Staging con la stessa struttura relativa a ConfigRoot: lo zip deve
    # ricordare DOVE sta ogni file, altrimenti il restore li sparge alla radice.
    $staging = Join-Path ([System.IO.Path]::GetTempPath()) ('mind-backup-stage-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
    try {
        foreach ($p in $existing) {
            $rel = $p.Substring($ConfigRoot.Length).TrimStart('\', '/')
            $t = Join-Path $staging $rel
            $tdir = Split-Path -Parent $t
            if (-not (Test-Path -LiteralPath $tdir)) {
                New-Item -ItemType Directory -Path $tdir -Force | Out-Null
            }
            Copy-Item -LiteralPath $p -Destination $t -Recurse -Force
        }
        Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $dest -Force
    }
    finally {
        Remove-Item -LiteralPath $staging -Recurse -Force -ErrorAction SilentlyContinue
    }
    return $dest
}

if ($Restore) {
    $snaps = Get-Snapshots
    if ($snaps.Count -eq 0) { Write-Host 'Nessuno snapshot da ripristinare.' -ForegroundColor Red; exit 1 }
    $target = $null
    if ($Stamp) { $target = $snaps | Where-Object { $_.BaseName -eq "locale-$Stamp" } | Select-Object -First 1 }
    else { $target = $snaps | Select-Object -First 1 }
    if (-not $target) { Write-Host "Nessuno snapshot '$Stamp'. Usa -ListBackups." -ForegroundColor Red; exit 1 }
    if ($whatIf) { Write-Host ("WhatIf: fotograferei lo stato corrente e ripristinerei da {0}." -f $target.Name); return }
    $pre = New-Snapshot -Name ("pre-restore-$runStamp.zip")
    Write-Host ("Stato corrente salvato in {0}." -f (Split-Path $pre -Leaf))
    Expand-Archive -LiteralPath $target.FullName -DestinationPath $ConfigRoot -Force
    Write-Host ("Ripristinato da {0}." -f $target.Name)
    return
}

$dest = New-Snapshot -Name ("locale-$runStamp.zip")
if ($whatIf) { Write-Host 'Snapshot NON creato (WhatIf).'; return }
$zip = Get-Item -LiteralPath $dest
Write-Host ("Snapshot: {0} ({1} KB)." -f $zip.Name, [math]::Round($zip.Length / 1KB, 1))

if ($KeepBackups -ge 1) {
    $all = @(Get-ChildItem -LiteralPath $backupDir -File -Filter 'locale-*.zip' |
        Sort-Object Name -Descending)
    $extra = @($all | Select-Object -Skip $KeepBackups)
    foreach ($e in $extra) {
        Remove-Item -LiteralPath $e.FullName -Force
        Write-Host ("  potato: {0}" -f $e.Name)
    }
}
Write-Host 'Backup completato.'
