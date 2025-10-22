import { useState, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import Swal from "sweetalert2";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
    </button>
  );
}

export default function AIGame() {
  const playerName = useMemo(
    () => sessionStorage.getItem("playerName") || "Player",
    []
  );

  const [board, setBoard] = useState(Array(9).fill(null));
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState("hard");
  const [score, setScore] = useState({ player: 0, ai: 0, draw: 0 });

  const checkWinner = (b) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (const [a, b1, c] of lines) {
      if (b[a] && b[a] === b[b1] && b[a] === b[c]) return b[a];
    }
    if (b.every((v) => v)) return "Draw";
    return null;
  };
  const move = async (i) => {
    if (winner || board[i] || loading) return;

    const newBoard = [...board];
    newBoard[i] = "X";
    setBoard(newBoard);

    const w = checkWinner(newBoard);
    if (w) {
      setWinner(w);
      if (w === "X") setScore((s) => ({ ...s, player: s.player + 1 }));
      else if (w === "Draw") setScore((s) => ({ ...s, draw: s.draw + 1 }));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("https://aflahhaqy.site/api/ai-move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board: newBoard, difficulty }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const aiMove = data.move;

      if (
        aiMove !== null &&
        aiMove !== undefined &&
        newBoard[aiMove] === null
      ) {
        newBoard[aiMove] = "O";
        setBoard([...newBoard]);
        const aiWin = checkWinner(newBoard);
        if (aiWin) {
          setWinner(aiWin);
          if (aiWin === "O") setScore((s) => ({ ...s, ai: s.ai + 1 }));
          else if (aiWin === "Draw")
            setScore((s) => ({ ...s, draw: s.draw + 1 }));
        }
      }
    } catch (error) {
      console.error("Gagal ambil gerakan AI:", error);
      Swal.fire({
        icon: "error",
        title: "AI Error",
        text: "Terjadi kesalahan pada AI. Silakan refresh halaman.",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setLoading(false);
  };

  return (
    <div className="ai-container">
      <div className="ai-card card">
        <ThemeToggle />

        <h2>🤖 Player vs AI</h2>
        <div className="muted">Kamu: {playerName} (X)</div>

        <div className="difficulty-selector" style={{ margin: "16px 0" }}>
          <label style={{ marginRight: "12px", fontSize: "14px" }}>
            Level Kesulitan:
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            disabled={loading || board.some((v) => v !== null)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid var(--input-border)",
              background: "var(--input-bg)",
              color: "var(--text-color)",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            <option value="easy">🟢 Mudah </option>
            <option value="medium">🟡 Sedang </option>
            <option value="hard">🔴 Sulit </option>
          </select>
        </div>
        <div
          className="score-board"
          style={{
            display: "flex",
            justifyContent: "space-around",
            margin: "16px 0",
            padding: "12px",
            background: "rgba(255,255,255,0.02)",
            borderRadius: "10px",
            border: "1px solid var(--input-border)",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Kamu (X)
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "var(--x-color)",
              }}
            >
              {score.player}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Seri
            </div>
            <div style={{ fontSize: "24px", fontWeight: "700" }}>
              {score.draw}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              AI (O)
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "var(--o-color)",
              }}
            >
              {score.ai}
            </div>
          </div>
        </div>
        {winner && (
          <div className="winner">
            {winner === "Draw"
              ? "🤝 Seri!"
              : `🏆 Pemenang: ${winner === "X" ? "Kamu" : "AI"}!`}
            <div className="row" style={{ marginTop: 8 }}>
              <button onClick={reset}>🔁 Main lagi</button>
            </div>
          </div>
        )}
        <div className="board">
          {board.map((v, i) => (
            <button
              key={i}
              className={`cell ${v === "X" ? "x" : v === "O" ? "o" : ""}`}
              disabled={!!v || !!winner || loading}
              onClick={() => move(i)}
            >
              {v || ""}
            </button>
          ))}
        </div>

        <div className="hint">
          {loading
            ? "🤖 AI sedang berpikir..."
            : winner
            ? "Permainan selesai!"
            : "Giliran kamu bermain!"}
        </div>

        <button
          className="ghost"
          style={{ marginTop: 18 }}
          onClick={() => (window.location.href = "/")}
        >
          ⬅️ Kembali ke menu
        </button>
      </div>
    </div>
  );
}
