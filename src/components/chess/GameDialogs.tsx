import Image from "next/image";
import type { FormEventHandler } from "react";
import type { ChessPiece } from "@/lib/chess-engine";
import type { PieceColor, Promotion } from "./types";

type GameDialogsProps = {
  showFen: boolean;
  fen: string;
  fenError: string;
  pendingPromotion: Promotion | null;
  turn: PieceColor;
  onFenChange: (fen: string) => void;
  onFenSubmit: FormEventHandler<HTMLFormElement>;
  onCloseFen: () => void;
  onPromote: (kind: string) => void;
  onCancelPromotion: () => void;
};

export default function GameDialogs({
  showFen,
  fen,
  fenError,
  pendingPromotion,
  turn,
  onFenChange,
  onFenSubmit,
  onCloseFen,
  onPromote,
  onCancelPromotion,
}: GameDialogsProps) {
  return (
    <>
      {showFen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onCloseFen(); }}>
          <form className="fen-modal" onSubmit={onFenSubmit}>
            <button type="button" className="modal-close" aria-label="Close" onClick={onCloseFen}>×</button>
            <p className="eyebrow">CUSTOM POSITION</p>
            <h2>Load a position</h2>
            <p>Paste a FEN string to set up the board.</p>
            <textarea value={fen} onChange={(event) => onFenChange(event.target.value)} placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w" rows={3} autoFocus />
            {fenError && <span className="fen-error">{fenError}</span>}
            <button className="primary-action" type="submit">Load position</button>
          </form>
        </div>
      )}

      {pendingPromotion && (
        <div className="modal-backdrop">
          <div className="promotion-modal" role="dialog" aria-modal="true" aria-label="Choose a promotion piece">
            <p className="eyebrow">PAWN PROMOTION</p>
            <h2>Choose your piece</h2>
            <div className="promotion-options">
              {(["q", "r", "b", "n"] as const).map((kind) => {
                const piece = `${turn}${kind}` as ChessPiece;
                return (
                  <button key={kind} onClick={() => onPromote(kind)} aria-label={`Promote to ${kind}`}>
                    <Image src={`/pieces/${piece}.png`} alt="" width={64} height={64} />
                  </button>
                );
              })}
            </div>
            <button className="secondary-action" onClick={onCancelPromotion}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
