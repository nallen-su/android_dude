# Android dude

An interactive Android robot built with plain HTML, CSS, and one small JavaScript
file. No build step, no dependencies: open `index.html` in a browser and he is
already watching your pointer.

## What he does

- **Looks at you.** His eyes and head follow the pointer or your finger.
- **Blinks and breathes,** and dozes off with little z's when you leave him alone.
- **Reacts to a poke.** Click or tap his body and he squashes, then grins.
- **Lets you drag his arms.** Grab an arm, swing it around, let go and it springs back.
- **Dances,** with an optional beat from the Web Audio API (sound is off by default).
- **Dresses up.** Six palettes and three hats.
- **Remembers.** Colour, hat, and mood live in the URL hash, so "Copy link" shares the
  exact dude on screen.
- **Hides one easter egg.** The old cheat code still works.

## Controls

| Key                                 | Action                          |
| ----------------------------------- | ------------------------------- |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Wave (when the robot has focus) |
| <kbd>D</kbd>                        | Toggle dancing                  |
| <kbd>M</kbd>                        | Next mood                       |
| <kbd>C</kbd>                        | Next colour                     |
| <kbd>H</kbd>                        | Next hat                        |
| <kbd>S</kbd>                        | Toggle sound                    |

Every action also has a button, so pointer, touch, and keyboard all reach the same
behaviour.

## Running it

```sh
open index.html          # macOS
xdg-open index.html      # Linux
```

Any static server works too, for example `python3 -m http.server`, but none is
required. The page is deployed to GitHub Pages from `master` by
`.github/workflows/pages.yml`.

## How it is put together

| File          | Role                                                            |
| ------------- | --------------------------------------------------------------- |
| `index.html`  | The robot as a single inline SVG, plus the control bar          |
| `android.css` | Design tokens, layout, poses, and keyframes                     |
| `dude.js`     | Pointer tracking, moods, dragging, sound, URL state, easter egg |

The palette, eye colour, and hat colour are CSS custom properties
(`--dude-body`, `--dude-eye`, `--dude-hat`), so a new look is one line. Poses are
CSS classes and `data-mood` values; the script never touches geometry except while
an arm is being dragged.

Accessibility and motion: the figure exposes `role="img"` with a description,
status messages are announced through a live region, and everything animated is
disabled under `prefers-reduced-motion: reduce`. Sound never starts on its own.

## History

This started in 2013 as an Android logo drawn with nine absolutely-positioned
`<div>`s that moved on `:hover`. The shape is now one SVG and the hover tricks are
real interactions, but it is still two files and a script you can read in a sitting.

## License

MIT — see [LICENSE](LICENSE).
