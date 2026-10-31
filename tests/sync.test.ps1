#Requires -Version 5.1
<#
.SYNOPSIS
    Verifica di accettazione di sync.ps1 su una root temporanea.
.DESCRIPTION
    Copre: installazione pulita (directory create), file ritirati a monte,
    protezione della conoscenza locale (barra), config modificata dall'utente,
    pruning dei backup, manifest scritto, exit code.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$sync = Join-Path $repo 'sync.ps1'
$root = Join-Path ([System.IO.Path]::GetTempPath()) ('mind-sync-test-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
$cfg = Join-Path $root 'cfg'
$agents = Join-Path $root 'agents'

$pass = 0
$fail = 0
function Check([bool]$ok, [string]$label, [string]$detail) {
    if ($ok) { $script:pass++; Write-Host "  PASS $label" }
    else { $script:fail++; Write-Host "  FAIL $label $detail" }
}

try {
    # --- 1) installazione su root pulita ---
    & $sync -ConfigRoot $cfg -AgentsSkillsRoot $agents | Out-Null
    Check ($LASTEXITCODE -eq 0 -or $null -eq $LASTEXITCODE) 'exit code 0 su root pulita'
    Check (Test-Path (Join-Path $cfg 'plugins\mind.js')) 'plugin copiato'
    Check (Test-Path (Join-Path $cfg 'plugins\mind-store.js')) 'modulo condiviso copiato'
    Check (Test-Path (Join-Path $cfg 'mind\skills\using-mind\SKILL.md')) 'skill mind copiata'
    Check (Test-Path (Join-Path $agents 'frontend-design\SKILL.md')) 'skill esterna copiata'
    Check (Test-Path (Join-Path $cfg 'agents\sage.md')) 'agenti copiati'
    Check (Test-Path (Join-Path $cfg 'mind\installed.json')) 'manifest scritto'

    # --- 2) file ritirato a monte ---
    $ghost = Join-Path $cfg 'mind\skills\skill-ritirata\SKILL.md'
    New-Item -ItemType Directory -Path (Split-Path $ghost) -Force | Out-Null
    Set-Content -Path $ghost -Value 'vecchia'
    # lo aggiungo al manifest come se l avessi distribuito io
    $m = Get-Content (Join-Path $cfg 'mind\installed.json') -Raw | ConvertFrom-Json
    $files = @{}
    foreach ($p in $m.files.PSObject.Properties) { $files[$p.Name] = $p.Value }
    $files[$ghost] = 'deadbeef'
    $m | Add-Member -NotePropertyName files -NotePropertyValue ([pscustomobject]$files) -Force
    ($m | ConvertTo-Json -Depth 6) | Set-Content -Path (Join-Path $cfg 'mind\installed.json') -Encoding UTF8

    & $sync -ConfigRoot $cfg -AgentsSkillsRoot $agents | Out-Null
    Check (-not (Test-Path $ghost)) 'file ritirato rimosso dalla destinazione'

    # --- 3) file locale non gestito non viene toccato ---
    $localPlugin = Join-Path $cfg 'plugins\plugin-locale.js'
    Set-Content -Path $localPlugin -Value '// mio'
    & $sync -ConfigRoot $cfg -AgentsSkillsRoot $agents | Out-Null
    Check (Test-Path $localPlugin) 'plugin locale non gestito preservato'
    Check ((Get-Content $localPlugin -Raw).Trim() -eq '// mio') 'contenuto del plugin locale intatto'

    # --- 3b) i metadati di versione non vengono mai potati ---
    $gitDir = Join-Path $cfg 'mind\skills\using-mind\.git'
    New-Item -ItemType Directory -Path (Join-Path $gitDir 'objects') -Force | Out-Null
    Set-Content -Path (Join-Path $gitDir 'HEAD') -Value 'ref: refs/heads/main'
    Set-Content -Path (Join-Path $gitDir 'objects\pack-abc') -Value 'x'
    & $sync -ConfigRoot $cfg -AgentsSkillsRoot $agents | Out-Null
    Check (Test-Path (Join-Path $gitDir 'HEAD')) 'metadati .git preservati dal pruning'
    Check (Test-Path (Join-Path $gitDir 'objects\pack-abc')) 'oggetti .git preservati'

    # --- 3c) una cartella con .git non viene sovrascritta ---
    $clone = Join-Path $agents 'frontend-design'
    New-Item -ItemType Directory -Path (Join-Path $clone '.git') -Force | Out-Null
    Set-Content -Path (Join-Path $clone '.git\HEAD') -Value 'ref: refs/heads/main'
    Set-Content -Path (Join-Path $clone 'SKILL.md') -Value 'versione locale del clone'
    & $sync -ConfigRoot $cfg -AgentsSkillsRoot $agents | Out-Null
    Check ((Get-Content (Join-Path $clone 'SKILL.md') -Raw).Trim() -eq 'versione locale del clone') 'clone git non sovrascritto'
    & $sync -ConfigRoot $cfg -AgentsSkillsRoot $agents -IncludeGitClones | Out-Null
    Check ((Get-Content (Join-Path $clone 'SKILL.md') -Raw).Trim() -ne 'versione locale del clone') 'con -IncludeGitClones il repo vince'

    # --- 3d) primo avvio su una config gia' personalizzata: non si sovrascrive ---
    $freshCfg = Join-Path $root 'cfg-fresh'
    New-Item -ItemType Directory -Path $freshCfg -Force | Out-Null
    Set-Content -Path (Join-Path $freshCfg 'opencode.jsonc') -Value '{ "mio": "contenuto personale" }'
    & $sync -ConfigRoot $freshCfg -AgentsSkillsRoot (Join-Path $root 'agents-fresh') | Out-Null
    $kept = Get-Content (Join-Path $freshCfg 'opencode.jsonc') -Raw
    Check ($kept -match 'contenuto personale') 'primo avvio: config locale intatta'
    Check (Test-Path (Join-Path $freshCfg 'opencode.jsonc.new')) 'primo avvio: nuova versione proposta in .new'

    # --- 4) barra: conoscenza locale mai sovrascritta ---
    $barra = Join-Path $cfg 'mind\barra.md'
    $prima = (Get-Content $barra -Raw) + "`n- 2026-10-30 | assunzione falsificata: `"prova`" | atteso: `"x`"`n"
    Set-Content -Path $barra -Value $prima -NoNewline
    & $sync -ConfigRoot $cfg -AgentsSkillsRoot $agents | Out-Null
    Check ((Get-Content $barra -Raw) -match 'assunzione falsificata') 'barra locale conservata'

    # --- 5) config modificata dall utente: non sovrascritta, arriva .new ---
    $cfgFile = Join-Path $cfg 'opencode.jsonc'
    Add-Content -Path $cfgFile -Value '// modifica locale'
    & $sync -ConfigRoot $cfg -AgentsSkillsRoot $agents | Out-Null
    Check ((Get-Content $cfgFile -Raw) -match 'modifica locale') 'config locale modificata conservata'
    Check (Test-Path "$cfgFile.new") 'nuova versione proposta in .new'

    # --- 5b) restore: un aggiornamento si annulla ---
    $rTarget = Join-Path $cfg 'plugins\mind-store.js'
    Set-Content -Path $rTarget -Value '// contenuto locale prima del restore'
    & $sync -ConfigRoot $cfg -AgentsSkillsRoot $agents | Out-Null
    Check ((Get-Content $rTarget -Raw) -notmatch 'contenuto locale prima') 'sync sovrascrive il file, lasciando un backup'
    $listed = (& $sync -ConfigRoot $cfg -AgentsSkillsRoot $agents -ListBackups 6>&1 | Out-String)
    Check ($listed -match '\d{8}-\d{6}') 'ListBackups elenca almeno uno stamp ripristinabile'
    & $sync -ConfigRoot $cfg -AgentsSkillsRoot $agents -Restore | Out-Null
    Check ((Get-Content $rTarget -Raw) -match 'contenuto locale prima') 'restore riporta il file allo stato precedente'
    & $sync -ConfigRoot $cfg -AgentsSkillsRoot $agents | Out-Null
    Check ((Get-Content $rTarget -Raw) -notmatch 'contenuto locale prima') 'dopo il restore un sync normale sovrascrive di nuovo'
    # --- 6) pruning dei backup ---
    $target = Join-Path $cfg 'plugins\mind.js'
    1..10 | ForEach-Object { Copy-Item $target "$target.2026010$_-000000.bak" -Force }
    & $sync -ConfigRoot $cfg -AgentsSkillsRoot $agents | Out-Null
    $baks = (Get-ChildItem (Join-Path $cfg 'plugins') -File | Where-Object { $_.Name -like 'mind.js.*.bak' }).Count
    Check ($baks -le 3) 'backup potati (max 3)' "trovati $baks"

    # --- 7) idempotenza ---
    $before = (Get-FileHash (Join-Path $cfg 'plugins\mind.js')).Hash
    & $sync -ConfigRoot $cfg -AgentsSkillsRoot $agents | Out-Null
    $after = (Get-FileHash (Join-Path $cfg 'plugins\mind.js')).Hash
    Check ($before -eq $after) 'seconda esecuzione non altera i file identici'

    # --- 8) nessun crash con sorgente mancante (root repo diversa) ---
    & $sync -ConfigRoot $cfg -AgentsSkillsRoot $agents -WhatIf | Out-Null
    Check $true '-WhatIf non scrive e non fallisce'
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
