$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$envPath = Join-Path $projectRoot 'backend/.env'
if (-not (Test-Path -LiteralPath $envPath -PathType Leaf)) {
  throw 'Create backend/.env from backend/.env.example and configure it before seeding the initial administrator.'
}

# The seed command only creates an administrator when the collection is empty.
# It never edits backend/.env or changes an existing administrator password.
Push-Location $projectRoot
try {
  & npm.cmd --prefix backend run seed:admin
  if ($LASTEXITCODE -ne 0) {
    throw 'The initial administrator was not created. Check MongoDB and the safe configuration messages above.'
  }
} finally {
  Pop-Location
}
