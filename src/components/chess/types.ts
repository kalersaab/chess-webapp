import type { ChessPiece } from "@/lib/chess-engine";

export type PieceColor = "w" | "b";
export type GameMode = "computer" | "players";
export type Move = { from: string; to: string; piece: ChessPiece; captured: ChessPiece | null };
export type Promotion = { from: string; to: string };
