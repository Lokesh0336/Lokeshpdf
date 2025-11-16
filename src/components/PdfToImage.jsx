import React, { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

/**
 * Uses pdf.js loaded via CDN in index.html: window['pdfjsLib']
 * Renders each page to canvas and returns a blob (PNG)
 */
async function pdfFileToImages(file, scale = 1.5) {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = window['pdfjsLib'];
  if (!pdfjsLib) throw new Error("pdf.js not loaded. Ensure you included the CDN script in index.html.");
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const images = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    const renderContext = { canvasContext: ctx, viewport };
    await page.render(renderContext).promise;
    const blob = await new Promise((res,rej)=> {
      canvas.toBlob((b)=>{ if(b) res(b); else rej(new Error("toBlob null")); }, "image/png");
    });
    images.push({ blob, pageNum, width: canvas.width, height: canvas.height });
  }
  return images;
}

export default function PdfToImage() {
  const [file, setFile] = useState(null);
  const [scale, setScale] = useState(1.5);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (e) => {
    setError("");
    const f = e.target.files?.[0];
    if (!f) { setFile(null); return; }
    if (f.type !== "application/pdf") { setError("Please select a PDF file."); return; }
    setFile(f);
  };

  const exportImagesZip = async () => {
    if (!file) { setError("Choose a PDF first."); return; }
    setProcessing(true); setError("");
    try {
      const images = await pdfFileToImages(file, Number(scale) || 1.5);
      const zip = new JSZip();
      for (let img of images) {
        zip.file(`page-${img.pageNum}.png`, img.blob);
      }
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${file.name.replace(/\.pdf$/i, '')}-images.zip`);
    } catch (err) {
      console.error(err);
      setError("Failed to convert PDF: " + (err.message || err));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <div className="controls">
        <div className="row">
          <label className="small">Scale (1.0 = normal, 1.5 = higher-res)
            <input type="number" step="0.1" min="0.5" max="3" value={scale} onChange={(e)=>setScale(Number(e.target.value||1.5))} />
          </label>
        </div>

        <div className="row">
          <input type="file" accept="application/pdf" onChange={handleFile} />
        </div>

        <div className="row" style={{ marginTop: 6 }}>
          <button className="primary" onClick={exportImagesZip} disabled={processing || !file}>{processing ? "Working..." : "Export pages as images (zip)"}</button>
          <button className="ghost small" onClick={()=>{ setFile(null); setError(""); }} style={{ marginLeft:8 }}>Clear</button>
        </div>
      </div>

      {error && <div className="notice" style={{ color: "crimson" }}>{error}</div>}

      <div style={{ marginTop: 12 }}>
        {file ? <div><strong>Selected:</strong> {file.name} — {(file.size/1024).toFixed(1)} KB</div> : <div className="notice">No PDF selected.</div>}
        <div className="notice" style={{ marginTop:8 }}>Tip: Increase scale for higher-resolution images but processing will take longer and use more memory.</div>
      </div>
    </div>
  );
}
