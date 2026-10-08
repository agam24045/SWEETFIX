@echo off
setlocal
cd /d "%~dp0"
echo Running SweetFix from: %CD%
echo Live RecipeDB search: up to 50 matches
echo.

if not exist venv\Scripts\python.exe (
    echo Virtual environment not found.
    echo Run setup_windows.bat first.
    pause
    exit /b 1
)

"venv\Scripts\python.exe" app.py

pause
