#include "quickjs.h"
#include <stdio.h>
#include <string.h>
#include <mpv/client.h>
#include "quickjs-libc.c"
#include <windows.h>
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include "mpv_talloc.h"

mpv_handle *global_mp_handle;


char *concat_string(char *dir, char *file)
{
  int dir_len = strlen(dir);
  int file_len = strlen(file);
  char *rt = (char *)malloc(dir_len + file_len + 1);

  int i = 0;
  while (dir[i])
  {
    rt[i] = dir[i];
    i++;
  }

  while (file[i - dir_len])
  {
    rt[i] = file[i - dir_len];
    i++;
  }
  rt[i] = 0;
  return rt;
}


const char *log_file_path = "./qjs-log.txt";

int append_to_file(char *content)
{
  FILE *log_file = fopen(log_file_path, "a");
  if (fputs(content, log_file) == EOF)
  {
    fclose(log_file);
    return 1;
  }
  fputs("\n", log_file);
  fclose(log_file);
  return 0;
}

static JSValue log_to_file(JSContext *ctx, JSValueConst this_val,
                           int argc, JSValueConst *argv)
{
  int i;
  const char *str;
  for (i = 0; i < argc; i++)
  {
    str = JS_ToCString(ctx, argv[i]);
    append_to_file(str);
    JS_FreeCString(ctx, str);
  }
  return JS_UNDEFINED;
}

static JSValue script_get_property_number(JSContext *ctx, JSValueConst this_val,
                                          int argc, JSValueConst *argv)
{
  double result = 0;
  const char *name = JS_ToCString(ctx, argv[0]);
  int e = mpv_get_property(global_mp_handle, name, MPV_FORMAT_DOUBLE, &result);
  return JS_NewFloat64(ctx, result);
}

static JSValue
script_wait_event(JSContext *ctx, JSValueConst this_val,
                  int argc, JSValueConst *argv)
{
  double timeout;
  JS_ToFloat64(ctx, &timeout, argv[0]);
  mpv_event *event = mpv_wait_event(global_mp_handle, -1);
  JSValue js_node = JS_NewObject(ctx);
  JS_SetPropertyStr(ctx, js_node, "name", JS_NewString(ctx, "text node"));
  JS_SetPropertyStr(ctx, js_node, "id", JS_NewInt32(ctx, event->event_id));
  JS_SetPropertyStr(ctx, js_node, "timeout", JS_NewFloat64(ctx, timeout));
  return js_node;
}

static JSValue
script_set_property_number(JSContext *ctx, JSValueConst this_val,
                           int argc, JSValueConst *argv)
{
  double result;
  const char *name = JS_ToCString(ctx, argv[0]);
  JS_ToFloat64(ctx, &result, argv[1]);
  int e = mpv_set_property(global_mp_handle, name, MPV_FORMAT_DOUBLE, &result);
}

static JSValue script_get_property_string(JSContext *ctx, JSValueConst this_val,
                                          int argc, JSValueConst *argv)
{
  char *result = NULL;
  const char *name = JS_ToCString(ctx, argv[0]);
  int e = mpv_get_property(global_mp_handle, name, MPV_FORMAT_STRING, &result);
  return JS_NewString(ctx, result);
}

static JSValue script_set_property_string(JSContext *ctx, JSValueConst this_val,
                                          int argc, JSValueConst *argv)
{
  const char *name = JS_ToCString(ctx, argv[0]);
  const char *str = JS_ToCString(ctx, argv[1]);
  int e = mpv_set_property_string(global_mp_handle, name, str);
  return JS_UNDEFINED;
}

static JSValue script_set_property_bool(JSContext *ctx, JSValueConst this_val,
                                        int argc, JSValueConst *argv)
{
  const char *name = JS_ToCString(ctx, argv[0]);
  int v = JS_ToBool(ctx, argv[1]);
  mpv_set_property(global_mp_handle, name, MPV_FORMAT_FLAG, &v);
  return JS_UNDEFINED;
}

static JSValue script_get_property_bool(JSContext *ctx, JSValueConst this_val,
                                        int argc, JSValueConst *argv)
{
  const char *name = JS_ToCString(ctx, argv[0]);
  int result;
  mpv_get_property(global_mp_handle, name, MPV_FORMAT_FLAG, &result);
  return JS_NewBool(ctx, result);
}

static JSValue script_get_property_osd_string(JSContext *ctx, JSValueConst this_val,
                                              int argc, JSValueConst *argv)
{
  char *result = NULL;
  const char *name = JS_ToCString(ctx, argv[0]);
  int e = mpv_get_property(global_mp_handle, name, MPV_FORMAT_OSD_STRING, &result);
  return JS_NewString(ctx, result);
}

static JSValue script_command_string(JSContext *ctx, JSValueConst this_val,
                                     int argc, JSValueConst *argv)
{
  char *cmd = JS_ToCString(ctx, argv[0]);
  int e = mpv_command_string(global_mp_handle, cmd);
  return JS_UNDEFINED;
}

void run_qjs_script(JSRuntime *runtime, JSContext *ctx)
{
  char *dir;
  mpv_get_property(global_mp_handle, "working-directory", MPV_FORMAT_STRING, &dir);
  char *init_code_path = concat_string(dir, "/portable_config/scripts-qjs/init.js");
  char *script_code_path = concat_string(dir, "/portable_config/scripts-qjs/qjs.js");
  size_t init_code_len = 0;
  uint8_t *init_code = js_load_file(ctx, &init_code_len, init_code_path);
  size_t script_code_len = 0;
  uint8_t *script_code = js_load_file(ctx, &script_code_len, script_code_path);
  JSValue global_obj = JS_GetGlobalObject(ctx);

  JSValue mp = JS_NewObject(ctx);
  JS_SetPropertyStr(ctx, mp, "__wait_event", JS_NewCFunction(ctx, script_wait_event, "__wait_event", 1));

  JS_SetPropertyStr(ctx, mp, "__get_property_number",
                    JS_NewCFunction(ctx, script_get_property_number, "__get_property_number", 1));
  JS_SetPropertyStr(ctx, mp, "__set_property_number",
                    JS_NewCFunction(ctx, script_set_property_number, "__set_property_number", 2));

  JS_SetPropertyStr(ctx, mp, "__get_property_bool",
                    JS_NewCFunction(ctx, script_get_property_bool, "__get_property_bool", 1));
  JS_SetPropertyStr(ctx, mp, "__set_property_bool",
                    JS_NewCFunction(ctx, script_set_property_bool, "__set_property_bool", 2));

  JS_SetPropertyStr(ctx, mp, "__get_property_string",
                    JS_NewCFunction(ctx, script_get_property_string, "__get_property_string", 1));
  JS_SetPropertyStr(ctx, mp, "__set_property_string",
                    JS_NewCFunction(ctx, script_set_property_string, "__set_property_string", 2));

  JS_SetPropertyStr(ctx, mp, "__get_property_osd_string",
                    JS_NewCFunction(ctx, script_get_property_osd_string, "__get_property_osd_string", 1));

  JS_SetPropertyStr(ctx, mp, "__command_string",
                    JS_NewCFunction(ctx, script_command_string, "__command_string", 1));

  JS_SetPropertyStr(ctx, global_obj, "mp", mp);

  JS_SetPropertyStr(ctx, global_obj, "__log",
                    JS_NewCFunction(ctx, log_to_file, "__log", 1));

  // js_init_module_std(ctx, "std");
  // js_init_module_os(ctx, "os");
  // js_std_init_handlers(runtime);
  // js_std_add_helpers(ctx, -1, NULL);
  JSValue realException;

  JSValue rt;

  rt =
      JS_Eval(ctx, init_code, init_code_len, "<init_code>", JS_EVAL_TYPE_MODULE);
  if (JS_IsException(rt))
  {
    realException = JS_GetException(ctx);
    append_to_file(JS_ToCString(ctx, realException));
  }
  rt =
      JS_Eval(ctx, script_code, script_code_len, "<script_code>", JS_EVAL_TYPE_MODULE);

  if (JS_IsException(rt))
  {
    realException = JS_GetException(ctx);
    JSValue stack = JS_GetPropertyStr(ctx, realException, "stack");
    append_to_file(JS_ToCString(ctx, stack));
  }

  JSValue run = JS_GetPropertyStr(ctx, global_obj, "mp_event_loop");
  JSValue tick = JS_GetPropertyStr(ctx, global_obj, "mp_event_tick");
  mpv_observe_property(global_mp_handle, 0, "pause", MPV_FORMAT_FLAG);
  mpv_observe_property(global_mp_handle, 0, "time-pos", MPV_FORMAT_DOUBLE);

  rt = JS_Call(ctx, run, JS_UNDEFINED, 0, NULL);

  if (JS_IsException(rt))
  {
    realException = JS_GetException(ctx);
    append_to_file((char *)JS_ToCString(ctx, realException));
  }
  while (1)
  {
    mpv_event *event = mpv_wait_event(global_mp_handle, -1);
    if (event->event_id == MPV_EVENT_SHUTDOWN)
    {
      break;
    }
    if (JS_IsJobPending(runtime))
    {
      JS_ExecutePendingJob(runtime, &ctx);
    }
    rt = JS_Call(ctx, tick, JS_UNDEFINED, 0, NULL);
    if (JS_IsException(rt))
    {
      realException = JS_GetException(ctx);
      append_to_file((char *)JS_ToCString(ctx, realException));
    }
  }

  js_std_free_handlers(runtime);
  JS_FreeContext(ctx);
  JS_FreeRuntime(runtime);

  // JSValue json = JS_JSONStringify(ctx, result, JS_UNDEFINED, JS_UNDEFINED);
  // JS_FreeValue(ctx, result);
  // while (1)
  // {
  //   int n = JS_ExecutePendingJob(runtime, &ctx);
  //   if (n == 0)
  //   {
  //     break;
  //   }
  // }
}

// void *JS_GetContextOpaque(JSContext *ctx)
// {
//   return global_mp_handle;
// }

// void JS_SetContextOpaque(JSContext *ctx, void *opaque)
// {
//   global_mp_handle = opaque;
// }

MPV_EXPORT int
mpv_open_cplugin(mpv_handle *handle)
{
  FILE *file = fopen(log_file_path, "w");
  fclose(file);

  global_mp_handle = handle;
  JSRuntime *runtime = JS_NewRuntime();
  JSContext *ctx = JS_NewContext(runtime);
  // TODO: invalid use of incomplete typedef 'JSContext'
  run_qjs_script(runtime, ctx);
  return 0;
}