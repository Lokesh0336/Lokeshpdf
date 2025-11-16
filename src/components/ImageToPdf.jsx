import React, { useState } from "react";
import { jsPDF } from "jspdf";

function resizeImageBlob(file, maxWidth = 1024, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const ratio = img.width / img.height || 1;
        const width = img.width > maxWidth ? maxWidth : img.width;
        const height = Math.round(width / ratio);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
        const q = mime === "image/png" ? 1.0 : Math.max(0.05, Number(quality));

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (!blob) return reject(new Error("Canvas toBlob returned null"));
            resolve({ blob, mime });
          },
          mime,
          q
        );
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load error"));
    };
    img.src = url;
  });
}

function blobToDataURL(blob) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = (ev) => res(ev.target.result);
    reader.onerror = (e) => rej(e);
    reader.readAsDataURL(blob);
  });
}

export default function ImageToPdf() {
  const [files, setFiles] = useState([]);
  const [maxWidth, setMaxWidth] = useState(1200);
  const [quality, setQuality] = useState(0.85);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = (e) => {
    setError("");
    const chosen = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (!chosen.length) {
      setError("No image files selected.");
      return;
    }
    if (chosen.length > 40) {
      setError("Please select up to 40 images at once.");
      chosen.length = 40;
    }
    setFiles(chosen);
  };

  const removeFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const makePdf = async () => {
    if (!files.length) {
      setError("Choose images first.");
      return;
    }
    setError("");
    setProcessing(true);
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { blob, mime } = await resizeImageBlob(file, Number(maxWidth), Number(quality));
        const dataUrl = await blobToDataURL(blob);

        const img = new Image();
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
          img.src = dataUrl;
        });

        const iw = img.width;
        const ih = img.height;
        const ratio = Math.min(pageW / iw, pageH / ih, 1);
        const drawW = iw * ratio;
        const drawH = ih * ratio;
        const x = (pageW - drawW) / 2;
        const y = (pageH - drawH) / 2;

        if (i > 0) pdf.addPage();
        const fmt = mime === "image/png" ? "PNG" : "JPEG";
        pdf.addImage(dataUrl, fmt, x, y, drawW, drawH);
      }

      pdf.save("images-to-pdf.pdf");
    } catch (err) {
      console.error(err);
      setError("Failed to create PDF. " + (err.message || err));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <div className="controls" aria-live="polite">
        <div className="row">
          <label className="small">
            Max width (px)
            <input
              type="number"
              value={maxWidth}
              onChange={(e) => setMaxWidth(Number(e.target.value || 1200))}
              min="200"
            />
          </label>

          <label className="small">
            Quality (JPEG 0.1 - 1)
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="1"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value || 0.85))}
            />
          </label>
        </div>

        <div className="row">
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            aria-label="Select images"
          />
        </div>

        <div className="row" style={{ marginTop: 6 }}>
          <button className="primary" onClick={makePdf} disabled={processing || !files.length}>
            {processing ? "Processing..." : "Download PDF"}
          </button>
          <button className="ghost small" onClick={() => { setFiles([]); setError(""); }} style={{ marginLeft: 8 }}>
            Clear
          </button>
        </div>
      </div>

      {error && <div className="notice" role="status" style={{ color: "crimson" }}>{error}</div>}

      <div style={{ marginTop: 14 }}>
        <strong style={{ display: "block", marginBottom: 8 }}>Selected images</strong>
        {files.length === 0 ? (
          <div className="notice">No images selected yet.</div>
        ) : (
          <div className="preview-row" aria-live="polite">
            {files.map((f, i) => {
              const url = URL.createObjectURL(f);
              return (
                <div key={i} className="preview-card" title={f.name}>
                  <img src={url} alt={f.name} className="preview" />
                  <div className="file-name">{f.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{(f.size / 1024).toFixed(1)} KB</div>
                  <div style={{ width: "100%", display: "flex", gap: 8 }}>
                    <button className="small" onClick={() => removeFile(i)}>Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
