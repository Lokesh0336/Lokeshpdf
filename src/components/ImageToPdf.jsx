import React, { useState } from "react";
import { jsPDF } from "jspdf";

function resizeImage(file, maxWidth = 1024, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const ratio = img.width / img.height;
      const width = img.width > maxWidth ? maxWidth : img.width;
      const height = Math.round(width / ratio);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          resolve(blob);
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

export default function ImageToPdf() {
  const [files, setFiles] = useState([]);
  const [maxWidth, setMaxWidth] = useState(1024);
  const [quality, setQuality] = useState(0.85);
  const [processing, setProcessing] = useState(false);

  const handleFiles = (e) => {
    const chosen = Array.from(e.target.files).filter((f) =>
      f.type.startsWith("image/")
    );
    setFiles(chosen);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const makePdf = async () => {
    if (!files.length) return alert("Choose images first.");
    setProcessing(true);
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "a4"
      });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const blob = await resizeImage(file, Number(maxWidth), Number(quality));
        const imgDataUrl = await new Promise((res) => {
          const reader = new FileReader();
          reader.onload = (ev) => res(ev.target.result);
          reader.readAsDataURL(blob);
        });

        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = imgDataUrl;
        });

        let iw = img.width;
        let ih = img.height;
        const ratio = Math.min(pageW / iw, pageH / ih, 1);
        const drawW = iw * ratio;
        const drawH = ih * ratio;
        const x = (pageW - drawW) / 2;
        const y = (pageH - drawH) / 2;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgDataUrl, "JPEG", x, y, drawW, drawH);
      }

      pdf.save("images-to-pdf.pdf");
    } catch (err) {
      console.error(err);
      alert("Error creating PDF: " + (err.message || err));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container">
      <h2>Image → PDF (client-side)</h2>

      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>Max width (px):</label>
        <input
          type="number"
          value={maxWidth}
          onChange={(e) => setMaxWidth(e.target.value)}
          style={{ width: 120 }}
        />

        <label style={{ marginLeft: 16, marginRight: 8 }}>Quality (0.1-1):</label>
        <input
          type="number"
          step="0.05"
          min="0.1"
          max="1"
          value={quality}
          onChange={(e) => setQuality(e.target.value)}
          style={{ width: 80 }}
        />
      </div>

      <input type="file" accept="image/*" multiple onChange={handleFiles} />
      <div style={{ marginTop: 12 }}>
        <button onClick={makePdf} disabled={processing || !files.length}>
          {processing ? "Processing..." : "Download PDF from images"}
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <strong>Selected images:</strong>
        <ul>
          {files.map((f, i) => (
            <li key={i}>
              {f.name} — {(f.size / 1024).toFixed(1)} KB{" "}
              <button onClick={() => removeFile(i)} style={{ marginLeft: 8 }}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
