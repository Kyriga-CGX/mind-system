#Requires -Version 5.1
<#
.SYNOPSIS
    Verifica di accettazione di backup-local.ps1 su una root temporanea.
.DESCRIPTION
    Copre: snapshot con i 4 percorsi locali, restore dopo modifica,
    retention, -WhatIf che non scrive, percorsi assenti che non falliscono.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$script = Join-Path $repo 'backup-local.ps1'
$root = Join-Path ([System.IO.Path]::GetTempPath()) ('mind-backup-test-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
$cfg = Join-Path $root 'cfg'

$pass = 0
$fail = 0
function Check([bool]$ok, [string]$label, [string]$detail) {
    if ($ok) { $script:pass++; Write-Host "  PASS $label" }
    else { $script:fail++; Write-Host "  FAIL $label $detail" }
}

function ZipEntries([string]$zip) {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $z = [System.IO.Compression.ZipFile]::OpenRead($zip)
    try { return @($z.Entries | ForEach-Object { $_.FullName }) }
    finally { $z.Dispose() }
}

try {
    New-Item -ItemType Directory -Path (Join-Path $cfg 'mind\sessions') -Force | Out-Null
    Set-Content -Path (Join-Path $cfg 'mind\barra.md') -Value '# barra di prova'
    Set-Content -Path (Join-Path $cfg 'mind-memory.json') -Value '{ "prova": 1 }'
    Set-Content -Path (Join-Path $cfg 'opencode.jsonc') -Value '{ "mio": true }'
    Set-Content -Path (Join-Path $cfg 'mind\sessions\s1.md') -Value 'sessione'

    # --- 1) snapshot ---
    & $script -ConfigRoot $cfg | Out-Null
    $snaps = @(Get-ChildItem (Join-Path $cfg 'mind\backups') -Filter 'locale-*.zip')
    Check ($snaps.Count -eq 1) 'un solo snapshot creato'
    $entries = ZipEntries $snaps[0].FullName
    Check (($entries | Where-Object { $_ -like '*barra.md' }).Count -eq 1) 'lo zip contiene barra.md'
    Check (($entries | Where-Object { $_ -like '*mind-memory.json' }).Count -eq 1) 'lo zip contiene mind-memory.json'
    Check (($entries | Where-Object { $_ -like '*opencode.jsonc' }).Count -eq 1) 'lo zip contiene opencode.jsonc'
    Check (($entries | Where-Object { $_ -like '*sessions*' }).Count -ge 1) 'lo zip contiene sessions'

    # --- 2) restore dopo modifica ---
    $barra = Join-Path $cfg 'mind\barra.md'
    Set-Content -Path $barra -Value '# modificato dopo'
    & $script -ConfigRoot $cfg -Restore | Out-Null
    Check ((Get-Content $barra -Raw).Trim() -eq '# barra di prova') 'restore riporta barra.md'
    $pre = @(Get-ChildItem (Join-Path $cfg 'mind\backups') -Filter 'pre-restore-*.zip')
    Check ($pre.Count -eq 1) 'restore fotografa prima lo stato corrente'

    # --- 3) retention: 7 vecchi + 1 giro = max 5 ---
    1..7 | ForEach-Object { Copy-Item $snaps[0].FullName (Join-Path $cfg ("mind\backups\locale-2020010{0}-000000.zip" -f $_)) -Force }
    & $script -ConfigRoot $cfg -KeepBackups 5 | Out-Null
    $kept = @(Get-ChildItem (Join-Path $cfg 'mind\backups') -Filter 'locale-*.zip').Count
    Check ($kept -le 5) 'retention a 5 snapshot' "trovati $kept"

    # --- 4) WhatIf non scrive ---
    $before = @(Get-ChildItem (Join-Path $cfg 'mind\backups') -Filter '*.zip').Count
    & $script -ConfigRoot $cfg -WhatIf | Out-Null
    $after = @(Get-ChildItem (Join-Path $cfg 'mind\backups') -Filter '*.zip').Count
    Check ($before -eq $after) '-WhatIf non crea file'

    # --- 5) percorsi assenti non falliscono ---
    Remove-Item (Join-Path $cfg 'mind\sessions') -Recurse -Force
    Remove-Item (Join-Path $cfg 'opencode.jsonc') -Force
    & $script -ConfigRoot $cfg | Out-Null
    Check ($LASTEXITCODE -eq 0 -or $null -eq $LASTEXITCODE) 'percorsi assenti: snapshot parziale senza errori'
}
catch {
    $fail++
    Write-Host "  FAIL eccezione: $($_.Exception.Message)"
}
finally {
    Remove-Item $root -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host ""
if ($fail -eq 0) { Write-Host "TEST OK: $pass verifiche"; exit 0 }
Write-Host "TEST FALLITO: $fail su $($pass + $fail)"
exit 1
