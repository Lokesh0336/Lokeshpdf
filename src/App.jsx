import React, { useState } from "react";
import ImageToPdf from "./components/ImageToPdf";
import ImageResizer from "./components/ImageResizer";
import PdfToImage from "./components/PdfToImage";
import "./index.css";

export default function App() {
  const tabs = [
    { id: "img2pdf", label: "Image → PDF" },
    { id: "resizer", label: "Image Resizer" },
    { id: "pdf2img", label: "PDF → Image" }
  ];
  const [active, setActive] = useState("img2pdf");

  return (
    <div className="container">
      <header className="header" role="banner">
        <div className="brand">
          <div className="logo">IP</div>
          <div>
            <div className="title">Image Toolbox</div>
            <div className="subtitle">Image → PDF • Image Resizer • PDF → Image — all in your browser</div>
          </div>
        </div>
        <div className="subtitle">No uploads • Privacy-first • Instant download</div>
      </header>

      <main>
        <div className="card" role="main">
          <div className="left">
            <div className="tabs" role="tablist" aria-label="Tool tabs">
              {tabs.map(t => (
                <button
                  key={t.id}
                  className={`tab ${active === t.id ? "active" : ""}`}
                  onClick={() => setActive(t.id)}
                  role="tab"
                  aria-selected={active === t.id}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 10 }}>
              {active === "img2pdf" && <ImageToPdf />}
              {active === "resizer" && <ImageResizer />}
              {active === "pdf2img" && <PdfToImage />}
            </div>
          </div>

          <aside className="right">
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Quick tips</div>
            <div style={{ color: "var(--muted)", marginBottom: 8 }}>
              <ul style={{ marginLeft: 16 }}>
                <li>All conversions happen locally in your browser.</li>
                <li>For print-quality PDFs use max width ≥ 1200 px.</li>
                <li>Large files may take time — wait for processing to finish.</li>
              </ul>
            </div>
            <div style={{ fontWeight: 700, marginTop: 12 }}>Support</div>
            <div style={{ color: "var(--muted)" }}>
              Need re-ordering, EXIF rotation fix, or drag & drop? Tell me and I’ll add it.
            </div>
          </aside>
        </div>

        <div className="footer">© {new Date().getFullYear()} YourName · Built with React · Hosted on Netlify</div>
      </main>
    </div>
  );
}
