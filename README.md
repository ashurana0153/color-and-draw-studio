# Calm Colors

A stress-relief **color-by-number sketchbook** that runs in the browser. Pick a picture, match the numbers in the
picture with the numbered colors in the palette, and paint it with a freehand brush. No timer, no score.

* 9 original line-art pictures: **Nature**, **Flowers** and **Superheroes** (original heroes, no licensed characters)
* Freehand brush with three sizes, eraser, undo (10 steps), a gentle "guide" that tints the sections that match the chosen color
* Strokes stay inside the section you start in (turn "In lines" off for a free brush that still never touches finished sections)
* A section snaps to a clean fill once it is about 93% covered, and its number disappears
* Zoom (buttons, wheel, pinch) and pan (Move tool, Space + drag, two-finger drag) for the small sections
* Progress saves on your device (localStorage) and finished pictures can be saved as a PNG
* Works with mouse, touch and pen. Keyboard: `1`-`9`/`0` pick a color, `E` eraser, `B` brush, `[` `]` brush size, `Ctrl/Cmd+Z` undo, `+`/`-` zoom, hold `Space` to pan

## Run it

It is plain ES modules, so any static server works:

```
python3 -m http.server 8000   # then open http://localhost:8000
```

Deploy with GitHub Pages (Settings -> Pages -> Deploy from branch -> `main` / root).

## Adding a picture

Pictures live in `js/art/*.js`. A picture is a list of **items** drawn back to front in an 800 x 800 space:

```js
R(n, pathData)      // a paintable section that uses palette color n
Ln(pathData, width) // a detail line (never painted)
```

Later sections cover earlier ones, so layer shapes freely (sky first, details last). Number positions, the "visible area"
of every section and the line-art clipping are computed automatically. See `js/kit.js` for helpers (`rect`, `circle`,
`ellipse`, `smooth`, `petal`, `star`, `pine`, `cloud`...). Register the picture in `js/art/index.js`.
