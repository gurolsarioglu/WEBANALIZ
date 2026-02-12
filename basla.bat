@echo off
echo ==========================================
echo   Crypto Scalp Analyzer Baslatiliyor...
echo ==========================================
echo.

REM node_modules kontrolu
if not exist "node_modules\" (
    echo node_modules bulunamadi, bagimliliklari yukluyorum...
    echo.
    call npm install
    echo.
)

echo Gelistirme sunucusu baslatiliyor...
echo.
echo Tarayicinizda otomatik olarak acilacak:
echo http://localhost:3000
echo.
echo Durdurmak icin Ctrl+C tuslayiniz.
echo.

REM Tarayiciyi otomatik ac (birkaç saniye sonra)
start /B timeout /t 3 /nobreak >nul && start http://localhost:3000

REM Dev sunucusunu baslat
call npm run dev

pause
