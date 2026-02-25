@echo off
REM Wrapper script to start Caddy - for PM2
cd /d "%~dp0.."
caddy run
