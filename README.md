# Pixel Siege

A small retro top-down arena shooter for the browser. It is written in vanilla JavaScript with Canvas and has no dependencies or build step.

## Play

ES modules don't load from `file://`, so serve the folder locally:

- **Windows:** double-click `play.bat`. It starts `serve.ps1` on port 8000 and opens the browser.
- **Anything else:** run `npx serve .` or `python -m http.server 8000`, then open http://localhost:8000.

## Controls

| Input | Action |
|---|---|
| Arrow keys / WASD | Move |
| Mouse | Aim |
| Left click (hold) | Shoot |
| Esc / P | Pause |

## Structure

```
index.html              canvas + pixelated scaling
src/main.js             boot + fixed-timestep loop
src/core.js             constants + active scene
src/input.js            keyboard/mouse (mouse in game pixels)
src/sprites.js          pixel-art grids -> baked canvases, floor generator
src/ui.js               3x5 bitmap font, buttons, HUD helpers
src/levels.js           level/wave data + endless generator
src/spawner.js          spawns wave enemies from screen edges
src/entities/           player, enemy types, bullets, particles
src/scenes/             menu, game, level complete, game over
```

To add or tune levels, edit `src/levels.js`. Each wave is a map of enemy type to count. To tweak enemy stats, edit `TYPES` in `src/entities/enemy.js`.
