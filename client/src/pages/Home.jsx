import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "../context/ThemeContext";
import Swal from "sweetalert2";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
    </button>
  );
}

export default function Home() {
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const errorMessage = sessionStorage.getItem("roomError");
    if (errorMessage) {
      sessionStorage.removeItem("roomError");
      Swal.fire({
        icon: "error",
        title: "Tidak Bisa Masuk",
        text: errorMessage,
        confirmButtonText: "OK",
      });
    }
  }, []);

  const createRandomRoom = () =>
    Math.random().toString(36).slice(2, 8).toUpperCase();

  const join = () => {
    if (!playerName.trim() || !roomId.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Isi Data Dulu",
        text: "Isi nama dan Room ID dulu ya!",
        confirmButtonText: "OK",
      });
      return;
    }
    sessionStorage.setItem("playerName", playerName.trim());
    navigate(`/game/${roomId.trim().toUpperCase()}`);
  };

  const quick = () => setRoomId(createRandomRoom());

  const playAI = () => {
    if (!playerName.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Isi Nama Dulu",
        text: "Isi nama kamu dulu ya!",
        confirmButtonText: "OK",
      });
      return;
    }
    sessionStorage.setItem("playerName", playerName.trim());
    navigate("/ai");
  };

  return (
    <div className="card">
      <ThemeToggle />

      <h1>🎮 Tic-Tac-Toe</h1>
      <p className="muted">
        Masuk ke room yang sama bersama temanmu untuk bermain PvP, atau main
        sendiri melawan AI.
      </p>

      <div className="row">
        <input
          placeholder="Nama kamu"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
        <input
          placeholder="ROOM ID (mis. ABC123)"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
        />
      </div>

      <div className="row">
        <button onClick={join}>🎯 Join PvP</button>
        <button className="ghost" onClick={quick}>
          🔑 Generate Room
        </button>
        <button onClick={playAI}>🤖 Main vs AI</button>
      </div>
    </div>
  );
}
