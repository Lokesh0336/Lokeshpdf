import React, { useState } from "react";
import { saveAs } from "file-saver";

/**
 * Uses pdf.js loaded via CDN in index.html (window['pdfjsLib']).
 * Renders each PDF page to a canvas and returns canvas elements.
 */
async function renderPdfToCanvases(file, scale = 1.5) {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = window['pdfjsLib'];
  if (!pdfjsLib) throw new Error("pdf.js not loaded. Ensure you included the CDN script in index.html.");
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const canvases = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");
    const renderContext = { canvasContext: ctx, viewport };
    await page.render(renderContext).promise;
    canvases.push({ canvas, pageNum });
  }
  return canvases;
}

/** Convert a canvas to a blob in desired mime (png/jpeg) and quality */
function canvasToBlob(canvas, mime = "image/png", quality = 0.92) {
  return new Promise((resolve, reject) => {
    // For JPEG quality param applies; PNG ignores quality.
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error("Canvas toBlob returned null"));
    }, mime, quality);
  });
}

/** Convenience: create a small dataURL thumbnail from canvas (for fast preview) */
function canvasToDataUrl(canvas, maxWidth = 240) {
  const ratio = Math.min(1, maxWidth / canvas.width);
  const w = Math.round(canvas.width * ratio);
  const h = Math.round(canvas.height * ratio);
  const tmp = document.createElement("canvas");
  tmp.width = w;
  tmp.height = h;
  tmp.getContext("2d").drawImage(canvas, 0, 0, w, h);
  return tmp.toDataURL("image/png");
}

export default function PdfToImage() {
  const [file, setFile] = useState(null);
  const [scale, setScale] = useState(1.5);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [pages, setPages] = useState([]); // { pageNum, canvas, thumb }
  const [format, setFormat] = useState("image/png"); // or image/jpeg
  const [jpegQuality, setJpegQuality] = useState(0.92);

  const handleFile = (e) => {
    setError("");
    setPages([]);
    const f = e.target.files?.[0];
    if (!f) { setFile(null); return; }
    if (f.type !== "application/pdf") { setError("Please select a PDF file."); return; }
    setFile(f);
  };

  const loadPages = async () => {
    if (!file) { setError("Choose a PDF first."); return; }
    setError("");
    setProcessing(true);
    setPages([]);
    try {
      const canvases = await renderPdfToCanvases(file, Number(scale) || 1.5);
      const pageItems = canvases.map(({ canvas, pageNum }) => ({
        pageNum,
        canvas,
        thumb: canvasToDataUrl(canvas, 320)
      }));
      setPages(pageItems);
    } catch (err) {
      console.error(err);
      setError("Failed to render PDF: " + (err.message || err));
    } finally {
      setProcessing(false);
    }
  };

  const downloadPage = async (pageItem) => {
    try {
      const mime = format;
      const q = mime === "image/png" ? 1.0 : Number(jpegQuality) || 0.92;
      const blob = await canvasToBlob(pageItem.canvas, mime, q);
      const ext = mime === "image/png" ? "png" : "jpg";
      saveAs(blob, `${file?.name.replace(/\.pdf$/i, '')}-page-${pageItem.pageNum}.${ext}`);
    } catch (err) {
      console.error(err);
      setError("Failed to download page: " + (err.message || err));
    }
  };

  const downloadAll = async () => {
    if (!pages.length) { setError("No pages to download. Click Render pages first."); return; }
    setError("");
    try {
      // Sequential downloads to avoid overwhelming the browser
      for (let i = 0; i < pages.length; i++) {
        await downloadPage(pages[i]);
        // small delay so browsers handle dialogs more reliably
        await new Promise((res) => setTimeout(res, 300));
      }
    } catch (err) {
      console.error(err);
      setError("Failed during download all: " + (err.message || err));
    }
  };

  const clearAll = () => {
    setFile(null);
    setPages([]);
    setError("");
  };

  return (
    <div>
      <div className="controls">
        <div className="row">
          <label className="small">
            Scale (1.0 = normal, 1.5 = higher-res)
            <input type="number" step="0.1" min="0.5" max="3" value={scale} onChange={(e) => setScale(Number(e.target.value || 1.5))} />
          </label>

          <label className="small">
            Format
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="image/png">PNG (lossless)</option>
              <option value="image/jpeg">JPG (smaller)</option>
            </select>
          </label>

          {format === "image/jpeg" && (
            <label className="small">
              JPG quality (0.1 - 1)
              <input type="number" step="0.05" min="0.1" max="1" value={jpegQuality} onChange={(e) => setJpegQuality(Number(e.target.value || 0.92))} />
            </label>
          )}
        </div>

        <div className="row">
          <input type="file" accept="application/pdf" onChange={handleFile} />
        </div>

        <div className="row" style={{ marginTop: 6 }}>
          <button className="primary" onClick={loadPages} disabled={processing || !file}>
            {processing ? "Rendering..." : "Render pages"}
          </button>

          <button className="ghost small" onClick={clearAll} style={{ marginLeft: 8 }}>
            Clear
          </button>

          <button className="primary" onClick={downloadAll} disabled={!pages.length} style={{ marginLeft: 8 }}>
            Download All Pages
          </button>
        </div>
      </div>

      {error && <div className="notice" style={{ color: "crimson" }}>{error}</div>}

      <div style={{ marginTop: 12 }}>
        {file ? <div><strong>Selected:</strong> {file.name} — {(file.size / 1024).toFixed(1)} KB</div> : <div className="notice">No PDF selected.</div>}
      </div>

      <div style={{ marginTop: 12 }}>
        {pages.length === 0 ? (
          <div className="notice" style={{ marginTop: 12 }}>No pages rendered yet. Click <strong>Render pages</strong>.</div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Pages</div>
            <div className="preview-row" aria-live="polite">
              {pages.map((p) => (
                <div key={p.pageNum} className="preview-card" style={{ width: 220 }}>
                  <img src={p.thumb} alt={`page-${p.pageNum}`} className="preview" style={{ height: 140 }} />
                  <div className="file-name">Page {p.pageNum}</div>
                  <div style={{ display: "flex", gap: 8, width: "100%", marginTop: 6 }}>
                    <button className="small" onClick={() => downloadPage(p)}>Download</button>
                    <button className="small" onClick={() => {
                      // open full-size image in new tab for quick save/view
                      const mime = format;
                      const q = mime === "image/png" ? 1.0 : Number(jpegQuality) || 0.92;
                      canvasToBlob(p.canvas, mime, q).then(blob => {
                        const url = URL.createObjectURL(blob);
                        window.open(url, "_blank");
                        // revoke after a while
                        setTimeout(() => URL.revokeObjectURL(url), 30000);
                      }).catch(err => setError("Failed to open image: " + (err.message || err)));
                    }}>Open</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="notice" style={{ marginTop: 12 }}>
        Note: <strong>Download All</strong> triggers a series of individual downloads (browser will ask to save each file). This is the default behavior without zipping.
      </div>
    </div>
  );
}
