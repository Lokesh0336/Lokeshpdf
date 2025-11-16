import React from "react";
import ImageToPdf from "./components/ImageToPdf";
import "./index.css";

export default function App() {
  return (
    <div className="container">
      <header className="header" role="banner">
        <div className="brand">
          <div className="logo">IP</div>
          <div>
            <div className="title">Image → PDF</div>
            <div className="subtitle">Convert images to a single PDF — fast, private, and in your browser.</div>
          </div>
        </div>
        <div className="subtitle">No uploads • Privacy-first • Instant download</div>
      </header>

      <main>
        <div className="card" role="main">
          <div className="left">
            <ImageToPdf />
          </div>

          <aside className="right">
            <div style={{ fontWeight: 700, marginBottom: 8 }}>How it works</div>
            <ol style={{ color: "var(--muted)", marginLeft: 16 }}>
              <li>Select images (JPG/PNG).</li>
              <li>Adjust Max width & quality (optional).</li>
              <li>Click <strong>Download PDF</strong> — file is generated in your browser.</li>
            </ol>

            <div style={{ marginTop: 18, fontWeight: 700 }}>Pro tips</div>
            <ul style={{ color: "var(--muted)", marginLeft: 16 }}>
              <li>Use max width 1200 for sharper print PDFs.</li>
              <li>Set quality 0.8 for good compression with clarity.</li>
              <li>If images are rotated, tell me — I’ll add EXIF auto-rotate.</li>
            </ul>
          </aside>
        </div>

        <div className="footer">© {new Date().getFullYear()} YourName · Built with React · Hosted on Netlify</div>
      </main>
    </div>
  );
}
