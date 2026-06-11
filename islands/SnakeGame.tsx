import { useEffect, useRef, useState, useCallback } from "preact/hooks";

// --- Types ---
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Point = { x: number; y: number };
type GameStatus = "idle" | "playing" | "paused" | "over";

// --- Constants ---
const COLS = 20;
const ROWS = 20;
const CELL = 22; // px per cell
const BOARD_W = COLS * CELL;
const BOARD_H = ROWS * CELL;
const TICK_MS = 130;

const randomFood = (snake: Point[]): Point => {
  let p: Point;
  do {
    p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (snake.some((s) => s.x === p.x && s.y === p.y));
  return p;
};

const initSnake = (): Point[] => [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

interface SnakeGameProps {
  onHome?: () => void;
}

export default function SnakeGame({ onHome }: SnakeGameProps) {
  const [snake, setSnake] = useState<Point[]>(initSnake());
  const [food, setFood] = useState<Point>({ x: 15, y: 10 });
  const [dir, setDir] = useState<Direction>("RIGHT");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  const dirRef = useRef<Direction>("RIGHT");
  const snakeRef = useRef<Point[]>(initSnake());
  const foodRef = useRef<Point>({ x: 15, y: 10 });
  const statusRef = useRef<GameStatus>("idle");
  const scoreRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sync refs
  useEffect(() => { dirRef.current = dir; }, [dir]);
  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { foodRef.current = food; }, [food]);
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, BOARD_W, BOARD_H);

    // Grid dots
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        ctx.fillRect(x * CELL + CELL / 2 - 1, y * CELL + CELL / 2 - 1, 2, 2);
      }
    }

    // Food — glowing apple
    const fx = food.x * CELL + CELL / 2;
    const fy = food.y * CELL + CELL / 2;
    const glow = ctx.createRadialGradient(fx, fy, 1, fx, fy, CELL * 0.6);
    glow.addColorStop(0, "#ff4d6d");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(fx, fy, CELL * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff4d6d";
    ctx.beginPath();
    ctx.arc(fx, fy, CELL * 0.36, 0, Math.PI * 2);
    ctx.fill();

    // Snake
    snake.forEach((seg, i) => {
      const sx = seg.x * CELL;
      const sy = seg.y * CELL;
      const pad = i === 0 ? 1 : 2;
      const radius = i === 0 ? 6 : 4;
      const r = CELL - pad * 2;

      if (i === 0) {
        ctx.fillStyle = "#4ade80";
      } else {
        const fade = 1 - (i / snake.length) * 0.55;
        ctx.fillStyle = `rgba(34, 197, 94, ${fade})`;
      }

      ctx.beginPath();
      ctx.roundRect(sx + pad, sy + pad, r, r, radius);
      ctx.fill();

      // Eyes on head
      if (i === 0) {
        ctx.fillStyle = "#0f172a";
        const ex = dir === "LEFT" ? -3 : dir === "RIGHT" ? 3 : 0;
        const ey = dir === "UP" ? -3 : dir === "DOWN" ? 3 : 0;
        const eyeOffset = 3.5;
        if (dir === "LEFT" || dir === "RIGHT") {
          ctx.beginPath();
          ctx.arc(sx + CELL / 2 + ex, sy + CELL / 2 - eyeOffset + ey, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(sx + CELL / 2 + ex, sy + CELL / 2 + eyeOffset + ey, 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(sx + CELL / 2 - eyeOffset + ex, sy + CELL / 2 + ey, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(sx + CELL / 2 + eyeOffset + ex, sy + CELL / 2 + ey, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    // Overlay messages
    if (status === "idle") {
      drawOverlay(ctx, "🐍 SNAKE", "Nhấn Start để chơi");
    } else if (status === "paused") {
      drawOverlay(ctx, "⏸ TẠM DỪNG", "Nhấn Continue để tiếp tục");
    } else if (status === "over") {
      drawOverlay(ctx, "💀 KẾT THÚC", `Điểm: ${score}`);
    }
  }, [snake, food, dir, status, score]);

  function drawOverlay(ctx: CanvasRenderingContext2D, title: string, sub: string) {
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, 0, BOARD_W, BOARD_H);
    ctx.textAlign = "center";
    ctx.fillStyle = "#f1f5f9";
    ctx.font = "bold 28px monospace";
    ctx.fillText(title, BOARD_W / 2, BOARD_H / 2 - 16);
    ctx.font = "14px monospace";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(sub, BOARD_W / 2, BOARD_H / 2 + 14);
  }

  // Game tick
  const tick = useCallback(() => {
    if (statusRef.current !== "playing") return;
    const s = snakeRef.current;
    const d = dirRef.current;
    const head = s[0];

    const next: Point = {
      x: (head.x + (d === "RIGHT" ? 1 : d === "LEFT" ? -1 : 0) + COLS) % COLS,
      y: (head.y + (d === "DOWN" ? 1 : d === "UP" ? -1 : 0) + ROWS) % ROWS,
    };

    // Self collision
    if (s.some((seg) => seg.x === next.x && seg.y === next.y)) {
      setStatus("over");
      statusRef.current = "over";
      setBestScore((b) => Math.max(b, scoreRef.current));
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }

    const ate = next.x === foodRef.current.x && next.y === foodRef.current.y;
    const newSnake = [next, ...s.slice(0, ate ? undefined : s.length - 1)];

    if (ate) {
      const newFood = randomFood(newSnake);
      setFood(newFood);
      foodRef.current = newFood;
      const ns = scoreRef.current + 10;
      setScore(ns);
      scoreRef.current = ns;
    }

    setSnake(newSnake);
  }, []);

  const startGame = () => {
    const s = initSnake();
    const f = randomFood(s);
    setSnake(s);
    snakeRef.current = s;
    setFood(f);
    foodRef.current = f;
    setDir("RIGHT");
    dirRef.current = "RIGHT";
    setScore(0);
    scoreRef.current = 0;
    setStatus("playing");
    statusRef.current = "playing";
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(tick, TICK_MS);
  };

  const pauseGame = () => {
    if (statusRef.current === "playing") {
      setStatus("paused");
      statusRef.current = "paused";
      if (tickRef.current) clearInterval(tickRef.current);
    } else if (statusRef.current === "paused") {
      setStatus("playing");
      statusRef.current = "playing";
      tickRef.current = setInterval(tick, TICK_MS);
    }
  };

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: "UP", ArrowDown: "DOWN", ArrowLeft: "LEFT", ArrowRight: "RIGHT",
        w: "UP", s: "DOWN", a: "LEFT", d: "RIGHT",
      };
      const newDir = map[e.key];
      if (!newDir) return;
      if (statusRef.current !== "playing") return;
      const cur = dirRef.current;
      const opposites: Record<Direction, Direction> = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };
      if (opposites[newDir] !== cur) {
        setDir(newDir);
        dirRef.current = newDir;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Cleanup
  useEffect(() => () => { if (tickRef.current) clearInterval(tickRef.current); }, []);

  const changeDir = (newDir: Direction) => {
    if (statusRef.current !== "playing") return;
    const opposites: Record<Direction, Direction> = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };
    if (opposites[newDir] !== dirRef.current) {
      setDir(newDir);
      dirRef.current = newDir;
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
      padding: "16px",
      fontFamily: "'Courier New', monospace",
      userSelect: "none",
    }}>
      {/* Header */}
      <div style={{ marginBottom: "14px", textAlign: "center" }}>
        <h1 style={{ color: "#4ade80", fontSize: "26px", margin: 0, letterSpacing: "4px", fontWeight: 700 }}>
          🐍 SNAKE
        </h1>
      </div>

      {/* Score bar */}
      <div style={{
        display: "flex", gap: "32px", marginBottom: "12px",
        fontSize: "13px", color: "#94a3b8",
      }}>
        <span>ĐIỂM: <strong style={{ color: "#facc15" }}>{score}</strong></span>
        <span>KỶ LỤC: <strong style={{ color: "#f472b6" }}>{bestScore}</strong></span>
        <span>DÀI: <strong style={{ color: "#67e8f9" }}>{snake.length}</strong></span>
      </div>

      {/* Board + overlay D-pad */}
      <div style={{ position: "relative", display: "inline-block" }}>
        <canvas
          ref={canvasRef}
          width={BOARD_W}
          height={BOARD_H}
          style={{
            display: "block",
            border: "2px solid rgba(74, 222, 128, 0.25)",
            borderRadius: "10px",
            boxShadow: "0 0 40px rgba(74, 222, 128, 0.12)",
          }}
        />

        {/* D-pad overlay (semi-transparent, on canvas) */}
        <div style={{
          position: "absolute",
          bottom: "18px",
          right: "18px",
          display: "grid",
          gridTemplateColumns: "44px 44px 44px",
          gridTemplateRows: "44px 44px 44px",
          gap: "4px",
          opacity: 0.55,
          touchAction: "none",
        }}>
          {/* UP */}
          <div style={{ gridColumn: 2, gridRow: 1 }}>
            <DPadBtn label="▲" onPress={() => changeDir("UP")} />
          </div>
          {/* LEFT */}
          <div style={{ gridColumn: 1, gridRow: 2 }}>
            <DPadBtn label="◀" onPress={() => changeDir("LEFT")} />
          </div>
          {/* CENTER dot */}
          <div style={{
            gridColumn: 2, gridRow: 2,
            background: "rgba(255,255,255,0.08)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
          </div>
          {/* RIGHT */}
          <div style={{ gridColumn: 3, gridRow: 2 }}>
            <DPadBtn label="▶" onPress={() => changeDir("RIGHT")} />
          </div>
          {/* DOWN */}
          <div style={{ gridColumn: 2, gridRow: 3 }}>
            <DPadBtn label="▼" onPress={() => changeDir("DOWN")} />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap", justifyContent: "center" }}>
        {(status === "idle" || status === "over") && (
          <ActionBtn
            label={status === "over" ? "🔄 Chơi lại" : "▶ Bắt đầu"}
            color="#4ade80"
            onClick={startGame}
          />
        )}
        {(status === "playing" || status === "paused") && (
          <ActionBtn
            label={status === "paused" ? "▶ Tiếp tục" : "⏸ Tạm dừng"}
            color="#facc15"
            onClick={pauseGame}
          />
        )}
        {status !== "idle" && (
          <ActionBtn label="⏹ Dừng" color="#f87171" onClick={() => {
            if (tickRef.current) clearInterval(tickRef.current);
            setBestScore((b) => Math.max(b, scoreRef.current));
            setStatus("idle");
          }} />
        )}
        <ActionBtn label="🏠 Home" color="#94a3b8" onClick={() => {
          if (tickRef.current) clearInterval(tickRef.current);
          setBestScore((b) => Math.max(b, scoreRef.current));
          setStatus("idle");
          if (onHome) onHome();
          else globalThis.location.href = "/";
        }} />
      </div>

      {/* Keyboard hint */}
      <p style={{ color: "rgba(148,163,184,0.5)", fontSize: "11px", marginTop: "12px", textAlign: "center" }}>
        Dùng phím ← ↑ → ↓ hoặc WASD · Nút điều hướng hiển thị trên bảng
      </p>
    </div>
  );
}

// ---- Sub-components ----

function DPadBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <button
      onMouseDown={onPress}
      onTouchStart={(e) => { e.preventDefault(); onPress(); }}
      style={{
        width: "100%",
        height: "100%",
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "8px",
        color: "#fff",
        fontSize: "16px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        transition: "background 0.1s",
        padding: 0,
        touchAction: "none",
        WebkitTapHighlightColor: "transparent",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
    >
      {label}
    </button>
  );
}

function ActionBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 24px",
        background: "transparent",
        border: `2px solid ${color}`,
        borderRadius: "8px",
        color,
        fontSize: "14px",
        fontFamily: "'Courier New', monospace",
        fontWeight: 700,
        cursor: "pointer",
        letterSpacing: "1px",
        transition: "background 0.15s, transform 0.1s",
        WebkitTapHighlightColor: "transparent",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = `${color}22`)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {label}
    </button>
  );
}
