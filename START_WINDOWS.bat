@echo off
echo ============================================
echo   VOYAGE CANVAS — Starting Server
echo ============================================
echo.

echo Installing dependencies...
pip install flask flask-cors requests python-dotenv google-generativeai
echo.

echo Starting server...
cd backend
python app.py
pause