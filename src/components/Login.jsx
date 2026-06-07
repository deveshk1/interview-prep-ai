import { Button, Box, Typography } from "@mui/material";
import { supabase } from "../lib/supabase";
import { useEffect, useRef } from "react";

export default function Login() {
  const signIn = async () => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const redirectUrl = isLocal 
      ? `http://${window.location.host}/` 
      : 'https://deveshk1.github.io/interview-prep-ai/';
    
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: redirectUrl,
      },
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .login-root {
          min-height: 100vh;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background-image: 
            radial-gradient(circle at 2px 2px, #f1f5f9 1px, transparent 0);
          background-size: 32px 32px;
        }

        .login-card {
          width: 100%;
          max-width: 440px;
          padding: 48px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 32px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.05);
          text-align: center;
          animation: fadeUp 0.6s ease-out;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-logo {
          font-weight: 800;
          font-size: 24px;
          letter-spacing: -0.04em;
          margin-bottom: 32px;
          color: #0f172a;
        }

        .login-logo span {
          color: #2563eb;
        }

        .login-title {
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.03em;
          line-height: 1.2;
          margin-bottom: 12px;
        }

        .login-sub {
          font-size: 16px;
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 40px;
        }

        .github-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 16px;
          background: #0f172a;
          color: #ffffff;
          border: none;
          border-radius: 16px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s, background 0.2s;
        }

        .github-btn:hover {
          background: #1e293b;
          transform: translateY(-1px);
        }

        .github-btn:active {
          transform: translateY(0);
        }

        .login-footer {
          margin-top: 32px;
          font-size: 13px;
          color: #94a3b8;
        }

        .badge {
          display: inline-block;
          padding: 4px 12px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 12px;
          font-weight: 700;
          border-radius: 100px;
          margin-bottom: 16px;
        }
      `}</style>

      <div className="login-root">
        <div className="login-card">
          <div className="badge">Beta Access</div>
          <div className="login-logo">Interview<span>Prep</span></div>
          <h1 className="login-title">Your AI technical interview coach.</h1>
          <p className="login-sub">Get personalized roadmaps, top questions, and preparation plans for any role.</p>
          
          <button className="github-btn" onClick={signIn}>
            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
              0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
              -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66
              .07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15
              -.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27
              .68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12
              .51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48
              0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Sign in with GitHub
          </button>

          <p className="login-footer">Secure authentication powered by Supabase</p>
        </div>
      </div>
    </>
  );
}