import { BrowserRouter, Routes, Route } from "react-router";
import Game from "./pages/Game";
import AIGame from "./pages/AIGame";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="container">
        <Routes>
          <Route path="/game/:roomId" element={<Game />} />
          <Route path="/ai" element={<AIGame />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
