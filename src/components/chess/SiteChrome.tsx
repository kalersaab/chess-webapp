import type { GameMode } from "./types";

export function SiteHeader({ mode }: { mode: GameMode }) {
  return (
    <header className="topbar">
      <a className="brand" href="#" aria-label="Knightly home">
        <span className="brand-mark">♞</span>
        <span>knightly<span className="brand-dot">.</span></span>
      </a>
      <div className="topbar-center">
        <span className="live-dot" />
        <span>Casual game</span>
        <span className="topbar-divider">/</span>
        <span>{mode === "computer" ? "Play vs computer" : "Local game"}</span>
      </div>
      <button className="profile-button" aria-label="Player profile">G</button>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="page-footer">
      <span>KNIGHTLY CHESS CLUB</span>
      <span>Play at your own pace <span className="footer-heart">♥</span></span>
    </footer>
  );
}
