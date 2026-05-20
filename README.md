# Quick Draw Lanes

A small overhead 2D quick-draw game built with Phaser 3 and Vite.

The player and AI face off across a three-lane arena. Pick your lane, choose a target lane, then press Space to lock in. The AI reveals its hidden move, both shooters fire, and the round resolves.

## Play

- Go to https://simple-game-beryl.vercel.app/ to try.
- Or:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://localhost:5173/
```

## Controls

- `W` / `S` or `Up` / `Down`: move between player lanes
- `1`: aim at the AI top lane
- `2`: aim at the AI middle lane
- `3`: aim at the AI bottom lane
- `Space`: start the game or fire when ready
- `R`: restart

## Rules

- Both sides start with 3 HP.
- Each round, the AI secretly chooses a lane to move to and a lane to shoot.
- You can move and aim before pressing Space.
- After Space, your choices lock, the AI reveals its lane, and both shots fire.
- If your target lane matches the AI lane, the AI loses 1 HP.
- If the AI target lane matches your lane, you lose 1 HP.
- Both shooters can be hit in the same round.
- First side to reach 0 HP loses.

## Project Structure

```text
index.html
package.json
src/
  main.js
  styles.css
```

## Scripts

```bash
npm run dev      # Start the local development server
npm run build    # Build for production
npm run preview  # Preview the production build
```
