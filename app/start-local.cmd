@echo off
rem Starts AllSeattle locally: the database and the site, each in its own window.
rem Double-click this file. Close both windows to stop the site.
cd /d "%~dp0"
start "AllSeattle - database" cmd /k pnpm db
timeout /t 8 /nobreak >nul
start "AllSeattle - site" cmd /k pnpm start
timeout /t 15 /nobreak >nul
start "" http://localhost:3000/
