@echo off
title Calendario de Endomarketing 2027
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor.ps1" %*
if errorlevel 1 pause
