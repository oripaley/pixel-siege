# Pixel Siege — project notes for Claude

A retro top-down pixel-art arena shooter that runs in the browser. It is plain JavaScript (ES modules) and Canvas, with **no build step and no dependencies**. Keep it that way unless the user asks otherwise.

- **Live:** https://oripaley.github.io/pixel-siege/ (GitHub Pages, redeploys from `main` within ~1–2 minutes of a push)
- **Repo:** https://github.com/oripaley/pixel-siege (public)
- **Local folder:** `G:\Claude\pixel-siege`
- The user writes in Dutch or English. Reply in the language of their message.

## Workflow (agreed with the user)

After each finished change:
1. Test it in Chrome (see Testing below).
2. Commit it with a clean message: an imperative subject line, plus a short body explaining what changed and why.
3. Push it to `origin/main`. No need to ask first for routine commits and pushes.

Always confirm before destructive git operations (force-push, history rewrites, reverts, deleting branches).

- Git identity: Daniel Waijers <daniel.a.waijers@gmail.com>, GitHub account `oripaley`.
- The GitHub CLI is at `C:\Program Files\GitHub CLI\gh.exe` (it may not be on the Bash PATH).
- Node and Python are **not** installed. Use the PowerShell server for local play.

## Running locally

ES modules don't load from `file://`. Start a local server:
- double-click `play.bat`, or
- run `powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1 -Port 8000`

Then open http://localhost:8000.

## Code map

```
index.html               canvas (320x180, scaled up with pixelated rendering)
src/main.js              boot, fixed 60 Hz update loop, M = mute toggle, crosshair cursor
src/core.js              W/H constants + active scene (core.go(scene))
src/input.js             keyboard + mouse (mouse coords in game pixels); endStep() clears per-step flags
src/save.js              localStorage progress: best, maxLevel, muted (key: pixel-siege.save.v1)
src/audio.js             Web Audio synthesized SFX; Sound.play(name) with per-sound throttling
src/sprites.js           pixel-art grids + palette -> baked canvases (SPR), drawSprite, floor generator
src/ui.js                3x5 bitmap font (drawText), Button, panels, hearts
src/levels.js            10 campaign levels (waves = {type: count}) + endless generator
src/spawner.js           spawns a wave's enemies from random screen edges
src/collision.js         circleHit, clamp
src/entities/            player.js, enemy.js (TYPES + AI incl. boss), bullet.js, particles.js
src/scenes/              menu.js, game.js (main gameplay), levelComplete.js, gameOver.js
```

## Conventions

- Art is defined in code: sprites are string grids using the `PAL` palette letters in `sprites.js`. The font only supports A–Z, 0–9 and `. , : ! ? - + / % ( ) < > ' =`, so all on-screen text is uppercase.
- Sounds are defined in code: add new effects to the `SOUNDS` table in `audio.js`.
- Scenes are classes with `update(dt)` and `draw(ctx)`. Switch scenes with `core.go(new XScene())`.
- To tune balance, edit `TYPES` in `entities/enemy.js` and the wave data in `levels.js`.
- Scenes import each other in a cycle. That works because the imports are only used at runtime. Don't use them at module top level.

## Testing

Use the claude-in-chrome tools on the local server or the live URL:
- Import modules in the page to inspect or drive state, e.g. `const { core } = await import('/src/core.js')`. Then use `core.scene`, `new GameScene(n)` and `startWave(i)`. Setting `player.inv` gives god mode, and an aim-bot can set `Input.mouse`.
- **Back up the user's save before testing and restore it after.** Tests change `localStorage['pixel-siege.save.v1']`, and the user has real progress there.
- The automated tab is throttled to a few fps, so the game runs slowly and quick repeated clicks can merge. That is a test artifact, not a bug.
- Check the console for errors.
