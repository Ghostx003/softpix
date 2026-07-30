@echo off
echo ==============================================
echo SoftPix JSON Path Migration Utility
echo ==============================================
echo.

:: Ensure the script runs in the directory where the .bat file is located
cd /d "%~dp0"

:: Run the python script
python migrate_paths.py

echo.
echo ==============================================
pause
