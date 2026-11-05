@echo off
title Servidor Local - Portfolio G. Lovato Roseira
echo Iniciando servidor local em http://localhost:8080/ ...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
pause
