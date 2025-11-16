import React, { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

/**
 * Resize + compress using canvas and return a blob + preview
 * width/height can be undefined to keep original size.
 */
function resizeCompress(file, targetWidth, targetHeight, mime, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const iw = img.width;
        const ih = img.height;
        // maintain aspect ratio
        let ratio = Math.min(
          targetWidth ? targetWidth / iw : Infinity,
          targetHeight ? targetHeight / ih : Infinity,
          1
        );
        if (!isFinite(ratio)) ratio = 1;
        const w = Math.round(iw * ratio);
        const h = Math.round(ih * ratio);

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);

        const preview = canvas.toDataURL("image/png"); // quick preview

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (!blob) return reject(new Error("toBlob returned null"));
            resolve({ blob, preview, width: w, height: h });
          },
          mime,
          quality
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

/**
 * Attempt to compress image to target size (in bytes).
 * Strategy:
 *  - If source is PNG and user requested a target size, switch to JPEG for compression.
 *  - Try decreasing JPEG quality stepwise; if not enough, scale down dimensions progressively.
 *  - Stop when blob.size <= targetBytes or we've hit minimal quality/size limits.
 */
async function compressToTarget(file, targetBytes, maxWidth, maxHeight) {
  // prefer JPEG when targeting size (JPEG compresses)
  let mime = file.type === "image/png" ? "image/jpeg" : file.type;
  // initial parameters
  let curQuality = 0.92;
  const minQuality = 0.20;
  const qualityStep = 0.08; // reduce quality by this step
  let scaleFactor = 1.0;
  const minScale = 0.2; // don't scale below 20% original
  const scaleStep = 0.9; // multiply by this to reduce

  // we need original dimensions for scaling:
  const img = new Image();
  const url = URL.createObjectURL(file);
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  URL.revokeObjectURL(url);

  let baseW = img.width;
  let baseH = img.height;
  let currentW = Math.round(baseW * scaleFactor);
  let currentH = Math.round(baseH * scaleFactor);

  // loop until target met or limits reached
  for (let scaleIter = 0; scaleIter < 30; scaleIter++) {
    // within each scale, try decreasing quality steps
    curQuality = 0.92;
    while (curQuality >= minQuality) {
      try {
        const { blob, preview, width, height } = await resizeCompress(
          file,
          Math.min(maxWidth || Infinity, currentW),
          Math.min(maxHeight || Infinity, currentH),
          mime,
          curQuality
        );
        if (blob.size <= targetBytes) {
          return { blob, preview, width, height, usedMime: mime, usedQuality: curQuality };
        }
        // not small enough: reduce quality
      } catch (err) {
        console.error("compressToTarget error:", err);
      }
      curQuality = +(curQuality - qualityStep).toFixed(2);
    }

    // reduce dimensions and retry
    scaleFactor = scaleFactor * scaleStep;
    if (scaleFactor < minScale) break;
    currentW = Math.max(1, Math.round(baseW * scaleFactor));
    currentH = Math.max(1, Math.round(baseH * scaleFactor));
  }

  // final attempt at very low quality / size
  try {
    const { blob, preview, width, height } = await resizeCompress(
      file,
      Math.min(maxWidth || Infinity, currentW),
      Math.min(maxHeight || Infinity, currentH),
      mime,
      Math.max(minQuality, 0.08)
    );
    return { blob, preview, width, height, usedMime: mime, usedQuality: Math.max(minQuality, 0.08) };
  } catch (err) {
    throw new Error("Unable to compress to target: " + (err.message || err));
  }
}

/* ---------- Component ---------- */

export default function ImageResizer() {
  const [files, setFiles] = useState([]);
  const [items, setItems] = useState([]); // processed results
  const [mode, setMode] = useState("quality"); // 'quality' or 'size'

  // common size limits (optional)
  const [maxWidth, setMaxWidth] = useState(2000);
  const [maxHeight, setMaxHeight] = useState(2000);

  // Quality mode slider (0-100%)
  const [qualityPct, setQualityPct] = useState(85); // percent, 0..100

  // Target size mode
  const [targetKB, setTargetKB] = useState(100); // desired file size in KB

  // Format + behavior
  const [format, setFormat] = useState("image/jpeg");
  const [downloadZip, setDownloadZip] = useState(false);

  // UI
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = (e) => {
    setError("");
    setItems([]);
    const chosen = Array.from(e.target.files || []).filter(f => f.type.startsWith("image/"));
    if (!chosen.length) {
      setError("No images selected.");
      return;
    }
    if (chosen.length > 300) chosen.length = 300;
    setFiles(chosen);
  };

  async function processAll() {
    if (!files.length) { setError("Please choose images first."); return; }
    setError("");
    setProcessing(true);
    setItems([]);
    try {
      const out = [];
      for (let f of files) {
        if (mode === "quality") {
          // QUALITY MODE: use slider percent to set quality
          const q = format === "image/png" ? 1.0 : Math.max(0.05, qualityPct / 100);
          const { blob, preview, width, height } = await resizeCompress(
            f,
            maxWidth || undefined,
            maxHeight || undefined,
            format,
            q
          );
          out.push({
            origName: f.name,
            name: f.name.replace(/\.[^.]+$/, ""),
            blob,
            preview,
            width,
            height,
            size: blob.size,
            usedQuality: q,
            usedFormat: format
          });
        } else {
          // SIZE MODE: attempt to reach targetKB
          const targetBytes = Math.max(4, Number(targetKB)) * 1024; // ensure at least 4KB
          // If user chose PNG and wants a small size, informally convert to JPEG for compression
          const effectiveMime = format === "image/png" && targetKB > 0 ? "image/jpeg" : format;
          // call compressToTarget with optional maxWidth/maxHeight as limits
          const result = await compressToTarget(f, targetBytes, maxWidth || undefined, maxHeight || undefined);
          // If compressToTarget returned JPEG but user asked PNG, set usedFormat accordingly
          out.push({
            origName: f.name,
            name: f.name.replace(/\.[^.]+$/, ""),
            blob: result.blob,
            preview: result.preview,
            width: result.width,
            height: result.height,
            size: result.blob.size,
            usedQuality: result.usedQuality,
            usedFormat: result.usedMime
          });
        }
      }
      setItems(out);
    } catch (err) {
      console.error(err);
      setError("Processing failed: " + (err.message || err));
    } finally {
      setProcessing(false);
    }
  }

  // download helpers
  const downloadSingle = async (item) => {
    const ext = item.usedFormat === "image/png" ? "png" : "jpg";
    saveAs(item.blob, `${item.name}-resized.${ext}`);
  };

  const downloadAllSequential = async () => {
    if (!items.length) { setError("No processed images. Click Process first."); return; }
    setError("");
    try {
      for (let it of items) {
        await new Promise(res => {
          const ext = it.usedFormat === "image/png" ? "png" : "jpg";
          saveAs(it.blob, `${it.name}-resized.${ext}`);
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
      for (let it of items) {
        const ext = it.usedFormat === "image/png" ? "png" : "jpg";
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

  const openInNewTab = async (item) => {
    try {
      const url = URL.createObjectURL(item.blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err) {
      console.error(err);
      setError("Failed to open image: " + (err.message || err));
    }
  };

  const clearAll = () => {
    setFiles([]); setItems([]); setError("");
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontWeight: 700 }}>Mode</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={`tab ${mode === "quality" ? "active" : ""}`}
            onClick={() => setMode("quality")}
            style={{ padding: "8px 12px", borderRadius: 8 }}
          >
            Quality (slider)
          </button>
          <button
            className={`tab ${mode === "size" ? "active" : ""}`}
            onClick={() => setMode("size")}
            style={{ padding: "8px 12px", borderRadius: 8 }}
          >
            Target size (KB)
          </button>
        </div>
      </div>

      {/* Mode UIs */}
      {mode === "quality" && (
        <div className="controls" style={{ marginBottom: 12 }}>
          <div className="row">
            <label className="small">
              Quality: {qualityPct}%
              <input
                type="range"
                min="5"
                max="100"
                value={qualityPct}
                onChange={(e) => setQualityPct(Number(e.target.value))}
                style={{ width: 240 }}
              />
            </label>

            <label className="small">
              Format
              <select value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="image/jpeg">JPEG (smaller)</option>
                <option value="image/png">PNG (lossless)</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {mode === "size" && (
        <div className="controls" style={{ marginBottom: 12 }}>
          <div className="row">
            <label className="small">
              Target file size (KB)
              <input type="number" value={targetKB} onChange={(e) => setTargetKB(Number(e.target.value || 0))} style={{ width: 120 }} />
            </label>

            <label className="small">
              Max width (px)
              <input type="number" value={maxWidth} onChange={(e) => setMaxWidth(Number(e.target.value || 0))} style={{ width: 120 }} />
            </label>

            <label className="small">
              Max height (px)
              <input type="number" value={maxHeight} onChange={(e) => setMaxHeight(Number(e.target.value || 0))} style={{ width: 120 }} />
            </label>
          </div>

          <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
            Note: For very small target sizes the file will be converted to JPEG if necessary and/or dimensions will be reduced to meet the target.
          </div>
        </div>
      )}

      {/* Common controls */}
      <div className="controls" style={{ marginBottom: 10 }}>
        <div className="row" style={{ alignItems: "center" }}>
          <input type="file" accept="image/*" multiple onChange={handleFiles} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
            <input type="checkbox" checked={downloadZip} onChange={(e) => setDownloadZip(e.target.checked)} />
            <span style={{ fontSize: 13, color: "var(--muted)" }}>Download all as ZIP (single file)</span>
          </label>
        </div>

        <div className="row" style={{ marginTop: 8 }}>
          <button className="primary" onClick={processAll} disabled={processing || !files.length}>
            {processing ? "Processing..." : "Process images"}
          </button>

          <button className="primary" onClick={downloadAll} disabled={!items.length} style={{ marginLeft: 8 }}>
            Download All
          </button>

          <button className="ghost small" onClick={clearAll} style={{ marginLeft: 8 }}>Clear</button>
        </div>
      </div>

      {error && <div className="notice" style={{ color: "crimson" }}>{error}</div>}

      <div style={{ marginTop: 12 }}>
        <strong>Results</strong>
        {items.length === 0 ? (
          <div className="notice">No processed images yet. Click <strong>Process images</strong> after selecting files.</div>
        ) : (
          <div className="preview-row" style={{ marginTop: 12 }}>
            {items.map((it, i) => (
              <div key={i} className="preview-card">
                <img src={it.preview} alt={it.name} className="preview" />
                <div className="file-name">{it.origName}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {it.width}×{it.height} — {(it.size / 1024).toFixed(1)} KB — {Math.round((it.usedQuality||0)*100)}% quality — {it.usedFormat?.includes("png") ? "PNG" : "JPG"}
                </div>
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
