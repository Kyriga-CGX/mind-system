#Requires -Version 5.1
<#
.SYNOPSIS
    Sincronizza questo repo (source of truth) con la configurazione locale di opencode.

.DESCRIPTION
    Copia i file gestiti e tiene un manifest di cio' che ha distribuito
    (~/.config/opencode/mind/installed.json), cosi' un aggiornamento puo'
    rimuovere cio' che il repo non contiene piu' senza toccare i file locali.

    Categorie:
      code       plugin, skill, agenti, README  -> sovrascritti (con backup)
      config     opencode.jsonc, mind-memory.json, vibeguard.config.json,
                 dcp.jsonc, AGENTS.md           -> sovrascritti SOLO se il file
                 locale e' identico a quello distribuito l'ultima volta;
                 altrimenti la nuova versione arriva come <file>.new
      knowledge  mind/barra.md                  -> mai sovrascritta: e' conoscenza
                 appresa. Se il template cambia, arriva come <file>.new

    Non tocca mai: mind/gaps/, mind/sessions/, la memoria, ne' i plugin e le
    skill che non ha distribuito lui.

.PARAMETER ConfigRoot
    Directory config globale di opencode. Default: $HOME/.config/opencode

.PARAMETER AgentsSkillsRoot
    Directory delle skill esterne. Default: $HOME/.agents/skills

.PARAMETER KeepBackups
    Copie .bak da tenere per ogni file. Default: 3

.PARAMETER NoPrune
    Non rimuove i file ritirati a monte ne' i backup vecchi.

.EXAMPLE
    .\sync.ps1

.EXAMPLE
    .\sync.ps1 -WhatIf
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [string]$ConfigRoot = (Join-Path $HOME '.config\opencode'),
    [string]$AgentsSkillsRoot = (Join-Path $HOME '.agents\skills'),
    [int]$KeepBackups = 3,
    [switch]$NoPrune,
    [switch]$IncludeGitClones,
    [switch]$Restore,
    [string]$Stamp,
    [switch]$ListBackups
)

$ErrorActionPreference = 'Stop'
$RepoRoot = $PSScriptRoot
$runStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$manifestPath = Join-Path $ConfigRoot 'mind\installed.json'
# -WhatIf resta riconosciuto dalla firma, ma le decisioni le prende $whatIf:
# lasciare il preference attivo fa si' che i cmdlet di sola lettura (Get-FileHash,
# Get-Item) entrino in modalita' WhatIf e restituiscano oggetti inutilizzabili.
$whatIf = [bool]$WhatIfPreference
$WhatIfPreference = $false
# --------------------------------------------------------------- ripristino ---
# Un aggiornamento deve poter essere annullato. Ogni file sovrascritto lascia
# accanto una copia <file>.<stamp>.bak: il ripristino le rimette al loro posto.
if ($Restore -or $ListBackups) {
    $bakRoots = @($ConfigRoot, $AgentsSkillsRoot) | Where-Object { Test-Path -LiteralPath $_ }
    $baks = @()
    foreach ($r in $bakRoots) {
        $baks += @(Get-ChildItem -LiteralPath $r -Recurse -File -Force -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -match '\.\d{8}-\d{6}\.bak$' })
    }
    $byStamp = @{}
    foreach ($b in $baks) {
        $s = ($b.Name -replace '^.*\.(\d{8}-\d{6})\.bak$', '$1')
        if (-not $byStamp.ContainsKey($s)) { $byStamp[$s] = New-Object System.Collections.ArrayList }
        [void]$byStamp[$s].Add($b)
    }

    if ($ListBackups) {
        if ($byStamp.Count -eq 0) { Write-Host 'Nessun backup ripristinabile.'; return }
        Write-Host 'Stamp ripristinabili (piu recente in alto):'
        foreach ($s in ($byStamp.Keys | Sort-Object -Descending)) {
            Write-Host ("  {0}  {1} file" -f $s, $byStamp[$s].Count)
        }
        return
    }

    $targetStamp = $Stamp
    if (-not $targetStamp -and $byStamp.Count -gt 0) { $targetStamp = ($byStamp.Keys | Sort-Object -Descending | Select-Object -First 1) }
    if (-not $targetStamp -or -not $byStamp.ContainsKey($targetStamp)) {
        Write-Host "Nessun backup con stamp '$targetStamp'. Usa -ListBackups per vedere quali esistono." -ForegroundColor Red
        exit 1
    }

    $restored = 0
    $touched = New-Object System.Collections.ArrayList
    foreach ($b in $byStamp[$targetStamp]) {
        $orig = $b.FullName -replace ('.' + [regex]::Escape($targetStamp) + '.bak$'), ''
        if ($whatIf) { Write-Host ("  ~ {0}" -f $orig); continue }
        Copy-Item -LiteralPath $b.FullName -Destination $orig -Force
        [void]$touched.Add($orig)
        $restored += 1
    }

    # i file ripristinati tornano locali: il prossimo sync propone, non sovrascrive
    if (-not $whatIf -and $touched.Count -gt 0 -and (Test-Path -LiteralPath $manifestPath)) {
        try {
            $m = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
            $files = @{}
            foreach ($p in $m.files.PSObject.Properties) { $files[$p.Name] = [string]$p.Value }
            foreach ($f in $touched) { $files.Remove($f) }
            $m | Add-Member -NotePropertyName files -NotePropertyValue ([pscustomobject]$files) -Force
            $m | Add-Member -NotePropertyName restored -NotePropertyValue $targetStamp -Force
            $utf8 = New-Object System.Text.UTF8Encoding($false)
            [System.IO.File]::WriteAllText($manifestPath, ($m | ConvertTo-Json -Depth 6), $utf8)
        } catch {
            Write-Warning "Manifest non aggiornato: $($_.Exception.Message)"
        }
    }

    Write-Host ''
    Write-Host ("Ripristinati {0} file dallo stamp {1}." -f $restored, $targetStamp)
    Write-Host 'Il prossimo sync tratta i file ripristinati come locali: propone .new invece di sovrascrivere.'
    return
}

$counts = @{ copied = 0; same = 0; proposed = 0; kept = 0; pruned = 0; backupsRemoved = 0 }
$problems = New-Object System.Collections.ArrayList

# ---------------------------------------------------------------- utility ---
function Get-Sha {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return $null }
    # $-WhatIf non deve influenzare le letture (Get-FileHash lo rispetta)
    $WhatIfPreference = $false
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLower()
}

function Ensure-Dir {
    param([string]$Path)
    if ([string]::IsNullOrWhiteSpace($Path)) { return }
    if (Test-Path -LiteralPath $Path) { return }
    if ($whatIf) { return }
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
}

function Backup-File {
    param([string]$Path)
    if ($whatIf) { return }
    if (-not (Test-Path -LiteralPath $Path)) { return }
    Copy-Item -LiteralPath $Path -Destination ("$Path.$runStamp.bak") -Force
}

function Prune-Backups {
    param([string]$Path)
    if ($whatIf) { return }
    $dir = Split-Path -Parent $Path
    $name = Split-Path -Leaf $Path
    if (-not (Test-Path -LiteralPath $dir)) { return }
    $baks = @(Get-ChildItem -LiteralPath $dir -File | Where-Object { $_.Name -like "$name.*.bak" } | Sort-Object Name -Descending)
    if ($baks.Count -le $KeepBackups) { return }
    $baks | Select-Object -Skip $KeepBackups | ForEach-Object {
        Remove-Item -LiteralPath $_.FullName -Force
        $counts.backupsRemoved++
    }
}

function Test-GitRoot {
    param([string]$Path)
    return (Test-Path -LiteralPath (Join-Path $Path '.git'))
}

function Remove-ManagedFile {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return }
    if ($NoPrune -or $whatIf) { return }
    Backup-File $Path
    Remove-Item -LiteralPath $Path -Force
    $counts.pruned++
}

# ------------------------------------------------------------------- piano ---
$plan = New-Object System.Collections.ArrayList
$ownedRoots = New-Object System.Collections.ArrayList
# root saltate (clone git): i loro file restano nel manifest, altrimenti il
# pruning li considererebbe "ritirati a monte" e li cancellerebbe.
$skippedRoots = New-Object System.Collections.ArrayList

function Add-Tree {
    param([string]$Source, [string]$DestRoot, [string]$Kind, [switch]$Owned)
    if (-not (Test-Path -LiteralPath $Source)) {
        Write-Warning "Sorgente mancante, skip: $Source"
        return
    }
    if ($Owned) { [void]$ownedRoots.Add($DestRoot) }
    Get-ChildItem -LiteralPath $Source -Recurse -File -Force | ForEach-Object {
        $rel = $_.FullName.Substring($Source.Length).TrimStart('\', '/')
        [void]$plan.Add([pscustomobject]@{
            Source = $_.FullName
            Dest   = (Join-Path $DestRoot $rel)
            Kind   = $Kind
        })
    }
}

function Add-Single {
    param([string]$Source, [string]$Dest, [string]$Kind)
    if (-not (Test-Path -LiteralPath $Source)) {
        Write-Warning "Sorgente mancante, skip: $Source"
        return
    }
    [void]$plan.Add([pscustomobject]@{ Source = $Source; Dest = $Dest; Kind = $Kind })
}

Write-Host '=== Plugins (auto-load top-level) ==='
Add-Tree (Join-Path $RepoRoot 'plugins') (Join-Path $ConfigRoot 'plugins') 'code'

Write-Host '=== Skill mind ==='
$mindDest = Join-Path $ConfigRoot 'mind\skills'
if (-not $IncludeGitClones -and (Test-GitRoot $mindDest)) {
    Write-Warning "skip mind/skills: $mindDest e' un repository git (usa -IncludeGitClones)"
    [void]$skippedRoots.Add($mindDest)
} else {
    Add-Tree (Join-Path $RepoRoot 'skills\mind') $mindDest 'code' -Owned
}

Write-Host '=== Skill esterne ==='
Get-ChildItem -LiteralPath (Join-Path $RepoRoot 'skills') -Directory | Where-Object { $_.Name -ne 'mind' } | ForEach-Object {
    # niente -Owned: ~/.agents/skills/<nome> puo' essere un clone git dell'utente
    $dest = Join-Path $AgentsSkillsRoot $_.Name
    if (-not $IncludeGitClones -and (Test-GitRoot $dest)) {
        Write-Warning "skip $($_.Name): $dest e' un repository git, non lo sovrascrivo (usa -IncludeGitClones se vuoi che vinca il repo)"
        [void]$skippedRoots.Add($dest)
        return
    }
    Add-Tree $_.FullName $dest 'code'
}

Write-Host '=== Agenti custom ==='
$agentsDest = Join-Path $ConfigRoot 'agents'
if (-not $IncludeGitClones -and (Test-GitRoot $agentsDest)) {
    Write-Warning "skip agents: $agentsDest e' un repository git (usa -IncludeGitClones)"
    [void]$skippedRoots.Add($agentsDest)
} else {
    Add-Tree (Join-Path $RepoRoot 'config\agents') $agentsDest 'code' -Owned
}

Write-Host '=== Config files (sovrascritti solo se non modificati) ==='
foreach ($f in @('opencode.jsonc', 'mind-memory.json', 'vibeguard.config.json', 'dcp.jsonc', 'AGENTS.md')) {
    Add-Single (Join-Path $RepoRoot "config\$f") (Join-Path $ConfigRoot $f) 'config'
}

Write-Host '=== Documentazione ==='
Add-Single (Join-Path $RepoRoot 'README.md') (Join-Path $ConfigRoot 'mind\README.md') 'code'

Write-Host '=== Router iniettato a ogni richiesta ==='
Add-Single (Join-Path $RepoRoot 'config\bootstrap.md') (Join-Path $ConfigRoot 'mind\bootstrap.md') 'code'

Write-Host '=== Barra (conoscenza locale: mai sovrascritta) ==='
Add-Single (Join-Path $RepoRoot 'config\barra.md') (Join-Path $ConfigRoot 'mind\barra.md') 'knowledge'

# ---------------------------------------------------------------- manifest ---
$oldFiles = @{}
if (Test-Path -LiteralPath $manifestPath) {
    try {
        $old = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
        if ($old -and $old.files) {
            foreach ($p in $old.files.PSObject.Properties) { $oldFiles[$p.Name] = [string]$p.Value }
        }
    } catch {
        Write-Warning "Manifest illeggibile, lo ricostruisco: $manifestPath"
    }
}

if ($whatIf) {
    Write-Host ''
    $byKind = $plan | Group-Object Kind | ForEach-Object { "$($_.Name)=$($_.Count)" }
    Write-Host "WhatIf: $($plan.Count) file gestiti ($($byKind -join ', ')); manifest con $($oldFiles.Count) voci."
    foreach ($item in $plan) {
        $destHash = Get-Sha $item.Dest
        if ($null -eq $destHash) { Write-Host ("  + {0}" -f $item.Dest) }
        elseif ((Get-Sha $item.Source) -ne $destHash) { Write-Host ("  ~ {0} ({1})" -f $item.Dest, $item.Kind) }
    }
    Write-Host 'Sync NON eseguita.'
    return
}

# ----------------------------------------------------------------- azioni ---
$newFiles = @{}

# i file sotto una root saltata restano gestiti com'erano: non si toccano
foreach ($root in $skippedRoots) {
    foreach ($old in $oldFiles.Keys) {
        if ($old.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
            $newFiles[$old] = $oldFiles[$old]
        }
    }
}

foreach ($item in $plan) {
    $dir = Split-Path -Parent $item.Dest
    Ensure-Dir $dir

    $srcHash = Get-Sha $item.Source
    $destHash = Get-Sha $item.Dest
    $expected = $srcHash

    if ($null -eq $destHash) {
        Copy-Item -LiteralPath $item.Source -Destination $item.Dest -Force
        $counts.copied++
    }
    elseif ($srcHash -eq $destHash) {
        $expected = $destHash
        $counts.same++
    }
    elseif ($item.Kind -eq 'knowledge') {
        $expected = $destHash
        $counts.kept++
        if (-not (Test-Path -LiteralPath "$($item.Dest).new")) {
            Copy-Item -LiteralPath $item.Source -Destination "$($item.Dest).new" -Force
        }
    }
    elseif ($item.Kind -eq 'config') {
        $shipped = $oldFiles[$item.Dest]
        if (-not $oldFiles.Count) {
            # Prima esecuzione: non si puo' distinguere una versione vecchia da una
            # personalizzazione. Sovrascrivere qui cancella config locale (e' successo:
            # un blocco provider e' sparito). Si propone e basta.
            $expected = $destHash
            $counts.proposed++
            Copy-Item -LiteralPath $item.Source -Destination "$($item.Dest).new" -Force
            Write-Warning "prima esecuzione: config locale conservata, nuova versione in $($item.Dest).new"
        }
        elseif ($shipped -and $shipped -eq $destHash) {
            Backup-File $item.Dest
            Copy-Item -LiteralPath $item.Source -Destination $item.Dest -Force
            $counts.copied++
        }
        else {
            $expected = $destHash
            $counts.proposed++
            Copy-Item -LiteralPath $item.Source -Destination "$($item.Dest).new" -Force
            Write-Warning "config modificata localmente, nuova versione in $($item.Dest).new"
        }
    }
    else {
        Backup-File $item.Dest
        Copy-Item -LiteralPath $item.Source -Destination $item.Dest -Force
        $counts.copied++
    }

    $newFiles[$item.Dest] = $expected
}

# ----------------------------------------------------------------- pruning ---
if (-not $NoPrune) {
    # 1) file distribuiti in passato che il repo non contiene piu'
    foreach ($old in @($oldFiles.Keys)) {
        if (-not $newFiles.ContainsKey($old)) { Remove-ManagedFile $old }
    }

    # 2) alberi interamente nostri: qualunque file non previsto dal piano
    foreach ($root in $ownedRoots) {
        if (-not (Test-Path -LiteralPath $root)) { continue }
        Get-ChildItem -LiteralPath $root -Recurse -File -Force | ForEach-Object {
            if ($newFiles.ContainsKey($_.FullName)) { return }
            if ($_.Name -like '*.bak*' -or $_.Name -like '*.new') { return }
            # mai toccare i metadati di versione: un clone git resta un clone
            if ($_.FullName -match '[\\/]\.(git|hg|svn)([\\/]|$)') { return }
            Remove-ManagedFile $_.FullName
        }
    }

    # 3) directory rimaste vuote negli alberi nostri
    foreach ($root in $ownedRoots) {
        if (-not (Test-Path -LiteralPath $root)) { continue }
        Get-ChildItem -LiteralPath $root -Recurse -Directory -Force |
            Sort-Object { $_.FullName.Length } -Descending |
            ForEach-Object {
                if (@(Get-ChildItem -LiteralPath $_.FullName -Force).Count -eq 0) {
                    Remove-Item -LiteralPath $_.FullName -Force
                }
            }
    }
}

# backup vecchi: si potano anche per i file rimasti invariati
if (-not $NoPrune) {
    foreach ($item in $plan) { Prune-Backups $item.Dest }
}

# ------------------------------------------------------------ verificazione ---
foreach ($item in $plan) {
    $actual = Get-Sha $item.Dest
    if ($null -eq $actual) {
        [void]$problems.Add("mancante: $($item.Dest)")
        continue
    }
    $expected = $newFiles[$item.Dest]
    if ($expected -and $actual -ne $expected) {
        [void]$problems.Add("hash diverso: $($item.Dest)")
    }
}

# ---------------------------------------------------------------- manifest ---
Ensure-Dir (Split-Path -Parent $manifestPath)
# il commit serve all'avviso di aggiornamento: senza, il plugin non sa cosa
# e' stato installato e non puo' dire se il repo e' piu' avanti.
$commit = $null
# Niente Select-Object -First su un comando nativo: chiude la pipe e lascia
# LASTEXITCODE = -1, cioe' un falso errore per chi legge l'exit code.
try { $commit = (& git -C $RepoRoot rev-parse HEAD 2>$null) } catch { $commit = $null }
if ($commit) { $commit = (@($commit)[0]).Trim() }

$manifest = [pscustomobject]@{
    version = 1
    at      = (Get-Date).ToString('o')
    stamp   = $runStamp
    repo    = $RepoRoot
    commit  = $commit
    files   = [pscustomobject]$newFiles
}
# senza BOM: JSON.parse in Node lo rifiuta, e il plugin non vedrebbe il manifest
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($manifestPath, ($manifest | ConvertTo-Json -Depth 6), $utf8NoBom)

Write-Host ''
Write-Host ("Copiati: {0} | invariati: {1} | proposti .new: {2} | conservati: {3} | rimossi: {4} | backup potati: {5}" -f `
    $counts.copied, $counts.same, $counts.proposed, $counts.kept, $counts.pruned, $counts.backupsRemoved)

if ($problems.Count -gt 0) {
    Write-Host ''
    Write-Host 'PROBLEMI:' -ForegroundColor Red
    $problems | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host "Rollback: i file sovrascritti hanno una copia .$runStamp.bak accanto."
    exit 1
}

Write-Host 'Sync completato. OpenCode ricarica config e plugin locali da solo; se un plugin non viene ripreso, usa: opencode service restart'
Write-Host "Manifest: $manifestPath"
