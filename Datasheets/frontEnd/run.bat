@echo off
echo Starting Quiz System...
echo Open http://localhost:3000 in your browser
python -m http.server 3000 -d dist
pause