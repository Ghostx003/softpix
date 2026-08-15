@echo off
title SoftPix Launcher
color 0B
setlocal EnableDelayedExpansion

:MAIN_MENU
cls
echo ========================================================================
echo                       SOFTPIX SERVER LAUNCHER
echo ========================================================================
echo Scanning local development ports...
echo.

:: Initialize port status variables
set "PORT_LIST=5173 5174 5175 5176 5177 5178"
set "COUNT=0"

for %%p in (%PORT_LIST%) do (
    set /a COUNT+=1
    set "STATUS_%%p=AVAILABLE"
    set "PID_%%p="
    set "DISP_%%p=Ready to use"
    set "KEY_!COUNT!=%%p"
    
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr /C:":%%p " ^| findstr "LISTENING"') do (
        set "STATUS_%%p=BUSY"
        set "PID_%%p=%%a"
        set "DISP_%%p=In Use (PID: %%a)"
    )
)

echo ------------------------------------------------------------------------
echo   #    PORT       STATUS          DETAILS
echo ------------------------------------------------------------------------
set "C=0"
for %%p in (%PORT_LIST%) do (
    set /a C+=1
    if "!STATUS_%%p!"=="AVAILABLE" (
        echo  [!C!]   Port %%p    [AVAILABLE]     !DISP_%%p!
    ) else (
        echo  [!C!]   Port %%p    [BUSY]          !DISP_%%p!
    )
)
echo ------------------------------------------------------------------------
echo  [C]   Enter a custom port number (e.g. 3000, 8080, 5180)
echo  [K]   Kill / Free process on a busy port
echo  [R]   Refresh port status
echo  [X]   Exit launcher
echo ========================================================================
echo.
set "choice="
set /p choice="Select an option (1-6, port number, C, K, R, X): "

if not defined choice (
    echo No option selected.
    exit /b
)

for /f "tokens=1" %%t in ("!choice!") do set "choice=%%t"

if /i "!choice!"=="X" exit /b
if /i "!choice!"=="Q" exit /b
if /i "!choice!"=="R" goto MAIN_MENU
if /i "!choice!"=="K" goto KILL_PORT_PROMPT
if /i "!choice!"=="C" goto CUSTOM_PORT

if "!choice!"=="1" ( set "CHOSEN_PORT=5173" & goto CHECK_AND_LAUNCH )
if "!choice!"=="2" ( set "CHOSEN_PORT=5174" & goto CHECK_AND_LAUNCH )
if "!choice!"=="3" ( set "CHOSEN_PORT=5175" & goto CHECK_AND_LAUNCH )
if "!choice!"=="4" ( set "CHOSEN_PORT=5176" & goto CHECK_AND_LAUNCH )
if "!choice!"=="5" ( set "CHOSEN_PORT=5177" & goto CHECK_AND_LAUNCH )
if "!choice!"=="6" ( set "CHOSEN_PORT=5178" & goto CHECK_AND_LAUNCH )

:: Check if user typed a port number directly (e.g., 5173, 5174, 3000)
echo !choice!| findstr /r "^[0-9][0-9]*$" >nul
if !errorlevel! equ 0 (
    set "CHOSEN_PORT=!choice!"
    goto CHECK_AND_LAUNCH
)

echo Invalid choice. Please try again.
ping -n 2 127.0.0.1 >nul
goto MAIN_MENU

:CUSTOM_PORT
echo.
set "CHOSEN_PORT="
set /p CHOSEN_PORT="Enter custom port number (e.g. 5180, 3000, 8080): "
if not defined CHOSEN_PORT goto MAIN_MENU
echo %CHOSEN_PORT%| findstr /r "^[0-9][0-9]*$" >nul
if %errorlevel% neq 0 (
    echo Invalid port number. Must be numeric.
    ping -n 2 127.0.0.1 >nul
    goto MAIN_MENU
)

:CHECK_AND_LAUNCH
:: Check if chosen port is busy
set "PORT_BUSY=0"
set "PORT_PID="
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /C:":%CHOSEN_PORT% " ^| findstr "LISTENING"') do (
    set "PORT_BUSY=1"
    set "PORT_PID=%%a"
)

if "%PORT_BUSY%"=="1" (
    echo.
    echo ========================================================================
    echo  [WARNING] Port %CHOSEN_PORT% is already IN USE by PID %PORT_PID%!
    echo ========================================================================
    echo  1. Kill PID %PORT_PID% and start SoftPix on port %CHOSEN_PORT%
    echo  2. Start anyway (Vite will auto-assign next available port)
    echo  3. Choose another port
    echo ========================================================================
    set "busy_choice="
    set /p busy_choice="Enter choice (1, 2, or 3): "
    
    if "!busy_choice!"=="1" (
        echo Killing process PID %PORT_PID%...
        taskkill /PID %PORT_PID% /F >nul 2>&1
        ping -n 2 127.0.0.1 >nul
        goto START_SERVER
    )
    if "!busy_choice!"=="2" (
        goto START_SERVER
    )
    goto MAIN_MENU
)

:START_SERVER
echo.
echo ========================================================================
echo Starting SoftPix server on port %CHOSEN_PORT%...
echo Command: npm run dev -- --port %CHOSEN_PORT%
echo ========================================================================

start "SoftPix Server - Port %CHOSEN_PORT%" cmd /k "npm run dev -- --port %CHOSEN_PORT%"
echo Waiting for server to initialize...
ping -n 4 127.0.0.1 >nul
start http://localhost:%CHOSEN_PORT%

:RUNNING_MENU
cls
echo ========================================================================
echo   SoftPix is RUNNING on http://localhost:%CHOSEN_PORT%
echo ========================================================================
echo  Server is active in the separate console window.
echo.
echo  1. Re-open http://localhost:%CHOSEN_PORT% in browser
echo  2. Close / Stop SoftPix server
echo  3. Launch another SoftPix instance on a different port
echo  4. Exit launcher (Server remains running in background)
echo ========================================================================
set "run_choice="
set /p run_choice="Enter your choice (1, 2, 3, 4): "

if "%run_choice%"=="1" (
    start http://localhost:%CHOSEN_PORT%
    goto RUNNING_MENU
)

if "%run_choice%"=="2" (
    echo.
    echo Stopping SoftPix servers...
    taskkill /FI "WINDOWTITLE eq SoftPix*" /T /F >nul 2>&1
    echo Server stopped.
    ping -n 2 127.0.0.1 >nul
    goto MAIN_MENU
)

if "%run_choice%"=="3" (
    goto MAIN_MENU
)

if "%run_choice%"=="4" (
    exit /b
)

goto RUNNING_MENU

:KILL_PORT_PROMPT
echo.
set "TARGET_PORT="
set /p TARGET_PORT="Enter the port number to free up (e.g. 5173): "
if not defined TARGET_PORT goto MAIN_MENU
echo Finding process on port %TARGET_PORT%...
set "FOUND_PID="
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /C:":%TARGET_PORT% " ^| findstr "LISTENING"') do (
    set "FOUND_PID=%%a"
)

if defined FOUND_PID (
    echo Found process PID %FOUND_PID% using port %TARGET_PORT%.
    echo Terminating PID %FOUND_PID%...
    taskkill /PID %FOUND_PID% /F
    echo Port %TARGET_PORT% is now free.
) else (
    echo No active process found listening on port %TARGET_PORT%.
)
ping -n 3 127.0.0.1 >nul
goto MAIN_MENU
