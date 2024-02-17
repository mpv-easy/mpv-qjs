
## dev
```bash

cmake -S . -B build
cmake --build build


cd default

set -x MPV_SCRIPT_QJS_DIR your_mpv_dir/portable_config/scripts-qjs ; pnpm run dev
```


## todo
- [ ] event loop
- [ ] ci
- [ ] macos and linux