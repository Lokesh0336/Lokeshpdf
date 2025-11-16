import React, { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

/** Resize image file using canvas; returns blob */
function resizeBlob(file, maxWidth, maxHeight, mime, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        // determine new size keeping aspect ratio
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

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (!blob) return reject(new Error("toBlob null"));
            resolve(blob);
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
  const [files, setFiles] = useState([]);
  const [maxWidth, setMaxWidth] = useState(1024);
  const [maxHeight, setMaxHeight] = useState(1024);
  const [format, setFormat] = useState("image/jpeg");
  const [quality, setQuality] = useState(0.85);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = (e) => {
    setError("");
    const chosen = Array.from(e.target.files || []).filter(f => f.type.startsWith("image/"));
    if (!chosen.length) { setError("No images selected."); return; }
    setFiles(chosen);
  };

  const downloadSingle = async (file) => {
    try {
      const blob = await resizeBlob(file, Number(maxWidth), Number(maxHeight), format, Number(quality));
      const ext = format === "image/png" ? "png" : "jpg";
      saveAs(blob, `${file.name.replace(/\.[^.]+$/, "")}-resized.${ext}`);
    } catch (err) {
      console.error(err);
      setError("Failed to resize image: " + (err.message || err));
    }
  };

  const downloadAllZip = async () => {
    if (!files.length) { setError("No images."); return; }
    setProcessing(true); setError("");
    try {
      const zip = new JSZip();
      for (let f of files) {
        const blob = await resizeBlob(f, Number(maxWidth), Number(maxHeight), format, Number(quality));
        const ext = format === "image/png" ? "png" : "jpg";
        zip.file(`${f.name.replace(/\.[^.]+$/, "")}-resized.${ext}`, blob);
      }
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "resized-images.zip");
    } catch (err) {
      console.error(err);
      setError("Failed to create zip: " + (err.message || err));
    } finally { setProcessing(false); }
  };

  return (
    <div>
      <div className="controls">
        <div className="row">
          <label className="small">Max width (px)
            <input type="number" value={maxWidth} onChange={(e)=>setMaxWidth(Number(e.target.value||1024))} />
          </label>
          <label className="small">Max height (px)
            <input type="number" value={maxHeight} onChange={(e)=>setMaxHeight(Number(e.target.value||1024))} />
          </label>
        </div>

        <div className="row">
          <label className="small">Format
            <select value={format} onChange={(e)=>setFormat(e.target.value)}>
              <option value="image/jpeg">JPEG (smaller)</option>
              <option value="image/png">PNG (lossless)</option>
            </select>
          </label>
          <label className="small">Quality (JPEG only)
            <input type="number" step="0.05" min="0.1" max="1" value={quality} onChange={(e)=>setQuality(Number(e.target.value||0.85))} />
          </label>
        </div>

        <div className="row">
          <input type="file" accept="image/*" multiple onChange={handleFiles} />
        </div>

        <div className="row" style={{ marginTop: 6 }}>
          <button className="primary" onClick={downloadAllZip} disabled={processing || !files.length}>{processing ? "Working..." : "Download All (zip)"}</button>
          <button className="ghost small" onClick={() => { setFiles([]); setError(""); }} style={{ marginLeft: 8 }}>Clear</button>
        </div>
      </div>

      {error && <div className="notice" style={{ color: "crimson" }}>{error}</div>}

      <div style={{ marginTop: 12 }}>
        <strong>Selected images</strong>
        {files.length === 0 ? <div className="notice">No images selected.</div> :
        <div className="preview-row">
          {files.map((f,i)=>{
            const url = URL.createObjectURL(f);
            return (
              <div key={i} className="preview-card">
                <img src={url} className="preview" alt={f.name} />
                <div className="file-name">{f.name}</div>
                <div style={{ display:"flex", gap:8, width:"100%" }}>
                  <button className="small" onClick={()=>downloadSingle(f)}>Download</button>
                  <button className="small" onClick={()=>setFiles(prev=>prev.filter((_,j)=>j!==i))}>Remove</button>
                </div>
              </div>
            );
          })}
        </div>}
      </div>
    </div>
  );
}
