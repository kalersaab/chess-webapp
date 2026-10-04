# Knightly Chess

Knightly is a Next.js chess interface powered by the shared C++ chess engine compiled to WebAssembly.

## Requirements

- Node.js 20 or newer
- Emscripten 3.1 or newer (`em++` on `PATH`)

Install Emscripten with Homebrew on macOS:

```sh
brew install emscripten
```

## Development

```sh
npm install
npm run dev
```

The `predev` and `prebuild` scripts compile the engine sources from `../chess/shared/chess` into `public/engine/`. Run `npm run build:engine` to rebuild only the WebAssembly module.

The browser delegates move generation, move validation, FEN parsing, undo, and game-ending checks to the C++ engine. Computer search runs in a Web Worker so deeper searches do not block board interaction. The generated JavaScript and WebAssembly files are build outputs and are not checked in.

## Production

```sh
npm run build
npm start
```

The deployment build environment must have Emscripten installed so the shared C++ engine can be compiled before Next.js builds the site.
