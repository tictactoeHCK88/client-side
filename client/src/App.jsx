import { BrowserRouter, Routes, Route } from "react-router";
import Home from "./pages/Home";
import Game from "./pages/Game";
import AIGame from "./pages/AIGame";
import "./App.css";
import { ThemeProvider } from "./context/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
  <BrowserRouter>
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game/:roomId" element={<Game />} />
          <Route path="/ai" element={<AIGame />} />
        </Routes>
      </div>
    </BrowserRouter>
    </ThemeProvider>
  
  );
}
