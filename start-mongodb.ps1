# start-mongodb.ps1
Write-Host "🚀 Starting MongoDB..." -ForegroundColor Yellow

# Create data directory if it doesn't exist
New-Item -ItemType Directory -Force -Path "C:\data\db" | Out-Null

# Start MongoDB
Write-Host "📚 MongoDB starting at: C:\data\db" -ForegroundColor Cyan
& "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" --dbpath "C:\data\db"

Write-Host "✅ MongoDB started successfully!" -ForegroundColor Green