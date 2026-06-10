@echo off
REM 批量安装云函数依赖
echo ===============================================
echo 正在安装云函数依赖...
echo ===============================================

cd /d "%~dp0"

setlocal enabledelayedexpansion
set "successCount=0"
set "failCount=0"

for /d %%d in (*) do (
    if exist "%%d\package.json" (
        echo.
        echo ------------------------------
        echo 正在安装: %%d
        echo ------------------------------
        cd /d "%%d"
        call npm install --silent
        if !errorlevel! equ 0 (
            echo [OK] %%d 安装成功
            set /a successCount+=1
        ) else (
            echo [ERROR] %%d 安装失败
            set /a failCount+=1
        )
        cd /d "%~dp0"
    )
)

echo.
echo ===============================================
echo 安装完成!
echo 成功: !successCount! 个
echo 失败: !failCount! 个
echo ===============================================
pause
