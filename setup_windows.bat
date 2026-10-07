@echo off
setlocal
cd /d "%~dp0"
echo ==========================================
echo SWEETFIX - WEEK 1 SETUP
echo ==========================================

python -m venv venv
if errorlevel 1 goto failed

"venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto failed

if not exist .env (
    copy .env.example .env
    echo.
    echo A new .env file has been created.
    echo Open .env and paste your real RecipeDB API key.
) else (
    echo .env already exists.
)

echo.
echo Setup complete.
echo After adding your API key to .env, run:
echo python app.py
pause
exit /b 0

:failed
echo.
echo Setup failed. Review the error above and try again.
pause
exit /b 1
