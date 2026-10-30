# health-check.ps1
$ErrorActionPreference = "Stop"

function ConvertFrom-Jsonc {
    param(
        [Parameter(ValueFromPipeline = $true)]
        [string]$Text
    )
    process {
        $Text = [regex]::Replace($Text, '(?m)(^|[^:/])//(?!/)[^\r\n]*', '$1')
        $Text = [regex]::Replace($Text, '/\*.*?\*/', '', [System.Text.RegularExpressions.RegexOptions]::Singleline)
        $Text = [regex]::Replace($Text, '(?m),(\s*[}\]])', '$1')
        return $Text
    }
}

$homeDir = $HOME
$customSkills = Join-Path $homeDir ".agents\skills"
$opencodeConfig = Join-Path $homeDir ".config\opencode\opencode.jsonc"
$mindPluginJs = Join-Path $homeDir ".config\opencode\plugins\mind.js"
$mindMemoryJs = Join-Path $homeDir ".config\opencode\plugins\mind-memory.js"
$backupZipPattern = "opencode-backup-*.zip"

$report = @{
    checkedAt     = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
    skills        = $null
    context7      = $null
    pluginContract = $null
    backup        = $null
    skillUpdates  = @()
}


$missing = @()
$expectedCustom = @("context7-mcp", "ecosystem-health-check", "stop-slop", "frontend-design", "design-md")
foreach ($s in $expectedCustom) {
    if (-not (Test-Path -LiteralPath (Join-Path $customSkills $s))) { $missing += $s }
}

$sk = @{ status = "ok"; detail = "tutte le skill presenti"; missing = @() }
if ($missing.Count -gt 0) {
    $sk.status = "missing"
    $sk.detail = "skill mancanti: " + ($missing -join ", ")
    $sk.missing = $missing
}
$report.skills = $sk

$skillGit = @(
    @{ name = "stop-slop";        type = "direct";   path = (Join-Path $customSkills "stop-slop") },
    @{ name = "frontend-design";  type = "registry"; path = (Join-Path $homeDir ".agents\skill-sources\anthropics-skills"); rel = "skills\frontend-design"; dest = (Join-Path $customSkills "frontend-design") },
    @{ name = "design-md";        type = "registry"; path = (Join-Path $homeDir ".agents\skill-sources\open-design"); rel = "skills\design-md"; dest = (Join-Path $customSkills "design-md") }
)

$updates = @()
foreach ($g in $skillGit) {
    $u = @{ name = $g.name; status = ""; detail = "" }
    try {
        $remote = (git -C $g.path ls-remote origin HEAD 2>$null).Split("`t")[0].Trim()
        if ([string]::IsNullOrWhiteSpace($remote)) { throw "impossibile risolvere HEAD remoto" }
        $local = (git -C $g.path rev-parse HEAD).Trim()
        if ($g.type -eq "direct") {
            if ($local -eq $remote) { $u.status = "up-to-date"; $u.detail = "sincronizzata" }
            else { git -C $g.path pull --quiet origin; $u.status = "updated"; $u.detail = "aggiornata" }
        } else {
            if ($local -eq $remote) {
                $u.status = "up-to-date"; $u.detail = "sincronizzata"
            } else {
                git -C $g.path pull --quiet origin
                if (-not (Test-Path (Join-Path $g.path $g.rel))) {
                    $u.status = "check-failed"; $u.detail = "sorgente remota aggiornata ma sottocartella '$($g.rel)' non trovata; nessuna copia eseguita"
                } else {
                    if (Test-Path -LiteralPath $g.dest) { Remove-Item -LiteralPath $g.dest -Recurse -Force }
                    Copy-Item -Path (Join-Path $g.path $g.rel) -Destination $g.dest -Recurse -Force
                    $u.status = "updated"; $u.detail = "aggiornata e ricopiata"
                }
            }
        }
    } catch {
        $u.status = "check-failed"; $u.detail = "errore git: $($_.Exception.Message)"
    }
    $updates += $u
}
$report.skillUpdates = $updates

# --- MCP: forma della config e stato dichiarato dal runtime -------------
# La forma cambia fra versioni (type stdio|local|remote, enabled|disabled) e una
# voce con la forma sbagliata viene SCARTATA IN SILENZIO: il server non esiste e
# nessuno lo dice. Qui si controlla la forma, e se il CLI risponde si legge anche
# lo stato reale (connected / needs authentication / failed).
$mcp = @{ status = "ok"; detail = ""; servers = @(); runtime = $null }
try {
    $cfg = Get-Content -LiteralPath $opencodeConfig -Raw | ConvertFrom-Jsonc | ConvertFrom-Json
    $servers = @{}
    if ($null -ne $cfg.mcp) {
        foreach ($p in $cfg.mcp.PSObject.Properties) {
            if ($p.Name -eq "servers") {
                foreach ($q in $p.Value.PSObject.Properties) { $servers[$q.Name] = $q.Value }
            } else { $servers[$p.Name] = $p.Value }
        }
    }
    if ($servers.Count -eq 0) {
        $mcp.status = "misconfigured"; $mcp.detail = "nessun server MCP in config"
    }
    foreach ($name in ($servers.Keys | Sort-Object)) {
        $s = $servers[$name]
        $type = [string]$s.type
        $entry = @{ name = $name; type = $type; status = "ok"; detail = "" }
        if ($type -ne "local" -and $type -ne "remote") {
            $entry.status = "misconfigured"
            $entry.detail = "type '$type' non riconosciuto da V2 (local|remote): la voce viene scartata in silenzio"
        } elseif ($type -eq "remote" -and -not $s.url) {
            $entry.status = "misconfigured"; $entry.detail = "remote senza url"
        } elseif ($type -eq "local" -and -not $s.command) {
            $entry.status = "misconfigured"; $entry.detail = "local senza command"
        }
        $entry.disabled = ($s.disabled -eq $true) -or ($s.enabled -eq $false)
        $mcp.servers += $entry
        if ($entry.status -ne "ok") { $mcp.status = "misconfigured" }
    }
    foreach ($e in $mcp.servers | Where-Object { $_.status -ne "ok" }) {
        $mcp.detail = ($mcp.detail + "; " + $e.name + ": " + $e.detail).TrimStart("; ").Trim()
    }
    if (-not $mcp.detail) { $mcp.detail = "$($mcp.servers.Count) server configurati, forma valida" }

    # stato reale, se il CLI risponde (puo' richiedere qualche secondo)
    try {
        $out = & opencode mcp list 2>&1 | Out-String
        if ($out -and $out -notmatch "command not found") {
            $runtime = @()
            # Si leggono le PAROLE di stato, non i simboli: la console Windows
            # restituisce i glifi come mojibake (UTF-8 letto come Latin-1).
            foreach ($line in ($out -split "`n")) {
                if ($line -match "^\S+\s+(\S+)\s+(connected|needs authentication|failed|disabled|pending)\b") {
                    $nm = $Matches[1]
                    $state = $Matches[2]
                    $rest = ($line -replace "^\S+\s+\S+\s+", "").Trim()
                    $runtime += @{ name = $nm; state = $state; detail = ($rest -split ":")[0] }
                }
            }
            if ($runtime.Count -gt 0) {
                $mcp.runtime = $runtime
                $bad = @($runtime | Where-Object { $_.state -eq "failed" })
                if ($bad.Count -gt 0) {
                    $mcp.status = "degraded"
                    $mcp.detail = ($mcp.detail + "; runtime: " + (($bad | ForEach-Object { $_.name + " " + $_.detail }) -join ", ")).TrimStart("; ").Trim()
                }
            }
        }
    } catch { }
} catch {
    $mcp.status = "check-failed"; $mcp.detail = "errore lettura o parse opencode.jsonc: $($_.Exception.Message)"
}
$report.mcp = $mcp
# compatibilita': chi leggeva context7 continua a trovarlo
$c7 = @{ status = "ok"; detail = "" }
$c7s = @($mcp.servers | Where-Object { $_.name -eq "context7" })
if ($c7s.Count -eq 0) { $c7.status = "misconfigured"; $c7.detail = "entry mcp.context7 assente" }
elseif ($c7s[0].status -ne "ok") { $c7.status = "misconfigured"; $c7.detail = $c7s[0].detail }
else { $c7.status = "ok"; $c7.detail = "context7 configurato (forma V2)" }
$report.context7 = $c7

$pc = @{ status = "ok"; detail = "contratti plugin verificati"; checks = @() }
try {
    $mindJs = Get-Content -LiteralPath $mindPluginJs -Raw -ErrorAction Stop
    $isV2 = ($mindJs -match "export\s+default\s*\{") -and (($mindJs -match "\bsetup\b") -or ($mindJs -match "\beffect\b"))
    if (-not $isV2) {
        $pc.status = "misconfigured"
        $pc.checks += @{ name = "mind.js"; status = "misconfigured"; detail = "non in forma V2: serve export default { id, async setup(ctx) {...} }. In forma V1 (server: async) NON viene eseguito in opencode V2" }
    } elseif ($mindJs -match "EXTREMELY_IMPORTANT") {
        $pc.checks += @{ name = "mind.js"; status = "ok"; detail = "forma V2 + iniezione del bootstrap using-mind" }
    } else {
        $pc.status = "misconfigured"
        $pc.checks += @{ name = "mind.js"; status = "misconfigured"; detail = "forma V2 ok ma manca l'iniezione del bootstrap using-mind" }
    }
} catch {
    $pc.status = "check-failed"
    $pc.checks += @{ name = "mind.js"; status = "check-failed"; detail = "file non leggibile: $($_.Exception.Message)" }
}
try {
    $mmJs = Get-Content -LiteralPath $mindMemoryJs -Raw -ErrorAction Stop
    if ($mmJs -match "content\s*:" -and $mmJs -notmatch "return \{\s*output\s*:") {
        $pc.checks += @{ name = "mind-memory.js"; status = "ok"; detail = "contratto V2: il tool ritorna {content}" }
    } else {
        $pc.status = "misconfigured"
        $pc.checks += @{ name = "mind-memory.js"; status = "misconfigured"; detail = "contratto non conforme: in V2 il tool ritorna {content} (non {output}, che e V1)" }
    }
} catch {
    $pc.status = "check-failed"
    $pc.checks += @{ name = "mind-memory.js"; status = "check-failed"; detail = "file non leggibile: $($_.Exception.Message)" }
}
if ($pc.status -eq "ok") { $pc.detail = "contratti plugin verificati" } else { $pc.detail = "verifica i check con status negativo" }
$report.pluginContract = $pc

$bk = @{ status = "no-backup"; detail = "nessuno zip opencode-backup-*.zip trovato nella directory corrente"; lastBackup = ""; lastSkillChange = "" }
$zip = Get-ChildItem -Path (Join-Path $PWD.Path $backupZipPattern) -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($zip) {
    $bk.lastBackup = $zip.LastWriteTime.ToString("yyyy-MM-ddTHH:mm:ss")
    $lastSkillChange = $null
    foreach ($dir in @($customSkills)) {
        try {
            if (Test-Path -LiteralPath $dir) {
                $latestFile = Get-ChildItem -LiteralPath $dir -Recurse -File -ErrorAction Stop |
                    Sort-Object LastWriteTime -Descending | Select-Object -First 1
                if ($null -ne $latestFile) {
                    if ($null -eq $lastSkillChange -or $latestFile.LastWriteTime -gt $lastSkillChange) {
                        $lastSkillChange = $latestFile.LastWriteTime
                    }
                }
            }
        } catch {
        }
    }
    if ($null -ne $lastSkillChange) {
        $bk.lastSkillChange = $lastSkillChange.ToString("yyyy-MM-ddTHH:mm:ss")
        if ($lastSkillChange -gt $zip.LastWriteTime) {
            $bk.status = "stale"; $bk.detail = "le skill sono cambiate dopo l'ultimo backup"
        } else {
            $bk.status = "fresh"; $bk.detail = "backup aggiornato"
        }
    } else {
        $bk.status = "fresh"; $bk.detail = "backup presente; freschezza skill non determinabile (directory skill non ispezionabili)"
    }
}
$report.backup = $bk

$json = $report | ConvertTo-Json -Depth 5
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Join-Path $PWD.Path "health-report.json"), $json, $utf8NoBom)
Write-Output "health-report.json scritto nella directory corrente"
