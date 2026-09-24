@echo off
echo ===================================================
echo     CampusFlow - Push to GitHub Utility
echo ===================================================
echo.
set /p REPO_URL="Enter your GitHub Repository URL (e.g. https://github.com/USERNAME/campusflow.git): "

if "%REPO_URL%"=="" (
    echo [ERROR] No URL provided. Please run again and enter your repository URL.
    pause
    exit /b 1
)

echo.
echo [1/3] Setting remote origin to %REPO_URL%...
git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo [2/3] Renaming current branch to main...
git branch -M main

echo [3/3] Pushing codebase to GitHub...
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ===================================================
    echo    SUCCESS! CampusFlow is now live on your GitHub!
    echo ===================================================
) else (
    echo.
    echo [ERROR] Git push failed. Please check your URL and permissions.
)
echo.
pause
