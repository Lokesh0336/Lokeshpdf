import React, { useState } from "react";
import ImageToPdf from "./components/ImageToPdf";
import ImageResizer from "./components/ImageResizer";
import PdfToImage from "./components/PdfToImage";
import "./index.css";

/* Replace with your real Instagram URL */
const INSTAGRAM_URL = "https://www.instagram.com/your_instagram_here";

export default function App() {
  const tabs = [
    { id: "img2pdf", label: "Image → PDF" },
    { id: "resizer", label: "Image Resizer" },
    { id: "pdf2img", label: "PDF → Image" }
  ];
  const [active, setActive] = useState("img2pdf");

  return (
    <div className="container">
      {/* Top header with brand + connect link */}
      <div className="topbar" role="banner">
        <div className="brand">
          <div className="logo">PS</div>
          <div className="brand-text">
            <div className="brand-title">PDFStudio</div>
            <div className="brand-sub">Image & PDF toolbox — fast • private • browser-first</div>
          </div>
        </div>

        <div className="connect">
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Connect with us on Instagram">
            {/* Instagram SVG */}
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{display:"inline-block"}}>
              <path d="M7 2C4.238 2 2 4.238 2 7v10c0 2.762 2.238 5 5 5h10c2.762 0 5-2.238 5-5V7c0-2.762-2.238-5-5-5H7zm0 2h10a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3zm5 3.5A4.5 4.5 0 107 12.5 4.505 4.505 0 0012 7.5zm0 2A2.5 2.5 0 1112 12a2.503 2.503 0 010-5zM18.5 6a.9.9 0 110 1.8.9.9 0 010-1.8z"/>
            </svg>
            <span>Connect with us</span>
          </a>
        </div>
      </div>

      {/* Hero / Welcome */}
      <section className="hero" role="region" aria-label="Welcome">
        <div className="hero-left">
          <h1>Welcome to PDFStudio</h1>
          <p>All-in-one image & PDF tools: convert images to PDF, extract images from PDFs, resize photos — everything runs right in your browser. No uploads. No servers.</p>
          <div style={{ marginTop: 12 }}>
            <button className="btn-primary" onClick={() => setActive("img2pdf")}>Get started — Image → PDF</button>
            <button className="btn-ghost" style={{ marginLeft: 10 }} onClick={() => setActive("resizer")}>Open Image Resizer</button>
          </div>
        </div>
        <div style={{ width: 160, textAlign: "center" }}>
          <img src="https://img.icons8.com/ios-filled/96/2563eb/file-pdf.png" alt="PDF icon" style={{ width: 96, height: 96, opacity: 0.95 }} />
          <div style={{ color: "var(--muted)", marginTop: 8, fontSize: 13 }}>Fast. Private. Offline.</div>
        </div>
      </section>

      {/* Dashboard quick cards */}
      <section className="grid" aria-label="Dashboard">
        <div className="card">
          <h3>Image → PDF</h3>
          <p>Combine multiple images into a single PDF. Control size & quality. Private processing in your browser.</p>
          <div className="cta">
            <button className="btn-primary" onClick={() => setActive("img2pdf")}>Open Tool</button>
            <button className="btn-ghost">Learn more</button>
          </div>
        </div>

        <div className="card">
          <h3>Image Resizer</h3>
          <p>Resize and reformat images (JPEG/PNG). Download single images or a ZIP of all results.</p>
          <div className="cta">
            <button className="btn-primary" onClick={() => setActive("resizer")}>Open Tool</button>
            <button className="btn-ghost">Learn more</button>
          </div>
        </div>

        <div className="card">
          <h3>PDF → Image</h3>
          <p>Extract pages as PNG/JPG images. Preview pages and download individually or all at once.</p>
          <div className="cta">
            <button className="btn-primary" onClick={() => setActive("pdf2img")}>Open Tool</button>
            <button className="btn-ghost">Learn more</button>
          </div>
        </div>
      </section>

      {/* Main tool area (tabs + tool) */}
      <main className="card-main" role="main">
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

        <aside className="right" aria-label="Help & Tips">
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Quick tips</div>
          <div style={{ color: "var(--muted)" }}>
            <ul style={{ marginLeft: 16 }}>
              <li>Files are processed in your browser — they do not leave your device.</li>
              <li>For print PDFs, set max width ≥ 1200 px.</li>
              <li>Use JPG for smaller files and PNG for lossless quality.</li>
            </ul>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 700 }}>Connect</div>
            <div style={{ color: "var(--muted)", marginTop: 8 }}>
              Follow us on Instagram for updates & tips.
            </div>
            <div style={{ marginTop: 10 }}>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="connect" style={{ textDecoration: "none" }}>
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
                  <path d="M7 2C4.238 2 2 4.238 2 7v10c0 2.762 2.238 5 5 5h10c2.762 0 5-2.238 5-5V7c0-2.762-2.238-5-5-5H7zm0 2h10a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3zm5 3.5A4.5 4.5 0 107 12.5 4.505 4.505 0 0012 7.5zm0 2A2.5 2.5 0 1112 12a2.503 2.503 0 010-5zM18.5 6a.9.9 0 110 1.8.9.9 0 010-1.8z"/>
                </svg>
                <span style={{ marginLeft: 8, color: "var(--accent)", fontWeight: 600 }}>@your_instagram_here</span>
              </a>
            </div>
          </div>
        </aside>
      </main>

      {/* footer */}
      <footer className="footer" role="contentinfo">
        <div>© {new Date().getFullYear()} PDFStudio — All rights reserved</div>
        <div className="credit">Created with <span className="heart">♥</span> by <strong>LOKESH.R</strong></div>
      </footer>
    </div>
  );
}
