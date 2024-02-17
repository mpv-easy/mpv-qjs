import React, { createContext } from "react"
import { drawRect } from "@mpv-easy/assdraw"
import { PropertyBool, PropertyNumber, getAssScale, log } from "@mpv-easy/tool"
import {
  Box,
  createRender,
  getRootNode,
  render,
  renderNode,
} from "@mpv-easy/ui"
import { renderMpvEasy, } from "./mpv-easy"
import { renderCounter } from "./counter"
import { renderExample } from "./example"

import "@mpv-easy/tool"
import "@mpv-easy/mpv-easy"
import { renderSnake } from "./snake"


{
  const log = globalThis.__log
  globalThis.setTimeout(() => {
    log("timeout: ")
    log("timeout: 2222")
    // renderCounter()
    // renderSnake()
    renderMpvEasy()
  }, 1000)
}
