import type { GameMode, Move } from "./types";

type GamePanelProps = {
  mode: GameMode;
  difficulty: number;
  moves: Move[];
  engineLoading: boolean;
  onModeChange: (mode: GameMode) => void;
  onDifficultyChange: (difficulty: number) => void;
  onLoadPosition: () => void;
  onNewGame: () => void;
};

export default function GamePanel({
  mode,
  difficulty,
  moves,
  engineLoading,
  onModeChange,
  onDifficultyChange,
  onLoadPosition,
  onNewGame,
}: GamePanelProps) {
  return (
    <aside className="game-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">GAME ROOM</p>
          <h2>{mode === "computer" ? "Play computer" : "Play together"}</h2>
        </div>
        <span className="panel-menu">⋮</span>
      </div>

      <div className="mode-switch" role="group" aria-label="Game mode">
        <button className={mode === "computer" ? "mode-active" : ""} onClick={() => onModeChange("computer")}>vs Computer</button>
        <button className={mode === "players" ? "mode-active" : ""} onClick={() => onModeChange("players")}>2 Players</button>
      </div>

      <div className="difficulty-row">
        <div className="difficulty-icon">✦</div>
        <div className="difficulty-copy">
          <label htmlFor="engine-depth">Computer difficulty</label>
          <select id="engine-depth" value={difficulty} onChange={(event) => onDifficultyChange(Number(event.target.value))}>
            <option value={2}>Beginner · depth 2</option>
            <option value={3}>Intermediate · depth 3</option>
            <option value={4}>Advanced · depth 4</option>
          </select>
        </div>
        <span className="difficulty-rating">C++</span>
      </div>

      <div className="panel-rule" />

      <div className="moves-heading">
        <div>
          <p className="eyebrow">THE GAME SO FAR</p>
          <h3>Moves <span>{moves.length}</span></h3>
        </div>
        <span className="notation-label">NOTATION</span>
      </div>
      <div className="move-list" aria-live="polite">
        {moves.length === 0 ? (
          <div className="empty-moves">
            <span className="empty-icon">♟</span>
            <p>{engineLoading ? "Loading the rules engine." : "The board is yours."}</p>
            <span>{engineLoading ? "Getting the C++ engine ready." : "Make a move to get started."}</span>
          </div>
        ) : (
          <div className="move-grid">
            {Array.from({ length: Math.ceil(moves.length / 2) }, (_, index) => (
              <div className={`move-row ${index === Math.ceil(moves.length / 2) - 1 ? "move-row-current" : ""}`} key={index}>
                <span className="move-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="move-san">{moves[index * 2]?.from}–{moves[index * 2]?.to}</span>
                <span className="move-san">{moves[index * 2 + 1] ? `${moves[index * 2 + 1].from}–${moves[index * 2 + 1].to}` : ""}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel-rule" />
      <div className="panel-actions">
        <button className="secondary-action" onClick={onLoadPosition}>Load position <span>⌘</span></button>
        <button className="primary-action" onClick={onNewGame}><span>↻</span> New game</button>
      </div>
      <p className="game-note"><span>✦</span> A good game is always one move away.</p>
    </aside>
  );
}
