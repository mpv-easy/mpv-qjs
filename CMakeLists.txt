cmake_minimum_required(VERSION 3.8)
project(main)

add_compile_options("-O3")
add_library(main SHARED  ./src/main.c
     ./src/mpv/misc/dispatch.c
     ./src/mpv/ta/ta.c
     ./src/mpv/ta/ta_talloc.c
     ./src/mpv/ta/ta_utils.c
)

add_subdirectory(quickjs)
target_link_libraries(main qjs)
target_include_directories(main PRIVATE ./src/mpv ${MPV_INCLUDE_DIRS} ./quickjs)

find_package(PkgConfig REQUIRED)
pkg_search_module(MPV REQUIRED mpv)

include(FindPkgConfig)
pkg_search_module(MPV REQUIRED mpv>=0.37.0)

target_compile_options(main PRIVATE -fPIC)
target_compile_definitions(main PRIVATE MPV_CPLUGIN_DYNAMIC_SYM)

