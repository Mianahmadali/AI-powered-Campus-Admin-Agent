@echo off
title Campus Admin Agent Development Servers

echo Starting Campus Admin Agent Development Servers...
echo.

REM Start backend server
echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d %~dp0backend && set PYTHONPATH=%~dp0backend && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

REM Wait a moment for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend server
echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to close this window (servers will continue running)
pause > nul