import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sharedRoot = resolve(appRoot, "../chess/shared/chess");
const outputRoot = resolve(appRoot, "public/engine");
const outputFile = resolve(outputRoot, "chess-engine.js");
const outputWasmFile = resolve(outputRoot, "chess-engine.wasm");

mkdirSync(outputRoot, { recursive: true });

const exports = [
  "chess_create",
  "chess_destroy",
  "chess_reset",
  "chess_get_board",
  "chess_get_turn",
  "chess_get_valid_moves",
  "chess_make_move",
  "chess_undo",
  "chess_get_fen",
  "chess_load_fen",
  "chess_get_best_move",
  "chess_is_checkmate",
  "chess_is_stalemate",
  "chess_is_threefold_repetition",
  "chess_string_free",
].map((name) => `_${name}`);

const sources = [
  "ChessWebBridge.cpp",
  "ChessEngine.cpp",
  "Attacks.cpp",
  "Evaluation.cpp",
  "MoveGen.cpp",
  "OpeningBook.cpp",
  "Search.cpp",
  "TranspositionTable.cpp",
].map((source) => resolve(sharedRoot, source));

const result = spawnSync("em++", [
  ...sources,
  "-std=c++17",
  "-O3",
  "-DNDEBUG",
  `-I${sharedRoot}`,
  "-o",
  outputFile,
  "-sMODULARIZE=1",
  "-sEXPORT_NAME=createChessEngineModule",
  "-sENVIRONMENT=web,worker",
  "-sFILESYSTEM=0",
  "-sALLOW_MEMORY_GROWTH=1",
  "-sSTACK_SIZE=1048576",
  `-sEXPORTED_FUNCTIONS=${JSON.stringify(exports)}`,
  '-sEXPORTED_RUNTIME_METHODS=["UTF8ToString","stringToNewUTF8"]',
], { cwd: appRoot, stdio: "inherit" });

if (result.error) {
  const hasPrebuiltEngine = [outputFile, outputWasmFile].every(
    (file) => existsSync(file) && statSync(file).size > 0,
  );

  if (result.error.code === "ENOENT" && process.env.VERCEL === "1" && hasPrebuiltEngine) {
    console.warn("Emscripten is unavailable on Vercel; using the checked-in engine artifacts.");
    process.exit(0);
  }

  console.error(`Could not run em++: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
