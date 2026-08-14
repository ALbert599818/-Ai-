@echo off
title Quotation System
cd /d "%~dp0"

echo ============================================
echo   Quotation System - Starting...
echo   Browser will open in about 3 seconds.
echo   Close this window to stop the server.
echo ============================================
echo.

start "" /b powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:3000'"

node.exe dist\server\main.js

echo.
echo Server stopped. Press any key to close...
pause >nul
