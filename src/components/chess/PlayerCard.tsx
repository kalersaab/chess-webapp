import type { PieceColor } from "./types";

type PlayerCardProps = {
  color: PieceColor;
  name: string;
  rating: string;
  active: boolean;
  clock: string;
  reversed?: boolean;
};

export default function PlayerCard({
  color,
  name,
  rating,
  active,
  clock,
  reversed = false,
}: PlayerCardProps) {
  return (
    <div className={`player-card ${active ? "is-active" : ""} ${reversed ? "player-card-reversed" : ""}`}>
      <div className={`avatar ${color === "w" ? "avatar-white" : "avatar-black"}`}>
        {color === "w" ? "♙" : "♟"}
      </div>
      <div className="player-copy">
        <span className="player-name">{name}</span>
        <span className="player-rating">{rating}</span>
      </div>
      <div className={`clock ${active ? "clock-active" : ""}`}>{clock}</div>
    </div>
  );
}
