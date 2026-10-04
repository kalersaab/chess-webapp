export type ChessPiece = `${"w" | "b"}${"p" | "n" | "b" | "r" | "q" | "k"}`;
export type ChessBoard = (ChessPiece | null)[][];
export type MoveResult = "valid" | "check" | "checkmate" | "invalid";

interface WasmModule {
  _chess_create(): number;
  _chess_destroy(handle: number): void;
  _chess_reset(handle: number): void;
  _chess_get_board(handle: number): number;
  _chess_get_turn(handle: number): number;
  _chess_get_valid_moves(handle: number, square: number): number;
  _chess_make_move(handle: number, move: number): number;
  _chess_undo(handle: number): number;
  _chess_get_fen(handle: number): number;
  _chess_load_fen(handle: number, fen: number): number;
  _chess_is_checkmate(handle: number): number;
  _chess_is_stalemate(handle: number): number;
  _chess_is_threefold_repetition(handle: number): number;
  _chess_string_free(value: number): void;
  stringToNewUTF8(value: string): number;
  UTF8ToString(value: number): string;
}

declare global {
  interface Window {
    createChessEngineModule?: (options: {
      locateFile: (file: string) => string;
    }) => Promise<WasmModule>;
  }
}

let modulePromise: Promise<WasmModule> | null = null;

function getModule(): Promise<WasmModule> {
  if (modulePromise) return modulePromise;

  modulePromise = new Promise<WasmModule>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/engine/chess-engine.js";
    script.async = true;
    script.onload = () => {
      const factory = window.createChessEngineModule;
      if (!factory) {
        reject(new Error("The chess WebAssembly module did not expose its loader."));
        return;
      }
      factory({ locateFile: (file) => `/engine/${file}` }).then(resolve, reject);
    };
    script.onerror = () => reject(new Error("Could not load the chess engine script."));
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    modulePromise = null;
    throw error;
  });

  return modulePromise;
}

export class ChessEngine {
  private constructor(
    private readonly module: WasmModule,
    private readonly handle: number,
  ) {}

  static async create(): Promise<ChessEngine> {
    const wasmModule = await getModule();
    const handle = wasmModule._chess_create();
    if (!handle) throw new Error("Could not create a chess engine instance.");
    return new ChessEngine(wasmModule, handle);
  }

  dispose() {
    this.module._chess_destroy(this.handle);
  }

  reset() {
    this.module._chess_reset(this.handle);
  }

  getBoard(): ChessBoard {
    const encoded = this.readString(this.module._chess_get_board(this.handle));
    if (encoded.length !== 64) throw new Error("The chess engine returned an invalid board.");
    return Array.from({ length: 8 }, (_, row) =>
      Array.from({ length: 8 }, (_, col) => {
        const symbol = encoded[row * 8 + col];
        if (symbol === ".") return null;
        const color = symbol === symbol.toUpperCase() ? "w" : "b";
        return `${color}${symbol.toLowerCase()}` as ChessPiece;
      }),
    );
  }

  getTurn(): "w" | "b" {
    return this.module._chess_get_turn(this.handle) === 1 ? "w" : "b";
  }

  getValidMoves(square: string): string[] {
    const squarePointer = this.module.stringToNewUTF8(square);
    try {
      const encoded = this.readString(this.module._chess_get_valid_moves(this.handle, squarePointer));
      return encoded ? encoded.split(",").map((move) => move.replace("=", "")) : [];
    } finally {
      this.module._chess_string_free(squarePointer);
    }
  }

  makeMove(move: string): MoveResult {
    const movePointer = this.module.stringToNewUTF8(move);
    try {
      const result = this.module._chess_make_move(this.handle, movePointer);
      if (result === 1) return "valid";
      if (result === 2) return "check";
      if (result === 3) return "checkmate";
      return "invalid";
    } finally {
      this.module._chess_string_free(movePointer);
    }
  }

  undo(): boolean {
    return this.module._chess_undo(this.handle) === 1;
  }

  getFen(): string {
    return this.readString(this.module._chess_get_fen(this.handle));
  }

  loadFen(fen: string): boolean {
    const fenPointer = this.module.stringToNewUTF8(fen);
    try {
      return this.module._chess_load_fen(this.handle, fenPointer) === 1;
    } finally {
      this.module._chess_string_free(fenPointer);
    }
  }

  isCheckmate(): boolean {
    return this.module._chess_is_checkmate(this.handle) === 1;
  }

  isStalemate(): boolean {
    return this.module._chess_is_stalemate(this.handle) === 1;
  }

  isThreefoldRepetition(): boolean {
    return this.module._chess_is_threefold_repetition(this.handle) === 1;
  }

  private readString(pointer: number): string {
    if (!pointer) throw new Error("The chess engine could not allocate a result string.");
    try {
      return this.module.UTF8ToString(pointer);
    } finally {
      this.module._chess_string_free(pointer);
    }
  }
}
