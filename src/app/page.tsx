"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ChessEngine, type ChessBoard as ChessBoardState, type ChessPiece, type MoveResult } from "@/lib/chess-engine";
import { findBestMove } from "@/lib/chess-search";
import ChessBoard from "@/components/chess/ChessBoard";
import GameDialogs from "@/components/chess/GameDialogs";
import GamePanel from "@/components/chess/GamePanel";
import PlayerCard from "@/components/chess/PlayerCard";
import { SiteFooter, SiteHeader } from "@/components/chess/SiteChrome";
import type { GameMode, Move, PieceColor, Promotion } from "@/components/chess/types";

const emptyBoard = (): ChessBoardState => Array.from({ length: 8 }, () => Array<null>(8).fill(null));

function formatClock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function Home() {
  const [engine, setEngine] = useState<ChessEngine | null>(null);
  const [engineLoading, setEngineLoading] = useState(true);
  const [engineError, setEngineError] = useState("");
  const [board, setBoard] = useState<ChessBoardState>(emptyBoard);
  const [turn, setTurn] = useState<PieceColor>("w");
  const [selected, setSelected] = useState<string | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState<GameMode>("computer");
  const [difficulty, setDifficulty] = useState(3);
  const [isThinking, setIsThinking] = useState(false);
  const [positionVersion, setPositionVersion] = useState(0);
  const [gameOver, setGameOver] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingPromotion, setPendingPromotion] = useState<Promotion | null>(null);
  const [showFen, setShowFen] = useState(false);
  const [fen, setFen] = useState("");
  const [fenError, setFenError] = useState("");
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const whiteTimeRef = useRef(600);
  const blackTimeRef = useRef(600);
  const modeRef = useRef(mode);

  useEffect(() => {
    let cancelled = false;
    let instance: ChessEngine | null = null;
    void ChessEngine.create().then((created) => {
      instance = created;
      if (cancelled) {
        created.dispose();
        return;
      }
      setEngine(created);
      setBoard(created.getBoard());
      setTurn(created.getTurn());
      setEngineLoading(false);
    }).catch((error: unknown) => {
      if (cancelled) return;
      setEngineError(error instanceof Error ? error.message : "Could not load the chess engine.");
      setEngineLoading(false);
    });
    return () => {
      cancelled = true;
      instance?.dispose();
    };
  }, []);

  useEffect(() => {
    if (!engine || gameOver) return;
    const timer = window.setInterval(() => {
      if (turn === "w") {
        whiteTimeRef.current = Math.max(0, whiteTimeRef.current - 1);
        setWhiteTime(whiteTimeRef.current);
        if (whiteTimeRef.current === 0) setGameOver("Black wins on time");
        if (whiteTimeRef.current === 0) setIsThinking(false);
      } else {
        blackTimeRef.current = Math.max(0, blackTimeRef.current - 1);
        setBlackTime(blackTimeRef.current);
        if (blackTimeRef.current === 0) setGameOver("White wins on time");
        if (blackTimeRef.current === 0) setIsThinking(false);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [engine, turn, gameOver]);

  const destinations = useMemo(() => {
    if (!engine || !selected) return [];
    return engine.getValidMoves(selected);
  }, [engine, selected]);

  const lastMove = moves[moves.length - 1];
  const captures = useMemo(() => ({
    w: moves.filter((move) => move.piece[0] === "w" && move.captured).map((move) => move.captured as ChessPiece),
    b: moves.filter((move) => move.piece[0] === "b" && move.captured).map((move) => move.captured as ChessPiece),
  }), [moves]);

  const commitMove = useCallback((from: string, to: string, promotion = ""): boolean => {
    if (!engine) return false;
    const fromRow = 8 - Number(from[1]);
    const fromCol = from.charCodeAt(0) - 97;
    const toRow = 8 - Number(to[1]);
    const toCol = to.charCodeAt(0) - 97;
    const piece = board[fromRow][fromCol];
    if (!piece) return false;

    const enPassantSquare = engine.getFen().split(/\s+/)[3];
    const result: MoveResult = engine.makeMove(`${from}${to}${promotion}`);
    if (result === "invalid") {
      setEngineError("The C++ engine rejected that move. Please select a legal destination.");
      setSelected(null);
      return false;
    }

    setEngineError("");
    setBoard(engine.getBoard());
    setTurn(engine.getTurn());
    const captured = board[toRow][toCol] ??
      (piece[1] === "p" && from.charCodeAt(0) !== to.charCodeAt(0) &&
        enPassantSquare === to
        ? board[fromRow][toCol]
        : null);
    setMoves((history) => [...history, { from, to, piece, captured }]);
    setSelected(null);
    setPendingPromotion(null);

    if (result === "checkmate") {
      setGameOver(`${piece[0] === "w" ? "White" : "Black"} wins by checkmate`);
      setNotice("");
    } else if (engine.isThreefoldRepetition()) {
      setGameOver("Draw by threefold repetition");
      setNotice("");
    } else if (engine.isStalemate()) {
      setGameOver("Draw by stalemate");
      setNotice("");
    } else {
      setGameOver("");
      setNotice(result === "check" ? "Check" : "");
    }
    return true;
  }, [board, engine]);

  const resetGame = () => {
    if (!engine) return;
    engine.reset();
    setBoard(engine.getBoard());
    setTurn(engine.getTurn());
    setSelected(null);
    setMoves([]);
    setPendingPromotion(null);
    whiteTimeRef.current = 600;
    blackTimeRef.current = 600;
    setWhiteTime(600);
    setBlackTime(600);
    setGameOver("");
    setNotice("");
    setEngineError("");
    setIsThinking(false);
    setPositionVersion((version) => version + 1);
  };

  const playSquare = (name: string) => {
    if (!engine || gameOver || isThinking || (mode === "computer" && turn === "b")) return;
    const row = 8 - Number(name[1]);
    const col = name.charCodeAt(0) - 97;
    const piece = board[row][col];
    if (!selected) {
      if (piece?.[0] === turn && engine.getValidMoves(name).length > 0) setSelected(name);
      return;
    }
    if (selected === name) {
      setSelected(null);
      return;
    }
    if (piece?.[0] === turn) {
      if (engine.getValidMoves(name).length > 0) setSelected(name);
      return;
    }
    if (!destinations.includes(name)) {
      setSelected(null);
      return;
    }

    const fromRow = 8 - Number(selected[1]);
    const fromCol = selected.charCodeAt(0) - 97;
    const movingPiece = board[fromRow][fromCol];
    if (movingPiece?.[1] === "p" && (row === 0 || row === 7)) {
      setPendingPromotion({ from: selected, to: name });
      return;
    }
    commitMove(selected, name);
  };

  const undoMove = () => {
    if (!engine || moves.length === 0 || isThinking) return;
    const takebackCount = mode === "computer" && moves.length >= 2 ? 2 : 1;
    for (let i = 0; i < takebackCount; i++) {
      if (!engine.undo()) {
        setEngineError("The engine could not undo the previous move.");
        return;
      }
    }
    setBoard(engine.getBoard());
    setTurn(engine.getTurn());
    setMoves((history) => history.slice(0, -takebackCount));
    setSelected(null);
    setPendingPromotion(null);
    setGameOver("");
    setNotice("");
    setEngineError("");
  };

  const loadFen = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!engine || !engine.loadFen(fen.trim())) {
      setFenError("That position doesn’t look right. Check the FEN and try again.");
      return;
    }
    setBoard(engine.getBoard());
    setTurn(engine.getTurn());
    setMoves([]);
    setSelected(null);
    setPendingPromotion(null);
    setFenError("");
    setShowFen(false);
    setFen("");
    setGameOver(engine.isCheckmate() ? "Checkmate" : engine.isStalemate() ? "Draw by stalemate" : "");
    setNotice("");
    setEngineError("");
    setWhiteTime(600);
    setBlackTime(600);
    whiteTimeRef.current = 600;
    blackTimeRef.current = 600;
    setIsThinking(false);
    setPositionVersion((version) => version + 1);
  };

  const switchMode = (nextMode: GameMode) => {
    if (modeRef.current === nextMode) return;
    modeRef.current = nextMode;
    setMode(nextMode);
    setIsThinking(false);
  };

  useEffect(() => {
    if (!engine || mode !== "computer" || turn !== "b" || gameOver) return;

    let cancelled = false;
    const positionFen = engine.getFen();
    const timer = window.setTimeout(() => {
      setIsThinking(true);
      void findBestMove(positionFen, difficulty).then((move) => {
        if (
          cancelled ||
          modeRef.current !== "computer" ||
          engine.getFen() !== positionFen
        ) return;
        if (!move) {
          setGameOver(engine.isCheckmate() ? "White wins by checkmate" : "Draw");
          return;
        }
        if (!commitMove(move.slice(0, 2), move.slice(2, 4), move[4] ?? "")) {
          setEngineError("The computer engine returned a move the rules engine rejected.");
          setGameOver("Computer move failed. Start a new game to continue.");
        }
      }).catch((error: unknown) => {
        if (cancelled) return;
        setEngineError(error instanceof Error ? error.message : "The computer could not find a move.");
        setGameOver("Computer search failed. Start a new game to continue.");
      }).finally(() => {
        if (!cancelled) setIsThinking(false);
      });
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [commitMove, difficulty, engine, gameOver, mode, positionVersion, turn]);

  return (
    <main className="app-shell">
      <SiteHeader mode={mode} />

      <div className="game-layout">
        <section className="board-column" aria-label="Chess game">
          <div className="game-heading">
            <div>
              <p className="eyebrow">YOUR NEXT MOVE</p>
              <h1>{gameOver || (engineLoading ? "Starting chess engine…" : isThinking ? "Computer is thinking…" : notice || (turn === "w" ? "White to move" : "Black to move"))}</h1>
            </div>
            <button className="icon-button heading-more" aria-label="More game options">•••</button>
          </div>
          {engineError && <p className="engine-error" role="alert">{engineError}</p>}

          <PlayerCard
            color="b"
            name={mode === "computer" ? "Computer" : "Opponent"}
            rating={mode === "computer" ? `C++ engine · Depth ${difficulty}` : "Guest player"}
            active={turn === "b" && !gameOver}
            clock={formatClock(blackTime)}
          />

          <ChessBoard
            board={board}
            flipped={flipped}
            selected={selected}
            destinations={destinations}
            lastMove={lastMove}
            disabled={!engine || !!gameOver || isThinking || (mode === "computer" && turn === "b")}
            undoDisabled={!engine || moves.length === 0 || isThinking}
            captures={captures}
            onSquareClick={playSquare}
            onUndo={undoMove}
            onFlip={() => setFlipped(!flipped)}
          />

          <PlayerCard
            color="w"
            name="You"
            rating="1,248"
            active={turn === "w" && !gameOver}
            clock={formatClock(whiteTime)}
            reversed
          />
        </section>

        <GamePanel
          mode={mode}
          difficulty={difficulty}
          moves={moves}
          engineLoading={engineLoading}
          onModeChange={switchMode}
          onDifficultyChange={setDifficulty}
          onLoadPosition={() => { setShowFen(true); setFenError(""); }}
          onNewGame={resetGame}
        />
      </div>

      <SiteFooter />
      <GameDialogs
        showFen={showFen}
        fen={fen}
        fenError={fenError}
        pendingPromotion={pendingPromotion}
        turn={turn}
        onFenChange={setFen}
        onFenSubmit={loadFen}
        onCloseFen={() => setShowFen(false)}
        onPromote={(kind) => {
          if (pendingPromotion) commitMove(pendingPromotion.from, pendingPromotion.to, kind);
        }}
        onCancelPromotion={() => setPendingPromotion(null)}
      />
    </main>
  );
}
