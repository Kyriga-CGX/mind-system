# health-check.ps1
$ErrorActionPreference = "Stop"

function ConvertFrom-Jsonc {
    param(
        [Parameter(ValueFromPipeline = $true)]
        [string]$Text
    )
    process {
        $Text = [regex]::Replace($Text, '(?m)(^|[^:])//[^\r\n]*', '$1')
        $Text = [regex]::Replace($Text, '/\*.*?\*/', '', [System.Text.RegularExpressions.RegexOptions]::Singleline)
        $Text = [regex]::Replace($Text, '(?m),(\s*[}\]])', '$1')
        return $Text
    }
}

$mindRepo       = "C:\Users\Kyrig\OpenCode-Skill-memory"
$mindSrc        = Join-Path $mindRepo "skills\mind"
$mindDest       = "C:\Users\Kyrig\.config\opencode\mind\skills"
$mindPlugins    = "C:\Users\Kyrig\.config\opencode\plugins"
$customSkills   = "C:\Users\Kyrig\.agents\skills"
$opencodeConfig = "C:\Users\Kyrig\.config\opencode\opencode.jsonc"
$backupZipPattern = "opencode-backup-*.zip"

$report = @{
    checkedAt    = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
    mind         = $null
    skills       = $null
    context7     = $null
    plugins      = $null
    backup       = $null
    skillUpdates = @()
}

# --- MIND: plugin + skill del sistema mind ---
$expectedMindSkills = @(
    "using-mind", "mind-api", "mind-architecture", "mind-brainstorming", "mind-consult",
    "mind-copy", "mind-data", "mind-debugging", "mind-devops", "mind-docs",
    "mind-documents", "mind-eval", "mind-explore", "mind-git", "mind-i18n",
    "mind-implementation", "mind-incident", "mind-migration", "mind-performance", "mind-planning",
    "mind-recall", "mind-refactor", "mind-release", "mind-research", "mind-runner",
    "mind-security", "mind-setup", "mind-testing", "mind-verification"
)

$mind = @{ status = "ok"; detail = ""; plugins = @(); skills = @(); synced = $true; resynced = @() }
$problems = @()

$expectedPlugins = @("mind\mind.js", "mind-memory\mind-memory.js")
foreach ($p in $expectedPlugins) {
    if (-not (Test-Path -LiteralPath (Join-Path $mindPlugins $p))) { $problems += "plugin mancante: $p" }
}

$missingMind = @()
foreach ($s in $expectedMindSkills) {
    if (-not (Test-Path -LiteralPath (Join-Path $mindDest $s))) { $missingMind += $s }
}
if ($missingMind.Count -gt 0) {
    $mind.skills = $missingMind
    $problems += "skill mind mancanti in ~/.config/opencode/mind/skills: " + ($missingMind -join ", ")
}

$resynced = @()
foreach ($s in $expectedMindSkills) {
    $srcPath  = Join-Path $mindSrc $s
    $destPath = Join-Path $mindDest $s
    $needsCopy = $false
    if (-not (Test-Path -LiteralPath $destPath)) {
        $needsCopy = $true
    } elseif ((Test-Path -LiteralPath $srcPath) -and ((Get-Item -LiteralPath $destPath).LastWriteTime -lt (Get-Item -LiteralPath $srcPath).LastWriteTime)) {
        $needsCopy = $true
    }
    if ($needsCopy) {
        if (Test-Path -LiteralPath $srcPath) {
            if (Test-Path -LiteralPath $destPath) { Remove-Item -LiteralPath $destPath -Recurse -Force }
            Copy-Item -Path $srcPath -Destination $destPath -Recurse -Force
            $resynced += $s
        } else {
            $problems += "skill $s assente anche nel repo (OpenCode-Skill-memory)"
        }
    }
}
$mind.resynced = $resynced
if ($resynced.Count -gt 0) {
    $mind.synced = $false
    if ($mind.detail -eq "") { $mind.detail = "risincronizzate dal repo: " + ($resynced -join ", ") }
    else { $mind.detail += "; risincronizzate dal repo: " + ($resynced -join ", ") }
}

if ($problems.Count -gt 0) {
    $mind.status = "missing"
    if ($mind.detail -eq "") { $mind.detail = $problems -join "; " }
    else { $mind.detail += "; " + ($problems -join "; ") }
} else {
    if ($mind.detail -eq "") { $mind.detail = "plugin e 29 skill mind presenti e allineati al repo" }
}
$report.mind = $mind

# --- SKILLS curate (~/.agents/skills) ---
$expectedCustom = @("context7-mcp", "ecosystem-health-check", "stop-slop", "frontend-design", "design-md", "orchestrator", "execution-hygiene", "design-system", "motion")
$missing = @()
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

# --- skillUpdates (git) ---
$skillGit = @(
    @{ name = "stop-slop";        type = "direct";   path = "C:\Users\Kyrig\.agents\skills\stop-slop" },
    @{ name = "frontend-design";  type = "registry"; path = "C:\Users\Kyrig\.agents\skill-sources\anthropics-skills"; rel = "skills\frontend-design"; dest = "C:\Users\Kyrig\.agents\skills\frontend-design" },
    @{ name = "design-md";        type = "registry"; path = "C:\Users\Kyrig\.agents\skill-sources\open-design"; rel = "skills\design-md"; dest = "C:\Users\Kyrig\.agents\skills\design-md" }
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

# --- context7 ---
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

# --- plugins (config globale) ---
$plugins = @{ status = "ok"; detail = ""; missing = @() }
try {
    $cfg = Get-Content -LiteralPath $opencodeConfig -Raw | ConvertFrom-Jsonc | ConvertFrom-Json
    $requiredPlugins = @("mind/mind.js", "mind-memory/mind-memory.js", "opencode-vibeguard", "@tarquinen/opencode-dcp")
    foreach ($rp in $requiredPlugins) {
        if (-not ($cfg.plugin | Where-Object { $_ -like "*$rp*" })) { $plugins.missing += $rp }
    }
    $requiredConfigs = @("vibeguard.config.json", "dcp.jsonc")
    foreach ($rc in $requiredConfigs) {
        if (-not (Test-Path -LiteralPath (Join-Path (Split-Path $opencodeConfig) $rc))) { $plugins.missing += $rc }
    }
    if ($plugins.missing.Count -gt 0) {
        $plugins.status = "missing"; $plugins.detail = "elementi mancanti: " + ($plugins.missing -join ", ")
    } else {
        $plugins.detail = "plugin e config presenti"
    }
} catch {
    $plugins.status = "check-failed"; $plugins.detail = "errore lettura config: $($_.Exception.Message)"
}
$report.plugins = $plugins

# --- backup ---
$bk = @{ status = "no-backup"; detail = "nessuno zip opencode-backup-*.zip trovato nella directory corrente"; lastBackup = ""; lastSkillChange = "" }
$zip = Get-ChildItem -Path (Join-Path $PWD.Path $backupZipPattern) -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($zip) {
    $bk.lastBackup = $zip.LastWriteTime.ToString("yyyy-MM-ddTHH:mm:ss")
    $lastSkillChange = $null
    foreach ($dir in @($mindSrc, $mindDest, $customSkills)) {
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