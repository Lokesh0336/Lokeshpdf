import React, { useState } from "react";
import ImageToPdf from "./components/ImageToPdf";
import ImageResizer from "./components/ImageResizer";
import PdfToImage from "./components/PdfToImage";
import "./index.css";

/* Put your real Instagram profile here */
const INSTAGRAM_URL = "https://www.instagram.com/lokesh_ragutla96/?igsh=ZHY2ZmcyZG1leGRh#";

/* Logo PNG you gave (we use it directly as an external image). */
const LOGO_SRC = "https://www.citypng.com/public/uploads/preview/hd-pdf-file-document-black-icon-png-701751695035299dspnijtzoi.png";

export default function App() {
  const tabs = [
    { id: "img2pdf", label: "Image → PDF" },
    { id: "resizer", label: "Image Resizer" },
    { id: "pdf2img", label: "PDF → Image" }
  ];
  const [active, setActive] = useState("img2pdf");

  return (
    <div className="container">
      {/* Header top with logo, brand and small top credit */}
      <div className="header-top" role="banner">
        <div className="brand-left">
          <div className="logo-wrap" aria-hidden="true">
            <img src={LOGO_SRC} alt="PDFStudio logo" className="logo-img" />
          </div>
          <div className="brand-text">
            <div className="brand-title">PDFStudio</div>
            <div className="brand-sub">Image & PDF toolbox — fast • private • browser-first</div>
          </div>
        </div>

        <div className="header-right">
          <div className="credit-top" aria-hidden="true">
            <span>Created with <span className="heart">♥</span> by</span>
            <strong style={{fontSize:13}}>LOKESH.R</strong>
          </div>

          <a className="connect-btn" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Connect with us on Instagram">
            <svg viewBox="0 0 24 24" fill="currentColor" style={{width:16,height:16}}>
              <path d="M7 2C4.238 2 2 4.238 2 7v10c0 2.762 2.238 5 5 5h10c2.762 0 5-2.238 5-5V7c0-2.762-2.238-5-5-5H7zm0 2h10a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3zm5 3.5A4.5 4.5 0 107 12.5 4.505 4.505 0 0012 7.5zm0 2A2.5 2.5 0 1112 12a2.503 2.503 0 010-5zM18.5 6a.9.9 0 110 1.8.9.9 0 010-1.8z"/>
            </svg>
            <span style={{marginLeft:6}}>Connect</span>
          </a>
        </div>
      </div>

      {/* Hero */}
      <section className="hero" aria-label="Welcome">
        <div className="hero-left">
          <h1>Welcome to PDFStudio</h1>
          <p>Convert images to PDFs, extract pages as images, resize photos — quickly and privately in your browser. No uploads, no accounts.</p>
          <div className="hero-cta">
            <button className="primary" onClick={() => setActive("img2pdf")}>Get Started</button>
            <button className="ghost" onClick={() => setActive("resizer")}>Try Image Resizer</button>
          </div>
        </div>

        <div className="hero-illustration" aria-hidden="true">
          <img src={LOGO_SRC} alt="PDFStudio illustration" style={{width:96,height:96,opacity:0.95}} />
        </div>
      </section>

      {/* Quick dashboard cards */}
      <section className="grid" aria-label="Tools dashboard">
        <div className="card">
          <h3>Image → PDF</h3>
          <p>Combine multiple images into a single PDF. Control size and quality. Works offline in your browser.</p>
          <div className="card-actions">
            <button className="primary" onClick={() => setActive("img2pdf")}>Open Tool</button>
            <button className="ghost">Documentation</button>
          </div>
        </div>

        <div className="card">
          <h3>Image Resizer</h3>
          <p>Resize and reformat images (JPEG/PNG). Download individual files or a ZIP of all results.</p>
          <div className="card-actions">
            <button className="primary" onClick={() => setActive("resizer")}>Open Tool</button>
            <button className="ghost">Documentation</button>
          </div>
        </div>

        <div className="card">
          <h3>PDF → Image</h3>
          <p>Export PDF pages to PNG/JPG. Preview pages and download them individually or all at once.</p>
          <div className="card-actions">
            <button className="primary" onClick={() => setActive("pdf2img")}>Open Tool</button>
            <button className="ghost">Documentation</button>
          </div>
        </div>
      </section>

      {/* Main tool area */}
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
          <div className="panel">
            <h4>Quick tips</h4>
            <div style={{ color: "var(--muted)" }}>
              <ul style={{ marginLeft: 16 }}>
                <li>Files are processed locally in your browser — nothing is uploaded.</li>
                <li>Use JPG for smaller files and PNG for lossless quality.</li>
                <li>For print-quality PDFs, set max width ≥ 1200 px.</li>
              </ul>
            </div>

            <div style={{ marginTop: 12 }}>
              <h4>Contact</h4>
              <div style={{ color: "var(--muted)", marginTop: 6 }}>
                Follow on Instagram or email for feedback and updates.
              </div>
              <div style={{ marginTop: 10 }}>
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="connect-btn">Instagram</a>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="footer" role="contentinfo">
        <div>© {new Date().getFullYear()} PDFStudio — All rights reserved</div>
        <div className="credit">Created with <span className="heart">♥</span> by <strong>LOKESH.R</strong></div>
      </footer>
    </div>
  );
}
