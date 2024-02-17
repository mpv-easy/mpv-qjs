declare module globalThis {
  var __log: (...args: any[]) => void
  var mp: MpvC & MPV & InnerMpvC
  var mp_event_loop: () => void
  var mp_event_tick: () => void
  var exit: () => void

  var setTimeout: (fn: () => void, delay?: number) => void
  var setInterval: (fn: () => void, delay?: number) => void
}
