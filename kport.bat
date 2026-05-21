
text

@echo off
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5500" ^| find "LISTENING"') do (
    echo Killing PID %%a on port 5500
    taskkill /PID %%a /F
)
echo Done.