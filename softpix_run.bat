@echo off
title SoftPix Launcher
color 0B

:MAIN_MENU
cls
echo ===================================================
echo             SOFTPIX SERVER LAUNCHER
echo ===================================================
echo 1. Run on Wi-Fi ONLY (Localhost)
echo 2. Start Ngrok ONLY (Remote Access)
echo ===================================================
set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
    echo.
    echo Starting Vite server...
    start "SoftPix Server" cmd /k "npm run dev"
    timeout /t 3 /nobreak >nul
    start http://localhost:5173
    echo Server is ready!
    pause
    exit
)

if "%choice%"=="2" (
    goto NGROK_MENU
)

goto MAIN_MENU

:NGROK_MENU
cls
echo Starting Ngrok Tunnel...
start "SoftPix Ngrok" cmd /k "npx --yes ngrok http 5173"
echo.
echo ===================================================
echo 🌍 Ngrok is running! Your remote link is:
echo 👉 https://outweigh-nag-uranium.ngrok-free.dev
echo ===================================================

:POST_NGROK_PROMPT
echo.
echo What would you like to do next?
echo 1. Close the server (Stops Ngrok and Vite)
echo 2. Do nothing (Keep running)
echo 3. Start Localhost server (The 192 Wi-Fi server)
echo ===================================================
set /p subchoice="Enter your choice (1, 2, or 3): "

if "%subchoice%"=="1" (
    echo.
    echo Closing SoftPix servers...
    taskkill /FI "WINDOWTITLE eq SoftPix*" /T /F >nul 2>&1
    echo Servers closed.
    pause
    exit
)

if "%subchoice%"=="2" (
    goto POST_NGROK_PROMPT
)

if "%subchoice%"=="3" (
    echo.
    echo Starting Vite Wi-Fi server...
    start "SoftPix Server" cmd /k "npm run dev"
    echo Opening your local saved folders on this PC...
    timeout /t 3 /nobreak >nul
    start http://localhost:5173
    goto POST_NGROK_PROMPT
)

goto POST_NGROK_PROMPT
