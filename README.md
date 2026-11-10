# Peshal's little world

Personal portfolio of Peshal Parajuli, built as a small explorable world: a floating island with
four places (Build Lab, Server Garden, Nepal Courtyard, Next Stop) around a plaza where the
cartoon version of me stands between the letters of my name.

Plain static site: `index.html`, `assets/css/world.css`, `assets/js/world.js`. No build step.
Served by GitHub Pages (CNAME: peshalparajuli.com.np).

```bash
python3 -m http.server 8000
```

## How it works
- The world is layered HTML + inline SVG (no WebGL). Two ground layouts: wide (desktop) and tall
  (phones), switched with a container query.
- Every place is a real `<button>`. Selecting one lights its cable, zooms the scene, and moves the
  matching page section into a `<dialog>`; closing puts it back and returns focus.
- All content is ordinary HTML below the world, so nav links and the "Explore my work" button skip
  the map entirely. Without JS, every folder is open.
- Day/evening toggle is saved in localStorage (guarded). Reduced motion removes zoom, folder
  animation, blinking and the arrival bounce.

## Character
`assets/img/peshal-*.webp` is a flat render with its existing alpha cleaned of the cloudy haze.
It cannot turn around or animate a skeleton; motion is limited to a whole-image bounce and tilt.
A rigged 3D model would be a separate asset.

## Content still to fill in
Search the code for `TODO(peshal)`.
