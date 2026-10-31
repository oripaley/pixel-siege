@echo off
rem Double-click to start the local server and open the game in your browser.
start "" http://localhost:8000/
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" -Port 8000
