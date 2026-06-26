@echo off
echo Stopping SQL Practice server...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001.*LISTENING" 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
    echo Server on port 3001 stopped (PID: %%a)
    goto :done
)
echo No server found on port 3001.
:done
timeout /t 2 /nobreak >nul
exit
