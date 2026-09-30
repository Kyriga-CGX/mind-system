#Requires -Version 5.1
<#
.SYNOPSIS
    Sincronizza questo repo (source of truth) con la configurazione locale di opencode.

.DESCRIPTION
    Copia:
      - plugins/*.js                   -> ~/.config/opencode/plugins/          (auto-load di opencode)
      - skills/mind/*                  -> ~/.config/opencode/mind/skills/
      - skills/<altre skill>/*         -> ~/.agents/skills/                     (skill esterne auto-caricate)
      - config/agents/*.md             -> ~/.config/opencode/agents/
      - config/{opencode.jsonc,mind-memory.json,vibeguard.config.json,dcp.jsonc,AGENTS.md}
                                       -> ~/.config/opencode/                   (con backup .bak-<timestamp> dei file locali pre-overwrite)

    I placeholder {env:VAR} nella config risolvono dall'ambiente del processo all'avvio
    di opencode (NON ${VAR}, NON auto-load di .env): esportali prima di avviare opencode.

.PARAMETER ConfigRoot
    Directory config globale di opencode. Default: $HOME\.config\opencode

.PARAMETER AgentsSkillsRoot
    Directory delle skill esterne (auto-caricate). Default: $HOME\.agents\skills

.PARAMETER WhatIf
    Mostra cosa verrebbe sincronizzato senza copiare nulla.

.EXAMPLE
    .\sync.ps1

.EXAMPLE
    .\sync.ps1 -WhatIf
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [string]$ConfigRoot = (Join-Path $HOME '.config\opencode'),
    [string]$AgentsSkillsRoot = (Join-Path $HOME '.agents\skills')
)

$ErrorActionPreference = 'Stop'
$RepoRoot = $PSScriptRoot
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'

function Sync-Dir {
    param([string]$Source, [string]$Destination)
    if (-not (Test-Path -LiteralPath $Source)) {
        Write-Warning "Sorgente mancante, skip: $Source"
        return
    }
    if (-not (Test-Path -LiteralPath $Destination)) {
        if ($PSCmdlet.ShouldProcess($Destination, 'Create directory')) {
            New-Item -ItemType Directory -Path $Destination -Force | Out-Null
        }
    }
    if ($PSCmdlet.ShouldProcess($Destination, 'Sync contents')) {
        Copy-Item -Path (Join-Path $Source '*') -Destination $Destination -Recurse -Force
        Write-Host "  + $Source\* -> $Destination"
    }
}

function Sync-File {
    param([string]$Source, [string]$Destination)
    if (-not (Test-Path -LiteralPath $Source)) {
        Write-Warning "Sorgente mancante, skip: $Source"
        return
    }
    if ((Test-Path -LiteralPath $Destination) -and $PSCmdlet.ShouldProcess($Destination, 'Backup existing')) {
        Copy-Item -LiteralPath $Destination -Destination "$Destination.$stamp.bak" -Force
        Write-Host "  ~ backup: $Destination -> $Destination.$stamp.bak"
    }
    if ($PSCmdlet.ShouldProcess($Destination, 'Copy')) {
        Copy-Item -LiteralPath $Source -Destination $Destination -Force
        Write-Host "  + $Source -> $Destination"
    }
}

Write-Host '=== Plugins (auto-load top-level) ==='
Get-ChildItem -LiteralPath (Join-Path $RepoRoot 'plugins') -Filter '*.js' -File | ForEach-Object {
    Sync-File $_.FullName (Join-Path $ConfigRoot ("plugins\" + $_.Name))
}

Write-Host '=== Skill mind (fork orchestratore) ==='
Sync-Dir (Join-Path $RepoRoot 'skills\mind') (Join-Path $ConfigRoot 'mind\skills')

Write-Host '=== Skill esterne (~/.agents/skills) ==='
Get-ChildItem -LiteralPath (Join-Path $RepoRoot 'skills') -Directory | Where-Object { $_.Name -ne 'mind' } | ForEach-Object {
    Sync-Dir $_.FullName (Join-Path $AgentsSkillsRoot $_.Name)
}

Write-Host '=== Agenti custom ==='
Sync-Dir (Join-Path $RepoRoot 'config\agents') (Join-Path $ConfigRoot 'agents')

Write-Host '=== Config files ==='
$configFiles = @('opencode.jsonc', 'mind-memory.json', 'vibeguard.config.json', 'dcp.jsonc', 'AGENTS.md')
foreach ($f in $configFiles) {
    Sync-File (Join-Path $RepoRoot "config\$f") (Join-Path $ConfigRoot $f)
}

Write-Host ''
Write-Host 'Sync completato. La config non e hot-reload: riavvia opencode.'
Write-Host 'Nota: i placeholder {env:VAR} nella config risolvono dall''ambiente del processo'
Write-Host '      (es. setx CONTEXT7_API_KEY <valore>, poi riapri il terminale).'