import React, { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

/** Resize image file using canvas; returns blob and a data URL for preview */
function resizeBlobWithPreview(file, maxWidth, maxHeight, mime, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        let iw = img.width, ih = img.height;
        let ratio = Math.min(
          maxWidth ? maxWidth / iw : Infinity,
          maxHeight ? maxHeight / ih : Infinity,
          1
        );
        if (!isFinite(ratio)) ratio = 1;
        const width = Math.round(iw * ratio);
        const height = Math.round(ih * ratio);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // create preview dataURL (resized small)
        const previewDataUrl = canvas.toDataURL("image/png");

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (!blob) return reject(new Error("toBlob returned null"));
            resolve({ blob, previewDataUrl, width, height });
          },
          mime,
          quality
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

export default function ImageResizer() {
  const [files, setFiles] = useState([]); // original File objects
  const [items, setItems] = useState([]); // processed { name, blob, preview, width, height, size }
  const [maxWidth, setMaxWidth] = useState(1024);
  const [maxHeight, setMaxHeight] = useState(1024);
  const [format, setFormat] = useState("image/jpeg");
  const [quality, setQuality] = useState(0.85);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [downloadZip, setDownloadZip] = useState(false);

  const handleFiles = (e) => {
    setError("");
    setItems([]);
    const chosen = Array.from(e.target.files || []).filter(f => f.type.startsWith("image/"));
    if (!chosen.length) {
      setError("No images selected.");
      return;
    }
    // optionally limit to avoid memory blow
    if (chosen.length > 200) chosen.length = 200;
    setFiles(chosen);
  };

  const processAll = async () => {
    if (!files.length) { setError("Please choose images first."); return; }
    setError("");
    setProcessing(true);
    setItems([]);
    try {
      const out = [];
      for (let f of files) {
        const { blob, previewDataUrl, width, height } = await resizeBlobWithPreview(
          f,
          Number(maxWidth) || undefined,
          Number(maxHeight) || undefined,
          format,
          format === "image/png" ? 1.0 : Math.max(0.05, Number(quality))
        );
        out.push({
          name: f.name.replace(/\.[^.]+$/, ""),
          origName: f.name,
          blob,
          preview: previewDataUrl,
          width,
          height,
          size: blob.size
        });
      }
      setItems(out);
    } catch (err) {
      console.error(err);
      setError("Failed to process images: " + (err.message || err));
    } finally {
      setProcessing(false);
    }
  };

  const downloadSingle = async (item) => {
    try {
      const ext = format === "image/png" ? "png" : "jpg";
      saveAs(item.blob, `${item.name}-resized.${ext}`);
    } catch (err) {
      console.error(err);
      setError("Download failed: " + (err.message || err));
    }
  };

  const downloadAllSequential = async () => {
    if (!items.length) { setError("No processed images. Click Process first."); return; }
    setError("");
    try {
      for (let it of items) {
        await new Promise(res => {
          // use saveAs which triggers browser save dialog
          const ext = format === "image/png" ? "png" : "jpg";
          saveAs(it.blob, `${it.name}-resized.${ext}`);
          // wait a short moment to avoid overwhelming the browser
          setTimeout(res, 350);
        });
      }
    } catch (err) {
      console.error(err);
      setError("Failed during sequential downloads: " + (err.message || err));
    }
  };

  const downloadAllZip = async () => {
    if (!items.length) { setError("No processed images. Click Process first."); return; }
    setError("");
    setProcessing(true);
    try {
      const zip = new JSZip();
      const ext = format === "image/png" ? "png" : "jpg";
      for (let it of items) {
        zip.file(`${it.name}-resized.${ext}`, it.blob);
      }
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `resized-images.zip`);
    } catch (err) {
      console.error(err);
      setError("Failed to create zip: " + (err.message || err));
    } finally {
      setProcessing(false);
    }
  };

  const downloadAll = async () => {
    if (downloadZip) await downloadAllZip();
    else await downloadAllSequential();
  };

  const clearAll = () => {
    setFiles([]);
    setItems([]);
    setError("");
  };

  const openInNewTab = async (item) => {
    try {
      const url = URL.createObjectURL(item.blob);
      window.open(url, "_blank");
      // revoke later
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err) {
      console.error(err);
      setError("Failed to open image: " + (err.message || err));
    }
  };

  return (
    <div>
      <div className="controls">
        <div className="row">
          <label className="small">
            Max width (px)
            <input type="number" value={maxWidth} onChange={(e) => setMaxWidth(Number(e.target.value || 1024))} />
          </label>

          <label className="small">
            Max height (px)
            <input type="number" value={maxHeight} onChange={(e) => setMaxHeight(Number(e.target.value || 1024))} />
          </label>
        </div>

        <div className="row">
          <label className="small">
            Format
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="image/jpeg">JPEG (smaller)</option>
              <option value="image/png">PNG (lossless)</option>
            </select>
          </label>

          <label className="small">
            Quality (JPEG)
            <input type="number" step="0.05" min="0.1" max="1" value={quality} onChange={(e) => setQuality(Number(e.target.value || 0.85))} />
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={downloadZip} onChange={(e) => setDownloadZip(e.target.checked)} />
            <span style={{ fontSize: 13, color: "var(--muted)" }}>Download all as ZIP (single file)</span>
          </label>
        </div>

        <div className="row">
          <input type="file" accept="image/*" multiple onChange={handleFiles} />
        </div>

        <div className="row" style={{ marginTop: 6 }}>
          <button className="primary" onClick={processAll} disabled={processing || !files.length}>
            {processing ? "Working..." : "Process images"}
          </button>

          <button className="primary" onClick={downloadAll} disabled={processing || !items.length} style={{ marginLeft: 8 }}>
            Download All
          </button>

          <button className="ghost small" onClick={clearAll} style={{ marginLeft: 8 }}>
            Clear
          </button>
        </div>
      </div>

      {error && <div className="notice" style={{ color: "crimson" }}>{error}</div>}

      <div style={{ marginTop: 12 }}>
        <strong>Processed images</strong>
        {items.length === 0 ? (
          <div className="notice">No processed images yet. Click <strong>Process images</strong> after selecting files.</div>
        ) : (
          <div className="preview-row" style={{ marginTop: 12 }}>
            {items.map((it, i) => (
              <div key={i} className="preview-card">
                <img src={it.preview} alt={it.name} className="preview" />
                <div className="file-name">{it.origName}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{it.width}×{it.height} — {(it.size / 1024).toFixed(1)} KB</div>
                <div style={{ display: "flex", gap: 8, width: "100%", marginTop: 6 }}>
                  <button className="small" onClick={() => downloadSingle(it)}>Download</button>
                  <button className="small" onClick={() => openInNewTab(it)}>Open</button>
                  <button className="small" onClick={() => setItems(prev => prev.filter((_,k) => k !== i))}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
