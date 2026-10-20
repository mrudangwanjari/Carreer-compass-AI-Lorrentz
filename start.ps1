# CareerCompass AI — Start both servers
# Run from LorrentzFM/ root:  .\start.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  CareerCompass AI — Starting servers" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Starting FastAPI backend on port 5455..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd "C:\Users\MRUDANG WANJARI\Desktop\LorrentzFM"; python -m backend.run'

Start-Sleep -Seconds 3

Write-Host "Starting Vite frontend on port 5453..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd "C:\Users\MRUDANG WANJARI\Desktop\LorrentzFM\careercompass"; npm run dev'

Write-Host "`n✓ Frontend: http://localhost:5453" -ForegroundColor Green
Write-Host "✓ Backend:  http://localhost:5455" -ForegroundColor Green
Write-Host "✓ API Docs: http://localhost:5455/docs" -ForegroundColor Green
Write-Host "`nDemo: Click the amber 'Demo' button on the landing page.`n"
