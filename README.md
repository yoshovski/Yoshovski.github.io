# Stefan Yoshovski — 3D Portfolio

An interactive 3D room built with [Three.js](https://threejs.org/), [GSAP](https://gsap.com/)
and [Vite](https://vitejs.dev/). Explore the room, open the book to read about me, browse
projects on the wall, click the monitor to watch a video, and flip the light switch to toggle
day/night.

🔗 **Live:** https://yoshovski.github.io

## Personalising it — edit one file

Everything personal lives in **[`js/config.js`](js/config.js)**. It's the single source of
truth: your name, the about text, contact email, social links, the list of projects, the
YouTube link the monitor opens, and the book-cover photo. The page text, meta tags and the 3D
scene all read from it.

To change the **book cover**, drop a photo into `images/` and point `config.coverImage` at it
(default: `images/cover.jpg`) — no need to re-export the 3D model.

## Run locally

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build into dist/
npm run deploy   # build + publish dist/ to the gh-pages branch
```

## Project structure

```
index.html          # page shell (text/links injected from config)
style.css           # UI styling
js/
  config.js         # ← edit this: all personal content
  content.js        # injects config into the page (text, links, meta)
  Project.js        # the 3D scene, animations & interactions
  utils/
    Element.js      # names of meshes inside room.glb
    Animation.js    # names of animation clips inside room.glb
models/room/room.glb  # the 3D room
textures/ images/ fonts/  # assets
```

## Interactions

| Action | What happens |
| --- | --- |
| Click & drag | Orbit around the room |
| Open the book / "About Me" | Read the about section |
| "Projects" | Project thumbnails fly onto the wall (click to open) |
| Click the monitor | Opens the YouTube video |
| Click the speaker | Toggles room audio |
| Flip the light switch | Toggles light/dark theme |
| Wait a few seconds or hover on it | The drone takes off on its own |
