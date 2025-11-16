import React, { useState } from "react";
import { jsPDF } from "jspdf";

/**
 * Resize image file using canvas and returns a blob (JPEG by default).
 * Keeps aspect ratio and limits width to maxWidth.
 */
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

        // Choose output type: preserve PNG if source is PNG, otherwise use JPEG
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
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load error"));
    };
    img.src = url;
  });
}

/** Convert blob to dataURL (base64) */
function blobToDataURL(blob) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = (ev) => res(ev.target.result);
    reader.onerror = (e) => rej(e);
    reader.readAsDataURL(blob);
  });
}

export default function ImageToPdf() {
  const [files, setFiles] = useState([]); // File objects
  const [maxWidth, setMaxWidth] = useState(1024);
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
    // small validation: limit to 30 files to avoid memory blow
    if (chosen.length > 30) {
      setError("Please select up to 30 images at once.");
      chosen.length = 30;
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
      // Use px units — jsPDF supports 'px'. We use A4 page size in px.
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Resize and get blob + mime
        const { blob, mime } = await resizeImageBlob(file, Number(maxWidth), Number(quality));
        const dataUrl = await blobToDataURL(blob);

        // ensure image is loaded to get its pixel size
        const img = new Image();
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
          img.src = dataUrl;
        });

        const iw = img.width;
        const ih = img.height;
        // Fit inside page while preserving ratio
        const ratio = Math.min(pageW / iw, pageH / ih, 1);
        const drawW = iw * ratio;
        const drawH = ih * ratio;
        const x = (pageW - drawW) / 2;
        const y = (pageH - drawH) / 2;

        if (i > 0) pdf.addPage();
        // image format argument expects 'JPEG' or 'PNG'
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
    <div className="container">
      <h2>Image → PDF (client-side)</h2>

      <div className="controls">
        <label>
          Max width (px):
          <input
            type="number"
            value={maxWidth}
            onChange={(e) => setMaxWidth(Number(e.target.value || 1024))}
            style={{ width: 120, marginLeft: 8 }}
          />
        </label>

        <label>
          Quality (0.1 - 1, JPEG only):
          <input
            type="number"
            step="0.05"
            min="0.1"
            max="1"
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value || 0.85))}
            style={{ width: 90, marginLeft: 8 }}
          />
        </label>

        <div>
          <input type="file" accept="image/*" multiple onChange={handleFiles} />
        </div>
      </div>

      <div>
        <button onClick={makePdf} disabled={processing || !files.length}>
          {processing ? "Processing..." : "Download PDF from images"}
        </button>
        <button
          onClick={() => { setFiles([]); setError(""); }}
          style={{ marginLeft: 8 }}
          className="small-btn"
        >
          Clear
        </button>
      </div>

      {error && <div className="notice" style={{ color: "crimson" }}>{error}</div>}

      <div style={{ marginTop: 12 }}>
        <strong>Selected images:</strong>
        <div className="preview-row">
          {files.map((f, i) => {
            const url = URL.createObjectURL(f);
            return (
              <div key={i} style={{ width: 160 }}>
                <img src={url} alt={f.name} className="preview" />
                <div className="file-item">
                  <div style={{ fontSize: 13 }}>{f.name}</div>
                  <button onClick={() => removeFile(i)} className="small-btn" style={{ marginLeft: "auto" }}>
                    Remove
                  </button>
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  {(f.size / 1024).toFixed(1)} KB
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="notice">
        Tip: If PDF pages look small, increase Max width. If images are rotated incorrectly, tell me and I'll add EXIF rotation fix.
      </div>
    </div>
  );
}
