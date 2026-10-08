@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
set PYTHONIOENCODING=utf-8

if not exist venv\Scripts\python.exe (
    echo Virtual environment not found.
    echo Run setup_windows.bat first.
    pause
    exit /b 1
)

"venv\Scripts\python.exe" app.py

pause
