import { renderMpvEasy, } from "./mpv-easy"
import { renderCounter } from "./counter"
import { renderExample } from "./example"
import { renderSnake } from "./snake"

import "@mpv-easy/mpv-easy"

{
  const log = globalThis.__log
  globalThis.setTimeout(() => {
    // renderCounter()
    // renderSnake()
    renderMpvEasy()
  }, 1000)
}
