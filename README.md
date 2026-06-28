# DRIFT — generative plate studio

DRIFT is a drafting bench for black-and-white generative moments. Pick an
instrument, fix a seed, and tune a strictly monochrome plate until it reads.
Every plate is reproducible from its seed, shareable as a link, loopable, and
ready to lift as a still or a clean clip for a deck.

Vanilla JS (ES modules) + [Vite](https://vitejs.dev). Dependency-light: the only
runtime dependency is `mp4-muxer`, lazy-loaded on first MP4 export.

## Develop

```bash
npm install
npm run dev        # local dev server (hot reload)
npm run build      # production build → dist/
npm run preview    # serve the production build locally
```

## Deploy (GitHub Pages)

A workflow at `.github/workflows/deploy.yml` builds and publishes `dist/` on
every push to `main`. One-time setup:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. Push to `main` (or run the workflow manually from the Actions tab).

The Vite `base` is relative (`./`), so the build also works unchanged on any
other static host or subpath — just serve the contents of `dist/`.

## Instruments

Seven instruments, all rendered to one 1-bit plate:

| Instrument | What it draws |
|---|---|
| **Strokes**   | flow-field dashes pivoting along a noise field |
| **ASCII**     | density-ramp marbling along a domain-warped field |
| **Automata**  | cyclic cellular automaton (1-bit woven interference) |
| **Dither**    | Bayer-dithered drifting noise |
| **Particles** | flow-field trails |
| **Wolfram**   | 1-D elementary cellular automaton (rules 30/90/110…), scrolling |
| **Bits**      | binary / character rain |

## Capture

- **Stills** — PNG, with an optional transparent (alpha-matte) background and a 1×/2× size.
- **Clips** — MP4 (WebCodecs H.264), GIF, PNG sequence (zip), and WebM as the
  always-works fallback. Fixed FPS and duration; field instruments can export a
  **seamless loop**.

MP4 needs a browser with WebCodecs H.264 encoding (Chrome/Edge/Safari). When it's
unavailable, DRIFT points you to GIF or the WebM Record clip.

## Sharing

The full state (instrument, all params, seed, aspect, invert, speed, loop) is
encoded in the URL hash — **Copy link** captures the exact moment. **Presets**
save named moments to `localStorage`.

## Architecture

```
src/
  main.js               boot
  core/
    utils · rng · noise · canvas · state · engine · moment · presets · looptime
  instruments/
    strokes · ascii · automata · dither · particles · wolfram · bits  (+ index registry)
  ui/
    console · transport · loop · presets · export · share · landing · toast
  capture/
    render (deterministic frame renderer) · gif · zip · mp4 · capture (PNG/WebM)
  styles/
    tokens.css · app.css
```

Each instrument is a small object — `{ label, params, init(s), draw(s, t) }`
(stepped CA instruments also have `step(s)` ) — registered in
`src/instruments/index.js`. Adding one is a single self-contained file.

## Accessibility / quality

Responsive to mobile, visible keyboard focus, respects `prefers-reduced-motion`
(starts paused), and runs free of console errors. Keyboard: **Space** play/pause,
**R** randomize, **S** save frame.

---

The original single-file prototype is preserved at `prototype/drift.html`.
