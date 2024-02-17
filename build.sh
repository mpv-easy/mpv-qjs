 cmake -S . -B build
 cmake --build build

  cmake --build build && cp ./build/libmain.dll C:/app/mpv-test/portable_config/scripts/libmain.dll
  cmake --build build &&  ./build/main.exe