import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { socket } from "../socket";
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

export default function Game() {
  const { roomId } = useParams();
  const playerName = useMemo(
    () => sessionStorage.getItem("playerName") || "Player",
    []
  );

  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState("X");
  const [winner, setWinner] = useState(null);
  const [highlight, setHighlight] = useState([]);
  const [players, setPlayers] = useState([]);
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);
  const [leaderboard, setLeaderboard] = useState({});

  const addWin = useMemo(
    () => (name) => {
      const key = "leaderboard";
      const prev = JSON.parse(localStorage.getItem(key) || "{}");
      prev[name] = (prev[name] || 0) + 1;
      localStorage.setItem(key, JSON.stringify(prev));
      socket.emit("leaderboardUpdate", { roomId, leaderboard: prev });
    },
    [roomId]
  );

  useEffect(() => {
    socket.emit("joinRoom", { roomId, playerName });

    const savedLeaderboard = JSON.parse(
      localStorage.getItem("leaderboard") || "{}"
    );
    setLeaderboard(savedLeaderboard);

    const onJoined = ({ players, turn, board }) => {
      setPlayers(players);
      setTurn(turn);
      setBoard(board);
    };
    const onBoard = ({ board, turn }) => {
      setBoard(board);
      setTurn(turn);
      setWinner(null);
      setHighlight([]);
    };
    const onWinner = ({ winner, line }) => {
      setWinner(winner);
      setHighlight(line || []);
      if (winner && winner !== "Draw") addWin(winner);
    };
    const onReset = ({ board, turn }) => {
      setBoard(board);
      setTurn(turn);
      setWinner(null);
      setHighlight([]);
    };
    const onChat = (m) => setChat((p) => [...p, m]);
    const onLeaderboardUpdate = ({ leaderboard: newLeaderboard }) => {
      setLeaderboard(newLeaderboard);
      localStorage.setItem("leaderboard", JSON.stringify(newLeaderboard));
    };
    const onLeaderboardClear = () => {
      setLeaderboard({});
      localStorage.removeItem("leaderboard");
    };
    const onError = ({ message }) => {
      sessionStorage.setItem("roomError", message);
      window.location.href = "/";
    };

    socket.on("playerJoined", onJoined);
    socket.on("boardUpdate", onBoard);
    socket.on("winner", onWinner);
    socket.on("resetGame", onReset);
    socket.on("chatMessage", onChat);
    socket.on("leaderboardUpdate", onLeaderboardUpdate);
    socket.on("leaderboardClear", onLeaderboardClear);
    socket.on("error", onError);

    return () => {
      socket.off("playerJoined", onJoined);
      socket.off("boardUpdate", onBoard);
      socket.off("winner", onWinner);
      socket.off("resetGame", onReset);
      socket.off("chatMessage", onChat);
      socket.off("leaderboardUpdate", onLeaderboardUpdate);
      socket.off("leaderboardClear", onLeaderboardClear);
      socket.off("error", onError);
    };
  }, [roomId, playerName, addWin]);

  const mySymbol = useMemo(() => {
    const myPlayer = players.find((p) => p.socketId === socket.id);
    if (!myPlayer) return "?";
    return players[0]?.socketId === socket.id ? "X" : "O";
  }, [players]);

  const myTurn = turn === mySymbol;

  const move = (i) => {
    if (winner || board[i] || !myTurn) return;
    socket.emit("makeMove", { roomId, index: i, symbol: mySymbol });
  };

  const reset = () => socket.emit("resetGameRequest", { roomId });

  const send = () => {
    const text = msg.trim();
    if (!text) return;
    socket.emit("chatMessage", { roomId, playerName, message: text });
    setMsg("");
  };

  return (
    <div className="card">
      <div className="header">
        <div>
          <h2>Room: {roomId}</h2>
          <div className="muted">
            Pemain: {players.map((p) => p.name).join(" vs ") || "-"}
          </div>
          <div className="muted" style={{ marginTop: 4 }}>
            Kamu: <b>{playerName}</b> ({mySymbol || "?"})
          </div>
        </div>
        <ThemeToggle />
      </div>

      <div className="layout">
        <div className="game-section">
          <h3>
            Giliran: <b>{turn}</b>{" "}
            {myTurn ? "— giliran kamu" : "— tunggu lawan"}
          </h3>

          {winner && (
            <div className="winner">
              {winner === "Draw" ? "🤝 Seri!" : `🏆 Pemenang: ${winner}`}
              <div className="row" style={{ marginTop: 8 }}>
                <button onClick={reset}>🔁 Main lagi</button>
              </div>
            </div>
          )}

          <div className="board">
            {board.map((v, i) => {
              let displaySymbol = v;
              if (
                !v &&
                winner &&
                winner !== "Draw" &&
                highlight.includes(i) &&
                highlight.length > 0
              ) {
                const winningSymbol =
                  board[highlight[0]] ||
                  board[highlight[1]] ||
                  board[highlight[2]];
                displaySymbol = winningSymbol;
              }

              return (
                <button
                  key={i}
                  className={`cell ${
                    displaySymbol === "X"
                      ? "x"
                      : displaySymbol === "O"
                      ? "o"
                      : ""
                  } ${highlight.includes(i) ? "win" : ""}`}
                  disabled={!!v || !!winner || !myTurn}
                  onClick={() => move(i)}
                >
                  {displaySymbol || ""}
                </button>
              );
            })}
          </div>
        </div>

        <div className="sidebar">
          <Leaderboard scores={leaderboard} roomId={roomId} />

          <div className="chat">
            <div className="chat-head">💬 Chat</div>
            <div className="chat-body" id="chat-body">
              {chat.length === 0 ? (
                <div className="muted">Belum ada pesan…</div>
              ) : (
                chat.map((c, idx) => (
                  <div key={idx}>
                    <b>{c.playerName}</b>: {c.message}
                  </div>
                ))
              )}
            </div>
            <div className="chat-input">
              <input
                placeholder="Ketik pesan…"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button onClick={send}>Kirim</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Leaderboard({ scores, roomId }) {
  const entries = Object.entries(scores || {}).sort((a, b) => b[1] - a[1]);

  const clear = () => {
    Swal.fire({
      title: "Hapus Leaderboard?",
      text: "Semua skor akan dihapus!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("leaderboard");
        // Emit clear event to all players in room
        socket.emit("leaderboardClear", { roomId });
        Swal.fire({
          title: "Terhapus!",
          text: "Leaderboard telah dikosongkan.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  return (
    <div className="lb">
      <div className="lb-head">
        <h4>🏆 Leaderboard</h4>
        <button className="ghost" onClick={clear}>
          Clear
        </button>
      </div>
      {entries.length === 0 ? (
        <div className="muted">Belum ada pemenang.</div>
      ) : (
        <ul>
          {entries.map(([name, score]) => (
            <li key={name}>
              <b>{name}</b>: {score} kemenangan
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
