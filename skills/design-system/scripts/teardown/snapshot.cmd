@echo off
setlocal
node "F:\OpenCode Project\mind-system\skills\design-system\scripts\teardown\snapshot.mjs" --root "F:\OpenCode Project\mind-system\docs\design-corpus" >> "%LOCALAPPDATA%\mind-snapshot.log" 2>&1
endlocal