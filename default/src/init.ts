import type { MPV, MpvOsdOverlay } from "@mpv-easy/tool"

export type MpvWaitEvent = {
  event: string
}

export type MpvC = {
  __command_native: (cmd: string) => any
  __get_property_native: (name: string) => any
  __get_property_string: (name: string) => string
  __get_property_number: (name: string) => number
  __get_property_bool: (name: string) => boolean

  __set_property_native: (name: string, v: string) => void
  __set_property_string: (name: string, v: string) => void
  __set_property_number: (name: string, v: number) => void
  __set_property_bool: (name: string, v: boolean) => void

  __request_event: (name: string, flag: boolean) => any
  __observe_property: (id: number, name: string, format?: string) => any
  __unobserve_property: (id: number) => any
  __command_native_async: (id: number, node: any) => any
  __abort_async_command: (id: number) => void
  __set_last_error: (s: string) => void
  __wait_event: (wait: number) => MpvWaitEvent

  __command_string: (cmd: string) => void
}

export type InnerMpvC = {
  _legacy_overlay: MpvOsdOverlay
  _keep_running: boolean
}


const mp = globalThis.mp
const log = globalThis.__log

mp._keep_running = true
globalThis.exit = function () {
  mp._keep_running = false
} // user-facing too

mp.msg = { log: log } as MPV["msg"]

mp.msg.verbose = log.bind(null, "v")
const levels = ["fatal", "error", "warn", "info", "debug", "trace"]
levels.forEach((lv) => {
  mp.msg[lv] = log.bind(null, lv)
})

function new_cache<T = any>(): T {
  return Object.create(null, {})
}

const ehandlers =
  new_cache<Record<string, { cb?: (e: MpvWaitEvent) => void }[]>>() // items of event-name: array of {maybe cb: fn}
mp.register_event = function (name, fn) {
  if (!ehandlers[name]) ehandlers[name] = []
  ehandlers[name].push({ cb: fn })
  // TODO: concat
  // ehandlers[name] = ehandlers[name].concat([{ cb: fn }]);  // replaces the arr
  return mp.__request_event(name, true)
}

mp.unregister_event = function (fn) {
  for (const name in ehandlers) {
    ehandlers[name] = ehandlers[name].filter((h) => {
      if (h.cb !== fn) return true
      delete h["cb"] // dispatch could have a ref to h
    }) // replacing, not mutating the array
    if (!ehandlers[name].length) {
      delete ehandlers[name]
      mp.__request_event(name, false)
    }
  }
}

mp.set_osd_ass = function set_osd_ass(res_x, res_y, data) {
  if (!mp._legacy_overlay)
    mp._legacy_overlay = mp.create_osd_overlay("ass-events")

  var lo = mp._legacy_overlay
  if (lo.res_x === res_x && lo.res_y === res_y && lo.data === data) return true

  mp._legacy_overlay.res_x = res_x
  mp._legacy_overlay.res_y = res_y
  mp._legacy_overlay.data = data
  return mp._legacy_overlay.update()
}

// the following return undefined on error, null passthrough, or legacy object
mp.get_osd_size = function get_osd_size() {
  const d = mp.get_property_native("osd-dimensions") as any
  return d && { width: d.w, height: d.h, aspect: d.aspect }
}
mp.get_osd_margins = function get_osd_margins() {
  var d = mp.get_property_native("osd-dimensions") as any
  return d && { left: d.ml, right: d.mr, top: d.mt, bottom: d.mb }
}

mp.get_time_ms = Date.now


mp.command_native = (...args) => {
  log("command_native: ")
}
mp.command = (cmd: string) => {
  log("command_native: " + cmd)
  mp.__command_string(cmd)
}
mp.print = (...args: any[]) => {
  log("print: " + args.join(', '))
}

globalThis.print = mp.print

mp.commandv = (...args) => {
  log("commandv: ")
  return undefined
}

mp.command_native_async = (...args) => {
  log("command_native_async: ")
}

mp.abort_async_command = (...args) => {
  log("abort_async_command: ")
}

mp.get_property = (name) => {
  log("get_property: " + name)
  mp.get_property_native(name)
}

mp.get_property_osd = (...args) => {
  log("get_property_osd: ", args.join(", "))
}

mp.get_property_bool = (name) => {
  log("get_property_bool: " + name.toString())
  const v = mp.__get_property_bool(name)
  log("get_property_bool v: " + v.toString())
  return !!v
}

mp.get_property_string = (name) => {
  log("get_property_string: ", name)
  const v = mp.__get_property_string(name)
  log("get_property_string22: " + v)
  return v
}

mp.get_property_native = (name) => {
  log("get_property_native: ", name.toString())
  if (name === "osd-dimensions") {
    const w = mp.get_property_number("osd-width")
    const h = mp.get_property_number("osd-height")
    return {
      w,
      h,
    }
  } else if (name === 'track-list/0/type') {
    return ""
  } else if (name === 'track-list/1/title') {
    return ""
  } else if (name === 'track-list/1/type') {
    return ""
  } else if (name === 'track-list/1/title') {
    return ""
  }
  return mp.__get_property_string(name)
}

mp.get_property_number = (name) => {
  // log('get_property_number: ', name.toString())
  return mp.__get_property_number(name)
}

mp.set_property_number = (name, v: number) => {
  log("get_property_number: ", name.toString())
  mp.__set_property_number(name, v)
  return undefined
}

mp.set_property = (...args) => {
  log("setProperty: ", args.join(", "))
}

mp.set_property_bool = (name, v) => {
  // log('set_property_bool: ', args.join(', '))
  mp.__set_property_bool(name, v)
  return undefined
}

mp.set_property_native = (...args) => {
  log("set_property_native: ", args.join(", "))
}

mp.get_time = () => Date.now()

mp.add_key_binding = (...args) => {
  log("add_key_binding: ", args.join(", "))
}
mp.add_forced_key_binding = (...args) => {
  log("add_forced_key_binding: ", args.join(", "))
}

mp.remove_key_binding = (...args) => {
  log("remove_key_binding: ", args.join(", "))
}

mp.register_event = (...args) => {
  log("register_event: ", args.join(", "))
}

mp.unregister_event = (...args) => {
  log("unregister_event: ", args.join(", "))
}

const observePropertyMap: Record<
  string,
  {
    fn: (name: string, v: any) => void
    type: "number" | "string" | "bool" | "native"
    value: any
  }[]
> = {}

mp.observe_property = (name, type, fn) => {
  log("observe_property: " + name)
  if (!observePropertyMap[name]) {
    observePropertyMap[name] = [
      {
        type,
        value: undefined,
        fn,
      },
    ]
  } else {
    observePropertyMap[name].push({
      type,
      value: undefined,
      fn,
    })
  }
}

mp.unobserve_property = (fn) => {
  log("unobserve_property: ")
  for (const name in observePropertyMap) {
    const item = observePropertyMap[name] ?? []
    const index = item.findIndex((i) => i.fn === fn)
    if (index >= 0) {
      item.splice(index, 1)
    }
  }
}

function runObserve() {
  for (const name in observePropertyMap) {
    const item = observePropertyMap[name] || []

    for (const i of item) {
      if (i.type === "native") {
        if (name === "osd-dimensions") {
          const w = mp.get_property_number("osd-width")
          const h = mp.get_property_number("osd-height")
          if (i.value?.w !== w || i.value?.h !== h) {
            i.fn(name, { w, h })
            i.value = { w, h }

            log("osd-dimensions run: " + w + " " + h)
          }
        }
      } else if (i.type === "bool") {
        const v = mp.get_property_bool(name)
        if (v !== i.value) {
          i.fn(name, v)
          i.value = v
        }
      } else if (i.type === "number") {
        const v = mp.get_property_number(name)
        if (v !== i.value) {
          i.fn(name, v)
          i.value = v
        }
      } else if (i.type === "string") {
        const v = mp.get_property_string(name)
        if (v !== i.value) {
          i.fn(name, v)
          i.value = v
        }
      }
    }
  }
}

mp.get_opt = (...args) => {
  log("get_opt: ", args.join(", "))
}

mp.get_script_name = (...args) => {
  log("get_script_name: ", args.join(", "))
}

mp.osd_message = (...args) => {
  log("osd_message: ", args.join(", "))
}

mp.register_idle = (...args) => {
  log("register_idle: ", args.join(", "))
}

mp.unregister_idle = (...args) => {
  log("unregister_idle: ", args.join(", "))
}
mp.enable_messages = (...args) => {
  log("enable_messages: ", args.join(", "))
}
mp.unregister_script_message = (...args) => {
  log("unregister_script_message: ", args.join(", "))
}

let next_osd_overlay_id = 33
mp.create_osd_overlay = () => {
  const id = next_osd_overlay_id++
  return {
    format: "ass-events",
    id,
    data: "",
    res_x: 0,
    res_y: 720,
    z: 1,
    hidden: false,
    compute_bounds: false,
    update() {
      const cmd = [
        "osd-overlay",
        this.id,
        "ass-events",
        JSON.stringify(this.data),
        this.res_x,
        this.res_y,
        this.z,
        this.hidden ? "yes" : "no",
        this.compute_bounds ? "yes" : "no",
      ]
        .map((i) => i.toString())
        .join(" ")
      mp.__command_string(cmd)
      return {
        x0: 0,
        y0: 0,
        x1: 0,
        y1: 0,
      }
    },

    remove() {
      log('ovl remove: ' + this.id)
    },
  }
  // log('create_osd_overlay: ', args.join(', '))
}
mp.set_osd_ass = (...args) => {
  log("set_osd_ass: ", args.join(", "))
}
mp.get_osd_size = (...args) => {
  log("get_osd_size: ", args.join(", "))
}

mp.get_osd_margins = (...args) => {
  log("get_osd_margins: ", args.join(", "))
}
mp.get_time_ms = (...args) => {
  log("get_time_ms: ", args.join(", "))
  return Date.now()
}

mp.get_script_file = () => {
  const p =
    mp.get_property_string("working-directory") +
    "/portable_config/scripts-qjs/qjs.js"
  return p
}

mp.get_mouse_pos = (...args) => {
  log("get_mouse_pos: ", args.join(", "))
}

mp.module_paths = []

mp.msg = {
  log: log,
  warn: log,
  info: log,
  error: log,
  fatal: log,
  verbose: log,
  debug: log,
  trace: log,
}

mp.options = {
  read_options(...args) {
    log("read_options: ", args.join(", "))
  },
}

mp.utils = {
  getcwd(...args) {
    log("read_options: ", args.join(", "))
  },
  readdir(...args) {
    log("readdir: ", args.join(", "))
  },
  file_info(...args) {
    log("file_info: ", args.join(", "))
  },
  split_path(path) {
    log("split_path: " + path)
    const list = path.split("/")
    return [list.slice(0, -1).join("/"), list.at(-1) || ""] as const
  },
  join_path(p1: string, p2: string) {
    log("join_path: " + p1 + "/" + p2)
    return p1 + "/" + p2
  },
  getpid(...args) {
    log("getpid: ", args.join(", "))
  },
  getenv(...args) {
    log("getenv: ", args.join(", "))
  },
  get_user_path(...args) {
    log("get_user_path: ", args.join(", "))
  },
  read_file(...args) {
    log("read_file: ", args.join(", "))
  },
  write_file(...args) {
    log("write_file: ", args.join(", "))
  },
  compile_js(...args) {
    log("compile_js: ", args.join(", "))
  },
}

let timeoutQueue: { fn: () => void; time: number }[] = []

function setTimeout(fn, delay = 1000) {
  const now = Date.now()
  timeoutQueue.push({
    fn,
    time: now + delay,
  })
}

function setInterval(callback, delay = 1000) {
  function execute() {
    callback()
    setTimeout(execute, delay)
  }
  setTimeout(execute, delay)
}

function execTimeout() {
  const now = Date.now()

  const needExecList: typeof timeoutQueue = []
  const nextList: typeof timeoutQueue = []

  for (const item of timeoutQueue) {
    if (item.time < now) {
      needExecList.push(item)
    } else {
      nextList.push(item)
    }
  }
  timeoutQueue = []
  for (const i of needExecList) {
    i.fn()
  }

  timeoutQueue = [...nextList, ...timeoutQueue]
}

globalThis.setTimeout = setTimeout
globalThis.setInterval = setInterval

globalThis.clearInterval = (id?: number) => {
  log('clearInterval: ' + id)
}
globalThis.clearTimeout = (id?: number) => {
  log('clearTimeout: ' + id)
}

globalThis.mp_event_tick = () => {
  execTimeout()
  runObserve()
}

globalThis.mp_event_loop = () => {
  log("mp_event_loop")
}

