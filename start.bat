@echo off
echo ========================================
echo     DiplomaVerif - Demarrage Rapide
echo ========================================
echo.

REM Verification des fichiers necessaires
if not exist "package.json" (
    echo [ERREUR] Fichier package.json introuvable
    pause
    exit /b 1
)

if not exist ".env" (
    echo [AVERTISSEMENT] Fichier .env introuvable
    echo Veuillez creer un fichier .env avec les configurations necessaires
    echo.
    pause
)

echo [INFO] Installation des dependances...
call npm install
if errorlevel 1 (
    echo [ERREUR] L'installation a echoue
    pause
    exit /b 1
)

echo.
echo [INFO] Generation du client Prisma...
call npm run prisma:generate
if errorlevel 1 (
    echo [ERREUR] La generation a echoue
    pause
    exit /b 1
)

echo.
echo [INFO] Application des migrations...
call npm run prisma:migrate
if errorlevel 1 (
    echo [ERREUR] Les migrations ont echoue
    pause
    exit /b 1
)

echo.
echo [INFO] Peuplement de la base de donnees...
call npm run prisma:seed
if errorlevel 1 (
    echo [AVERTISSEMENT] Le seed a echoue (base peut-etre deja peuplee)
)

echo.
echo [SUCCES] Configuration terminee!
echo.
echo [INFO] Demarrage du serveur...
echo.
call npm run dev

pause

