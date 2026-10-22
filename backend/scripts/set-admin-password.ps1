$ErrorActionPreference = 'Stop'

$backendDirectory = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $backendDirectory '.env'
$originalEnv = [System.IO.File]::ReadAllText($envPath)

function Get-EnvValue([string] $name, [string] $text) {
  $match = [regex]::Match($text, '(?m)^' + [regex]::Escape($name) + '=([^\r\n]*)')
  if (-not $match.Success) { throw "Required $name entry is missing from backend/.env." }
  $value = $match.Groups[1].Value.Trim()
  if ($value.Length -ge 2 -and (($value[0] -eq '"' -and $value[$value.Length - 1] -eq '"') -or ($value[0] -eq "'" -and $value[$value.Length - 1] -eq "'"))) {
    $value = $value.Substring(1, $value.Length - 2)
  }
  return $value
}

$adminEmail = (Get-EnvValue 'ADMIN_EMAIL' $originalEnv).Trim().ToLowerInvariant()
$mongoUri = Get-EnvValue 'MONGODB_URI' $originalEnv
$jwtSecret = Get-EnvValue 'JWT_SECRET' $originalEnv
if ([uri]::new($mongoUri).AbsolutePath.Trim('/') -ne 'medflow_ai') {
  throw 'backend/.env must point to the medflow_ai database before running this helper.'
}
if ([System.Text.Encoding]::UTF8.GetByteCount($jwtSecret) -lt 32) {
  throw 'JWT_SECRET is not configured with the required minimum length.'
}

$securePassword = Read-Host 'Choose your admin password (12–128 characters; input is hidden)' -AsSecureString
$passwordPointer = [IntPtr]::Zero
$plainPassword = $null
$environmentWritten = $false
$seedSucceeded = $false
$serverProcess = $null
$environmentNames = @('MONGODB_URI', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'JWT_SECRET', 'PORT', 'NODE_ENV', 'FRONTEND_ORIGIN')
$savedEnvironment = @{}
foreach ($name in $environmentNames) {
  $savedEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
}

try {
  $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
  $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  if ($plainPassword.Length -lt 12 -or $plainPassword.Length -gt 128) {
    throw 'Password length must be between 12 and 128 characters. No configuration was changed.'
  }
  if ($plainPassword.Contains("'") -or $plainPassword.Contains("`r") -or $plainPassword.Contains("`n")) {
    throw "Use a password without apostrophes or line breaks so it can be stored safely in backend/.env. No configuration was changed."
  }

  $passwordLine = [regex]::Match($originalEnv, '(?m)^ADMIN_PASSWORD=[^\r\n]*')
  if (-not $passwordLine.Success -or ([regex]::Matches($originalEnv, '(?m)^ADMIN_PASSWORD=')).Count -ne 1) {
    throw 'backend/.env must contain exactly one ADMIN_PASSWORD entry.'
  }
  $newPasswordLine = "ADMIN_PASSWORD='$plainPassword'"
  $updatedEnv = $originalEnv.Substring(0, $passwordLine.Index) + $newPasswordLine + $originalEnv.Substring($passwordLine.Index + $passwordLine.Length)
  [System.IO.File]::WriteAllText($envPath, $updatedEnv, [System.Text.UTF8Encoding]::new($false))
  $environmentWritten = $true

  foreach ($name in $environmentNames) {
    [Environment]::SetEnvironmentVariable($name, $null, 'Process')
  }
  $nodePath = (Get-Command node.exe -ErrorAction Stop).Source
  Push-Location $backendDirectory
  try {
    $null = & $nodePath 'src/scripts/seedAdmin.js' 2>$null
    if ($LASTEXITCODE -ne 0) { throw 'The secure admin synchronization did not complete.' }
    $seedSucceeded = $true
  } finally {
    Pop-Location
  }

  $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
  $listener.Start()
  $port = ([System.Net.IPEndPoint]$listener.LocalEndpoint).Port
  $listener.Stop()
  [Environment]::SetEnvironmentVariable('PORT', [string]$port, 'Process')
  [Environment]::SetEnvironmentVariable('NODE_ENV', 'development', 'Process')
  $serverProcess = Start-Process -FilePath $nodePath -ArgumentList @('src/server.js') -WorkingDirectory $backendDirectory -PassThru -WindowStyle Hidden
  $baseUrl = "http://127.0.0.1:$port/api/auth"

  $ready = $false
  for ($attempt = 0; $attempt -lt 60; $attempt++) {
    try {
      $health = Invoke-RestMethod -Uri "http://127.0.0.1:$port/api/health" -TimeoutSec 2
      if ($health.status -eq 'ok' -and $health.database.connected) { $ready = $true; break }
    } catch { }
    Start-Sleep -Milliseconds 250
  }
  if (-not $ready) { throw 'The configured MedFlow backend did not become ready for verification.' }

  $session = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
  $loginBody = @{ email = $adminEmail; password = $plainPassword; remember = $true } | ConvertTo-Json -Compress
  $firstLogin = Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -ContentType 'application/json' -Body $loginBody -WebSession $session
  if ($firstLogin.user.email -ne $adminEmail) { throw 'The first login did not return the configured administrator.' }
  $firstSession = Invoke-RestMethod -Uri "$baseUrl/me" -Method Get -WebSession $session
  if ($firstSession.user.email -ne $adminEmail) { throw 'Session verification failed.' }
  $null = Invoke-RestMethod -Uri "$baseUrl/logout" -Method Post -WebSession $session
  try {
    $null = Invoke-RestMethod -Uri "$baseUrl/me" -Method Get -WebSession $session
    throw 'Logout did not invalidate the session.'
  } catch {
    if ([int]$_.Exception.Response.StatusCode -ne 401) { throw 'Logout session invalidation could not be verified.' }
  }

  $secondSession = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
  $secondLogin = Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -ContentType 'application/json' -Body $loginBody -WebSession $secondSession
  if ($secondLogin.user.email -ne $adminEmail) { throw 'The second login did not return the configured administrator.' }
  $null = Invoke-RestMethod -Uri "$baseUrl/me" -Method Get -WebSession $secondSession
  $null = Invoke-RestMethod -Uri "$baseUrl/logout" -Method Post -WebSession $secondSession
  Write-Output 'Admin password updated with bcrypt. Login, logout, session invalidation, and login again succeeded against medflow_ai.'
} catch {
  if ($environmentWritten -and -not $seedSucceeded) {
    [System.IO.File]::WriteAllText($envPath, $originalEnv, [System.Text.UTF8Encoding]::new($false))
  }
  throw $_.Exception.Message
} finally {
  if ($serverProcess -and -not $serverProcess.HasExited) {
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
  }
  foreach ($name in $environmentNames) {
    [Environment]::SetEnvironmentVariable($name, $savedEnvironment[$name], 'Process')
  }
  if ($passwordPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
  }
  if ($securePassword) { $securePassword.Dispose() }
  $plainPassword = $null
  $loginBody = $null
  $securePassword = $null
}
