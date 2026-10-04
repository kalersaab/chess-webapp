let wasmModulePromise;
let engineHandle;

async function getEngine() {
  if (!wasmModulePromise) {
    importScripts("/engine/chess-engine.js");
    const factory = self.createChessEngineModule;
    if (!factory) throw new Error("The chess search engine could not be loaded.");
    wasmModulePromise = factory({ locateFile: (file) => `/engine/${file}` }).then((module) => {
      const handle = module._chess_create();
      if (!handle) throw new Error("The chess search engine could not be initialized.");
      engineHandle = handle;
      return module;
    });
  }
  return wasmModulePromise;
}

self.onmessage = async (event) => {
  const { id, fen, depth } = event.data;
  try {
    const module = await getEngine();
    const fenPointer = module.stringToNewUTF8(fen);
    let movePointer;
    try {
      if (module._chess_load_fen(engineHandle, fenPointer) !== 1) {
        throw new Error("The chess engine could not prepare the current position for search.");
      }
      movePointer = module._chess_get_best_move(engineHandle, depth);
      if (!movePointer) throw new Error("The chess engine could not allocate its search result.");
      const move = module.UTF8ToString(movePointer);
      self.postMessage({ id, move });
    } finally {
      module._chess_string_free(fenPointer);
      if (movePointer) module._chess_string_free(movePointer);
    }
  } catch (error) {
    self.postMessage({
      id,
      error: error instanceof Error ? error.message : "The chess search failed.",
    });
  }
};
