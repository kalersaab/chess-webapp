import Image from "next/image";
import type { ChessBoard as ChessBoardState, ChessPiece } from "@/lib/chess-engine";
import type { Move } from "./types";

const glyphs: Record<ChessPiece, string> = {
  wp: "♙", wn: "♘", wb: "♗", wr: "♖", wq: "♕", wk: "♔",
  bp: "♟", bn: "♞", bb: "♝", br: "♜", bq: "♛", bk: "♚",
};

function squareName(row: number, col: number) {
  return `${String.fromCharCode(97 + col)}${8 - row}`;
}

type ChessBoardProps = {
  board: ChessBoardState;
  flipped: boolean;
  selected: string | null;
  destinations: string[];
  lastMove?: Move;
  disabled: boolean;
  undoDisabled: boolean;
  captures: { w: ChessPiece[]; b: ChessPiece[] };
  onSquareClick: (square: string) => void;
  onUndo: () => void;
  onFlip: () => void;
};

export default function ChessBoard({
  board,
  flipped,
  selected,
  destinations,
  lastMove,
  disabled,
  undoDisabled,
  captures,
  onSquareClick,
  onUndo,
  onFlip,
}: ChessBoardProps) {
  const indices = [...Array(8).keys()];
  const rows = flipped ? [...indices].reverse() : indices;
  const cols = flipped ? [...indices].reverse() : indices;

  return (
    <>
      <div className="board-frame">
        <div className="chessboard" role="grid" aria-label="Chess board">
          {rows.map((row) => cols.map((col) => {
            const square = squareName(row, col);
            const piece = board[row][col];
            const isLight = (row + col) % 2 === 0;
            const isSelected = selected === square;
            const isLastMove = lastMove?.from === square || lastMove?.to === square;
            const isPossible = destinations.includes(square);
            const showFile = flipped ? row === 0 : row === 7;
            const showRank = flipped ? col === 7 : col === 0;

            return (
              <button
                type="button"
                role="gridcell"
                key={square}
                aria-label={`${square}${piece ? ` ${piece[0] === "w" ? "white" : "black"} ${piece[1]}` : ""}`}
                aria-selected={isSelected}
                className={`square ${isLight ? "square-light" : "square-dark"} ${isSelected ? "square-selected" : ""} ${isLastMove ? "square-last-move" : ""}`}
                onClick={() => onSquareClick(square)}
                disabled={disabled}
              >
                {piece && (
                  <span className="piece">
                    <Image
                      src={`/pieces/${piece}.png`}
                      alt=""
                      width={80}
                      height={80}
                      draggable={false}
                      className="piece-image"
                    />
                  </span>
                )}
                {isPossible && <span className={`move-indicator ${piece ? "move-capture" : ""}`} />}
                {showRank && <span className="coordinate rank-coordinate">{8 - row}</span>}
                {showFile && <span className="coordinate file-coordinate">{String.fromCharCode(97 + col)}</span>}
              </button>
            );
          }))}
        </div>
      </div>

      <div className="board-controls">
        <div className="captured-pieces">
          <span className="captured-label">Captured</span>
          <span className="captured-icons">
            {captures.w.map((piece, index) => <span key={`w-${index}`} className={piece[0] === "w" ? "captured-white" : "captured-black"}>{glyphs[piece]}</span>)}
            {captures.b.map((piece, index) => <span key={`b-${index}`} className={piece[0] === "w" ? "captured-white" : "captured-black"}>{glyphs[piece]}</span>)}
            {captures.w.length + captures.b.length === 0 && <span className="capture-empty">—</span>}
          </span>
        </div>
        <div className="board-actions">
          <button className="tool-button" onClick={onUndo} disabled={undoDisabled} aria-label="Undo move" title="Undo move">↶</button>
          <button className="tool-button" onClick={onFlip} aria-label="Flip board" title="Flip board">⇅</button>
        </div>
      </div>
    </>
  );
}
