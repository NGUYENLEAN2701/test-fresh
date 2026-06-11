import { useSignal } from "@preact/signals";
import SnakeGame from "./SnakeGame.tsx";

export default function HomeController() {
    const showGame = useSignal(false);

    return (
        <div>
            {/* ── HOME ── */}
            <div
                style={{
                    display: showGame.value ? "none" : "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100vh",
                    padding: "32px 16px",
                    fontFamily: "sans-serif",
                    background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
                }}
            >
                <img
                    src="/logo.svg"
                    width="128"
                    height="128"
                    alt="Fresh logo"
                    style={{ marginBottom: "24px" }}
                />
                <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "8px", color: "#f1f5f9", textAlign: "center" }}>
                    <a
                        href="https://www.facebook.com/groups/1322354869876694"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: "#4ade80",
                            textDecoration: "none",
                            display: "flex",
                            flexWrap: "wrap",
                            justifyContent: "center",
                            gap: "0 8px",
                        }}
                    >
                        <span style={{ whiteSpace: "nowrap" }}>Welcome to Cà Mau</span>
                        <span style={{ whiteSpace: "nowrap" }}>thích lập trình</span>
                    </a>
                </h1>
                <p style={{
                    color: "#64748b",
                    textAlign: "center", 
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: "0 8px",
                }}>
                    <span style={{ whiteSpace: "nowrap" }}>Một dự án Fresh + Deno</span>
                    <span style={{ whiteSpace: "nowrap" }}>đang chạy trên Deno Deploy.</span>
                </p>
                <p style={{
                    color: "#64748b", 
                    textAlign: "center", 
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: "0 8px",
                    marginBottom: "40px",
                }}>
                    <span style={{ whiteSpace: "nowrap" }}>Tôi là Green Wolf,</span>
                    <span style={{ whiteSpace: "nowrap" }}>tôi đã thay đổi toàn bộ.</span>
                </p>
                

                <button
                    onClick={() => { showGame.value = true; }}
                    style={{
                        padding: "14px 40px",
                        fontSize: "18px",
                        fontWeight: 700,
                        background: "linear-gradient(135deg, #4ade80, #22c55e)",
                        color: "#0f172a",
                        border: "none",
                        borderRadius: "12px",
                        cursor: "pointer",
                        letterSpacing: "1px",
                        boxShadow: "0 4px 24px rgba(74,222,128,0.35)",
                    }}
                >
                    🎮 PLAY SNAKE GAME
                </button>
            </div>

            {/* ── SNAKE GAME ── */}
            <div style={{ display: showGame.value ? "block" : "none" }}>
                <SnakeGame onHome={() => { showGame.value = false; }} />
            </div>
        </div>
    );
}
