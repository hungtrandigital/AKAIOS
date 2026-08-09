[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'High')]
param(
    [Parameter(Position = 0)]
    [ValidateSet('Validate', 'Install', 'Start', 'Update', 'ResetSeedUat', 'Status', 'Logs', 'Stop', 'SmokeTest')]
    [string]$Action = 'Status',

    [ValidatePattern('^[0-9a-fA-F]{40}$')]
    [string]$ReleaseSha,

    [string]$Remote = 'origin',
    [string]$BackupRoot = 'C:\AKAIOS-Backups',
    [switch]$SeedDemoData,
    [switch]$ConfirmSeedOnly,
    [switch]$External,
    [switch]$Follow
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$EnvPath = Join-Path $RepoRoot '.env'
$BaseCompose = Join-Path $RepoRoot 'systems\shared\docker-compose.yml'
$WindowsCompose = Join-Path $RepoRoot 'systems\shared\docker-compose.windows.yml'
$ComposeArgs = @('--env-file', $EnvPath, '-f', $BaseCompose, '-f', $WindowsCompose)
$ExpectedRemote = '^(https://github\.com/|git@github\.com:)hungtrandigital/akaios(?:\.git)?$'
$MinioClientImage = 'minio/mc@sha256:a7fe349ef4bd8521fb8497f55c6042871b2ae640607cf99d9bede5e9bdf11727'

function Invoke-Checked {
    param(
        [Parameter(Mandatory)] [string]$FilePath,
        [string[]]$Arguments = @(),
        [switch]$Capture
    )

    if ($Capture) {
        $output = & $FilePath @Arguments 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "$FilePath failed with exit code $LASTEXITCODE."
        }
        return ($output | Out-String).Trim()
    }

    & $FilePath @Arguments 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) {
        throw "$FilePath failed with exit code $LASTEXITCODE."
    }
}

function Invoke-Compose {
    param([Parameter(Mandatory)] [string[]]$Arguments, [switch]$Capture)
    Invoke-Checked -FilePath 'docker' -Arguments (@('compose') + $ComposeArgs + $Arguments) -Capture:$Capture
}

function Read-DotEnv {
    $values = @{}
    foreach ($line in Get-Content -LiteralPath $EnvPath) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith('#') -or $trimmed -notmatch '^([^=]+)=(.*)$') {
            continue
        }
        $key = $Matches[1].Trim()
        $value = $Matches[2].Trim()
        if ($value.Length -ge 2 -and (($value[0] -eq '"' -and $value[-1] -eq '"') -or ($value[0] -eq "'" -and $value[-1] -eq "'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        $values[$key] = $value
    }
    return $values
}

function Assert-Environment {
    if (-not (Test-Path -LiteralPath $EnvPath -PathType Leaf)) {
        throw "Missing $EnvPath. Copy .env.example to .env and follow the Windows runbook."
    }

    $envValues = Read-DotEnv
    $required = @(
        'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB',
        'MINIO_ROOT_USER', 'MINIO_ROOT_PASSWORD', 'MINIO_PUBLIC_ENDPOINT',
        'JWT_SECRET', 'INTERNAL_API_KEY', 'TOTP_ENCRYPTION_KEY',
        'TOTP_ENCRYPTION_KEY_VERSION', 'SMS_MODE', 'CADDY_STORAGE_HOST'
    )
    foreach ($key in $required) {
        if (-not $envValues.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($envValues[$key])) {
            throw "Environment key $key is missing or empty."
        }
        if ($envValues[$key] -match 'CHANGE_ME|placeholder|base64-encoded') {
            throw "Environment key $key still contains a placeholder."
        }
    }
    if ($envValues['NODE_ENV'] -ne 'production') {
        throw 'Windows shared/UAT Compose requires NODE_ENV=production.'
    }
    if ($envValues.ContainsKey('DEV_FIXED_ADMIN_2FA_CODE') -and $envValues['DEV_FIXED_ADMIN_2FA_CODE']) {
        throw 'DEV_FIXED_ADMIN_2FA_CODE must be empty. Shared/UAT uses real TOTP.'
    }
    if ($envValues['SMS_MODE'] -ne 'speedsms') {
        throw 'SMS_MODE must be speedsms for the shared/UAT profile.'
    }
    foreach ($key in @('SPEEDSMS_ACCESS_TOKEN', 'SPEEDSMS_SENDER')) {
        if (-not $envValues.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($envValues[$key])) {
            throw "Environment key $key is required when SMS_MODE=speedsms."
        }
    }
    foreach ($key in @('POSTGRES_PASSWORD', 'MINIO_ROOT_PASSWORD', 'JWT_SECRET', 'INTERNAL_API_KEY')) {
        if ($envValues[$key].Length -lt 32) {
            throw "Environment key $key must contain at least 32 characters."
        }
    }
    try {
        $totpKey = [Convert]::FromBase64String($envValues['TOTP_ENCRYPTION_KEY'])
    } catch {
        throw 'TOTP_ENCRYPTION_KEY must be valid Base64.'
    }
    if ($totpKey.Length -ne 32) {
        throw 'TOTP_ENCRYPTION_KEY must decode to exactly 32 bytes.'
    }
    $publicEndpoint = $null
    if (-not [Uri]::TryCreate($envValues['MINIO_PUBLIC_ENDPOINT'], [UriKind]::Absolute, [ref]$publicEndpoint) -or $publicEndpoint.Scheme -ne 'https') {
        throw 'MINIO_PUBLIC_ENDPOINT must be an absolute HTTPS URL.'
    }
    if ($publicEndpoint.Host -ne $envValues['CADDY_STORAGE_HOST']) {
        throw 'MINIO_PUBLIC_ENDPOINT host must equal CADDY_STORAGE_HOST.'
    }
    if ($publicEndpoint.Host.EndsWith('.example.com') -or $publicEndpoint.Host -eq 'example.com') {
        throw 'Replace the example storage hostname before shared/UAT deployment.'
    }
}

function Assert-Tooling {
    foreach ($command in @('git', 'docker')) {
        if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
            throw "$command is not installed or not on PATH."
        }
    }
    $dockerOs = Invoke-Checked -FilePath 'docker' -Arguments @('info', '--format', '{{.OSType}}') -Capture
    if ($dockerOs -ne 'linux') {
        throw 'Docker Desktop must be running Linux containers through WSL2.'
    }
    $composeVersion = Invoke-Checked -FilePath 'docker' -Arguments @('compose', 'version', '--short') -Capture
    $parsedVersion = [version]($composeVersion.TrimStart('v').Split('-')[0])
    if ($parsedVersion -lt [version]'2.24.4') {
        throw 'Docker Compose 2.24.4 or newer is required for !override merge tags.'
    }
}

function Assert-Repository {
    Set-Location $RepoRoot
    $dirty = Invoke-Checked -FilePath 'git' -Arguments @('status', '--porcelain') -Capture
    if ($dirty) {
        throw 'Git worktree is dirty. Preserve or commit operator-owned changes before deployment.'
    }
    $remoteUrl = Invoke-Checked -FilePath 'git' -Arguments @('remote', 'get-url', $Remote) -Capture
    if ($remoteUrl.ToLowerInvariant() -notmatch $ExpectedRemote) {
        throw "Remote $Remote is not the canonical hungtrandigital/AKAIOS repository."
    }
}

function Assert-Release {
    if (-not $ReleaseSha) {
        throw '-ReleaseSha requires the full 40-character reviewed commit SHA.'
    }
    if (-not $WhatIfPreference) {
        Invoke-Checked -FilePath 'git' -Arguments @('fetch', '--quiet', '--prune', $Remote, 'main')
    }
    Invoke-Checked -FilePath 'git' -Arguments @('cat-file', '-e', "$ReleaseSha^{commit}")
    & git merge-base --is-ancestor $ReleaseSha "$Remote/main"
    if ($LASTEXITCODE -ne 0) {
        throw "Release SHA is not contained in $Remote/main. Merge and pass CI/review first."
    }
}

function Assert-WindowsVolumes {
    $expected = @{
        'ak-postgres' = @('/var/lib/postgresql/data', 'akaios-postgres-data')
        'ak-redis' = @('/data', 'akaios-redis-data')
        'ak-minio' = @('/data', 'akaios-minio-data')
    }
    foreach ($containerName in $expected.Keys) {
        $exists = & docker container inspect $containerName --format '{{json .Mounts}}' 2>$null
        if ($LASTEXITCODE -ne 0) { continue }
        $mount = ($exists | ConvertFrom-Json) | Where-Object { $_.Destination -eq $expected[$containerName][0] }
        if (-not $mount -or $mount.Type -ne 'volume' -or $mount.Name -ne $expected[$containerName][1]) {
            throw "$containerName uses a legacy/unknown mount. Stop and follow the legacy-volume checkpoint in the Windows runbook; no data was changed."
        }
    }
}

function Assert-NewInstallPorts {
    if (-not (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue)) { return }
    foreach ($port in @(80, 3000, 3001, 3002, 5432, 6379, 9000, 9001)) {
        if (Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue) {
            throw "Host port $port is already in use."
        }
    }
}

function Assert-FreshInstall {
    foreach ($containerName in @('ak-attendance-api', 'ak-payroll-api', 'ak-postgres', 'ak-redis', 'ak-minio', 'ak-web-admin', 'ak-caddy')) {
        & docker container inspect $containerName *> $null
        if ($LASTEXITCODE -eq 0) {
            throw "Install requires a fresh host, but container $containerName already exists. Use Start, Update, or the confirmed seed-only reset path."
        }
    }
    foreach ($volumeName in @('akaios-postgres-data', 'akaios-redis-data', 'akaios-minio-data', 'akaios-caddy-data', 'akaios-caddy-config')) {
        & docker volume inspect $volumeName *> $null
        if ($LASTEXITCODE -eq 0) {
            throw "Install requires fresh storage, but volume $volumeName already exists."
        }
    }
}

function Assert-SeedOnlyDatabase {
    if (-not $ConfirmSeedOnly) {
        throw 'ResetSeedUat requires -ConfirmSeedOnly in addition to the interactive high-impact confirmation.'
    }
    $running = & docker container inspect ak-postgres --format '{{.State.Running}}' 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw 'ResetSeedUat requires an existing ak-postgres container so its seed-only sentinel can be verified.'
    }
    $startedForClassification = $running -ne 'true'
    if ($startedForClassification -and $WhatIfPreference) {
        throw 'The stopped ak-postgres container cannot be classified in -WhatIf mode. Start only ak-postgres, rerun -WhatIf, then stop it again.'
    }
    try {
        if ($startedForClassification) {
            Invoke-Checked -FilePath 'docker' -Arguments @('start', 'ak-postgres')
            $ready = $false
            for ($attempt = 1; $attempt -le 30; $attempt++) {
                & docker exec ak-postgres sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' *> $null
                if ($LASTEXITCODE -eq 0) { $ready = $true; break }
                Start-Sleep -Seconds 2
            }
            if (-not $ready) { throw 'ak-postgres did not become ready for seed-only classification.' }
        }

        $query = 'SELECT CASE WHEN (SELECT COUNT(*) FROM tenants) = 1 AND EXISTS (SELECT 1 FROM tenants WHERE id::text = ''c0ffee00-0000-4000-8000-000000000001'') AND EXISTS (SELECT 1 FROM users WHERE email = ''admin@ak.local'') THEN ''seed-only'' ELSE ''unknown'' END;'
        $classification = Invoke-Checked -FilePath 'docker' -Arguments @('exec', 'ak-postgres', 'sh', '-c', "psql -At -U `"`$POSTGRES_USER`" -d `"`$POSTGRES_DB`" -c `"$query`"") -Capture
        if ($classification -ne 'seed-only') {
            throw 'The current database does not match the committed seed-only sentinel. Reset is refused.'
        }
    } finally {
        if ($startedForClassification) {
            Invoke-Checked -FilePath 'docker' -Arguments @('stop', 'ak-postgres')
        }
    }
}

function Test-ComposeConfiguration {
    Invoke-Compose -Arguments @('config', '--quiet')
}

function Backup-State {
    $backupPath = [System.IO.Path]::GetFullPath((Join-Path $BackupRoot (Get-Date -Format 'yyyyMMdd-HHmmss')))
    if ($backupPath.StartsWith($RepoRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw 'BackupRoot must be outside the Git repository.'
    }
    New-Item -ItemType Directory -Force -Path $backupPath | Out-Null

    Invoke-Checked -FilePath 'docker' -Arguments @('exec', 'ak-postgres', 'sh', '-c', 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f /tmp/akaios-preupdate.dump && pg_restore --list /tmp/akaios-preupdate.dump >/dev/null')
    Invoke-Checked -FilePath 'docker' -Arguments @('cp', 'ak-postgres:/tmp/akaios-preupdate.dump', (Join-Path $backupPath 'postgres.dump'))
    Invoke-Checked -FilePath 'docker' -Arguments @('exec', 'ak-postgres', 'rm', '-f', '/tmp/akaios-preupdate.dump')

    $minioPath = Join-Path $backupPath 'minio'
    New-Item -ItemType Directory -Force -Path $minioPath | Out-Null
    $mountArg = "type=bind,source=$minioPath,target=/backup"
    $mirror = 'mc alias set source http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null && for bucket in attendance-photos reports; do mc stat "source/$bucket" >/dev/null && mkdir -p "/backup/$bucket" && mc mirror --overwrite "source/$bucket" "/backup/$bucket"; done'
    $envValues = Read-DotEnv
    $previousMinioUser = [Environment]::GetEnvironmentVariable('MINIO_ROOT_USER', 'Process')
    $previousMinioPassword = [Environment]::GetEnvironmentVariable('MINIO_ROOT_PASSWORD', 'Process')
    try {
        [Environment]::SetEnvironmentVariable('MINIO_ROOT_USER', $envValues['MINIO_ROOT_USER'], 'Process')
        [Environment]::SetEnvironmentVariable('MINIO_ROOT_PASSWORD', $envValues['MINIO_ROOT_PASSWORD'], 'Process')
        Invoke-Checked -FilePath 'docker' -Arguments @('run', '--rm', '--network', 'ak-monorepo_ak-net', '--env', 'MINIO_ROOT_USER', '--env', 'MINIO_ROOT_PASSWORD', '--mount', $mountArg, '--entrypoint', '/bin/sh', $MinioClientImage, '-c', $mirror)
    } finally {
        [Environment]::SetEnvironmentVariable('MINIO_ROOT_USER', $previousMinioUser, 'Process')
        [Environment]::SetEnvironmentVariable('MINIO_ROOT_PASSWORD', $previousMinioPassword, 'Process')
    }

    $files = Get-ChildItem -LiteralPath $backupPath -File -Recurse
    if (-not $files) { throw 'Backup verification found no files.' }
    $manifest = foreach ($file in $files) {
        $relative = [System.IO.Path]::GetRelativePath($backupPath, $file.FullName)
        "{0}  {1}" -f (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant(), $relative
    }
    $manifest | Set-Content -LiteralPath (Join-Path $backupPath 'sha256-manifest.txt') -Encoding utf8
    return $backupPath
}

function Build-Applications {
    Invoke-Compose -Arguments @('build', '--pull', 'db-migrate', 'attendance-api', 'payroll-api', 'web-admin')
}

function Stop-ApplicationWriters {
    Invoke-Compose -Arguments @('stop', 'caddy')
    Invoke-Compose -Arguments @('stop', 'web-admin', 'payroll-api', 'attendance-api')
}

function Start-Stack {
    param([switch]$IncludeDemoSeed)
    Stop-ApplicationWriters
    Invoke-Compose -Arguments @('up', '-d', 'postgres', 'redis', 'minio')
    Invoke-Compose -Arguments @('run', '--rm', 'db-migrate')
    if ($IncludeDemoSeed) {
        Invoke-Compose -Arguments @(
            'run', '--rm', '--env', 'ALLOW_DEMO_SEED=true', 'db-migrate',
            'pnpm', '--filter', '@ak/shared', 'db:seed:all'
        )
    }
    else {
        Invoke-Compose -Arguments @('run', '--rm', 'db-migrate', 'pnpm', '--filter', '@ak/shared', 'db:seed:rbac')
    }
    Invoke-Compose -Arguments @('up', '-d', '--no-build')
}

function Reset-SeedDatabase {
    Stop-ApplicationWriters
    Invoke-Compose -Arguments @('up', '-d', 'postgres', 'redis', 'minio')
    Invoke-Compose -Arguments @(
        'run', '--rm', 'db-migrate',
        './systems/shared/node_modules/.bin/prisma', 'migrate', 'reset', '--force', '--skip-seed',
        '--schema=systems/shared/src/db/prisma/schema.prisma'
    )
    Invoke-Compose -Arguments @(
        'run', '--rm', '--env', 'ALLOW_DEMO_SEED=true', 'db-migrate',
        'pnpm', '--filter', '@ak/shared', 'db:seed:all'
    )
    Invoke-Compose -Arguments @('up', '-d', '--no-build')
}

function Test-StackHealth {
    param([switch]$IncludeExternalStorage)
    $targets = @(
        @('Attendance readiness', 'http://127.0.0.1:3000/health/ready'),
        @('Payroll readiness', 'http://127.0.0.1:3001/health/ready'),
        @('Web admin', 'http://127.0.0.1:3002/'),
        @('MinIO local health', 'http://127.0.0.1:9000/minio/health/live')
    )
    if ($IncludeExternalStorage) {
        if ([string]::IsNullOrWhiteSpace($env:CF_ACCESS_CLIENT_ID) -or [string]::IsNullOrWhiteSpace($env:CF_ACCESS_CLIENT_SECRET)) {
            throw 'External smoke test requires CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET in the current process environment.'
        }
        $envValues = Read-DotEnv
        $storageHealth = $envValues['MINIO_PUBLIC_ENDPOINT'].TrimEnd('/') + '/minio/health/live'
        $targets += ,@('MinIO external health', $storageHealth, @{
            'CF-Access-Client-Id' = $env:CF_ACCESS_CLIENT_ID
            'CF-Access-Client-Secret' = $env:CF_ACCESS_CLIENT_SECRET
        }, $true)
    }
    foreach ($target in $targets) {
        $healthy = $false
        for ($attempt = 1; $attempt -le 60; $attempt++) {
            try {
                $request = @{
                    Uri = $target[1]
                    TimeoutSec = 5
                    UseBasicParsing = $true
                    MaximumRedirection = 0
                }
                if ($target.Count -ge 3) { $request['Headers'] = $target[2] }
                $response = Invoke-WebRequest @request
                $contentType = [string]$response.Headers['Content-Type']
                $rejectHtml = $target.Count -ge 4 -and $target[3]
                if ($response.StatusCode -eq 200 -and (-not $rejectHtml -or $contentType -notmatch 'text/html')) {
                    $healthy = $true
                    break
                }
            } catch { Start-Sleep -Seconds 2 }
        }
        if (-not $healthy) { throw "$($target[0]) did not become healthy: $($target[1])" }
        Write-Output "PASS: $($target[0]) - $($target[1])"
    }
}

Set-Location $RepoRoot
Assert-Tooling
$operationalAction = $Action -in @('Status', 'Logs', 'Stop', 'SmokeTest')
if ($operationalAction) {
    if ($Action -eq 'SmokeTest' -and $External) {
        Assert-Environment
    } elseif ($Action -ne 'SmokeTest' -and -not (Test-Path -LiteralPath $EnvPath -PathType Leaf)) {
        throw "Missing $EnvPath."
    }
} else {
    Assert-Environment
    Assert-Repository
    Test-ComposeConfiguration
}

switch ($Action) {
    'Validate' {
        if ($ReleaseSha) { Assert-Release }
        $existingPostgres = & docker container inspect ak-postgres --format '{{.Id}}' 2>$null
        if ($LASTEXITCODE -eq 0 -and $existingPostgres) {
            Assert-WindowsVolumes
        } else {
            Assert-NewInstallPorts
        }
        Write-Output 'PASS: Windows Docker/UAT preflight and Compose validation.'
    }
    'Install' {
        Assert-Release
        Assert-FreshInstall
        Assert-NewInstallPorts
        $seedLabel = if ($SeedDemoData) { 'seed all demo data' } else { 'seed RBAC' }
        if ($PSCmdlet.ShouldProcess("AKAIOS Windows UAT at $ReleaseSha", "build, migrate, $seedLabel, and start")) {
            Invoke-Checked -FilePath 'git' -Arguments @('checkout', '--detach', $ReleaseSha)
            Test-ComposeConfiguration
            Build-Applications
            Start-Stack -IncludeDemoSeed:$SeedDemoData
            Test-StackHealth
        }
    }
    'Start' {
        Assert-WindowsVolumes
        $seedLabel = if ($SeedDemoData) { 'seed all demo data' } else { 'seed RBAC' }
        if ($PSCmdlet.ShouldProcess('AKAIOS Windows UAT', "run migrations, $seedLabel, and start")) {
            Start-Stack -IncludeDemoSeed:$SeedDemoData
            Test-StackHealth
        }
    }
    'Update' {
        Assert-Release
        Assert-WindowsVolumes
        $currentSha = Invoke-Checked -FilePath 'git' -Arguments @('rev-parse', 'HEAD') -Capture
        if ($currentSha -eq $ReleaseSha) { throw 'The requested release is already checked out.' }
        $seedLabel = if ($SeedDemoData) { 'seed all demo data' } else { 'seed RBAC' }
        if ($PSCmdlet.ShouldProcess("AKAIOS Windows UAT $currentSha -> $ReleaseSha", "backup, rebuild, migrate, $seedLabel, and restart")) {
            Invoke-Checked -FilePath 'git' -Arguments @('checkout', '--detach', $ReleaseSha)
            Test-ComposeConfiguration
            Build-Applications
            Stop-ApplicationWriters
            $backupPath = Backup-State
            Start-Stack -IncludeDemoSeed:$SeedDemoData
            Test-StackHealth
            [ordered]@{
                deployedAt = (Get-Date).ToString('o')
                previousSha = $currentSha
                releaseSha = $ReleaseSha
                backupPath = $backupPath
            } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $backupPath 'deployment-evidence.json') -Encoding utf8
        }
    }
    'ResetSeedUat' {
        Assert-Release
        Assert-SeedOnlyDatabase
        if ($PSCmdlet.ShouldProcess("AKAIOS seed-only Windows UAT at $ReleaseSha", 'permanently reset PostgreSQL, apply migrations, seed all demo data, and restart')) {
            Invoke-Checked -FilePath 'git' -Arguments @('checkout', '--detach', $ReleaseSha)
            Test-ComposeConfiguration
            Build-Applications
            Reset-SeedDatabase
            Test-StackHealth
        }
    }
    'Status' { Invoke-Compose -Arguments @('ps') }
    'Logs' {
        $logArgs = @('logs', '--tail', '200')
        if ($Follow) { $logArgs += '--follow' }
        Invoke-Compose -Arguments $logArgs
    }
    'Stop' {
        if ($PSCmdlet.ShouldProcess('AKAIOS Windows UAT', 'stop containers while preserving named volumes')) {
            Invoke-Compose -Arguments @('stop')
        }
    }
    'SmokeTest' { Test-StackHealth -IncludeExternalStorage:$External }
}
