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

$c7 = @{ status = "ok"; detail = "" }
try {
    $cfg = Get-Content -LiteralPath $opencodeConfig -Raw | ConvertFrom-Jsonc | ConvertFrom-Json
    $c7Entry = $cfg.mcp.context7
    if ($null -eq $c7Entry) {
        $c7.status = "misconfigured"; $c7.detail = "entry mcp.context7 assente"
    } elseif ($c7Entry.enabled -ne $true) {
        $c7.status = "misconfigured"; $c7.detail = "context7 non abilitato (enabled != true)"
    } elseif ($c7Entry.url -ne "https://mcp.context7.com/mcp") {
        $c7.status = "misconfigured"; $c7.detail = "url errato: $($c7Entry.url)"
    } else {
        $c7.status = "ok"; $c7.detail = "context7 configurato e abilitato"
    }
} catch {
    $c7.status = "check-failed"; $c7.detail = "errore lettura o parse opencode.jsonc: $($_.Exception.Message)"
}
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
