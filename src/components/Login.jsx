import { Button, Box, Typography } from "@mui/material";
import { supabase } from "../lib/supabase";
import { useEffect, useRef } from "react";

export default function Login() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animFrame;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const DOTS = Array.from({ length: 90 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      DOTS.forEach((d) => {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
        if (d.y < 0 || d.y > canvas.height) d.vy *= -1;
      });

      for (let i = 0; i < DOTS.length; i++) {
        for (let j = i + 1; j < DOTS.length; j++) {
          const dx = DOTS[i].x - DOTS[j].x;
          const dy = DOTS[i].y - DOTS[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(196,160,90,${0.12 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(DOTS[i].x, DOTS[i].y);
            ctx.lineTo(DOTS[j].x, DOTS[j].y);
            ctx.stroke();
          }
        }
        ctx.beginPath();
        ctx.arc(DOTS[i].x, DOTS[i].y, DOTS[i].r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(196,160,90,0.55)";
        ctx.fill();
      }

      animFrame = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: "https://deveshk1.github.io/interview-prep-ai/",
      },
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Mono:wght@300;400&display=swap');

        .login-root {
          min-height: 100vh;
          background: #0b0d14;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .login-canvas {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .login-card {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          text-align: center;
          padding: 60px 56px 52px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(196,160,90,0.2);
          border-radius: 4px;
          backdrop-filter: blur(18px);
          max-width: 420px;
          width: 90%;
          animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .login-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #c4a05a;
          margin-bottom: 18px;
        }

        .login-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: clamp(2.4rem, 6vw, 3.4rem);
          line-height: 1.1;
          color: #f0ece2;
          margin-bottom: 12px;
          letter-spacing: -0.01em;
        }

        .login-title em {
          font-style: italic;
          color: #c4a05a;
        }

        .login-sub {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          color: rgba(240,236,226,0.4);
          letter-spacing: 0.05em;
          margin-bottom: 44px;
          line-height: 1.7;
        }

        .login-divider {
          width: 32px;
          height: 1px;
          background: rgba(196,160,90,0.35);
          margin: 0 auto 44px;
        }

        .github-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 32px;
          background: transparent;
          border: 1px solid rgba(196,160,90,0.55);
          border-radius: 3px;
          color: #f0ece2;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.25s, border-color 0.25s, transform 0.2s;
          width: 100%;
          justify-content: center;
        }

        .github-btn:hover {
          background: rgba(196,160,90,0.1);
          border-color: #c4a05a;
          transform: translateY(-1px);
        }

        .github-btn:active {
          transform: translateY(0);
        }

        .login-footer {
          margin-top: 28px;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: rgba(240,236,226,0.2);
          letter-spacing: 0.08em;
        }

        .corner-ornament {
          position: absolute;
          width: 12px;
          height: 12px;
          border-color: rgba(196,160,90,0.5);
          border-style: solid;
        }
        .corner-ornament.tl { top: -1px; left: -1px; border-width: 1px 0 0 1px; }
        .corner-ornament.tr { top: -1px; right: -1px; border-width: 1px 1px 0 0; }
        .corner-ornament.bl { bottom: -1px; left: -1px; border-width: 0 0 1px 1px; }
        .corner-ornament.br { bottom: -1px; right: -1px; border-width: 0 1px 1px 0; }
      `}</style>

      <div className="login-root">
        <canvas ref={canvasRef} className="login-canvas" />

        <div className="login-card">
          <div className="corner-ornament tl" />
          <div className="corner-ornament tr" />
          <div className="corner-ornament bl" />
          <div className="corner-ornament br" />

          <p className="login-eyebrow">AI-Powered · Career Tool</p>

          <h1 className="login-title">
            Interview<br /><em>Prep AI</em>
          </h1>

          <p className="login-sub">
            Personalized interview roadmaps<br />generated in seconds.
          </p>

          <div className="login-divider" />

          <button className="github-btn" onClick={signIn}>
            <svg height="18" width="18" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
              0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
              -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66
              .07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15
              -.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27
              .68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12
              .51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48
              0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Continue with GitHub
          </button>

          <p className="login-footer">Secured via GitHub OAuth · No password stored</p>
        </div>
      </div>
    </>
  );
}