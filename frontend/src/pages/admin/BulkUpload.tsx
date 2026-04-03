import React, { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { uploadImages } from "../../services/productService";

// Định nghĩa kiểu dữ liệu cho danh sách ảnh hiển thị trên giao diện
interface PreviewItem {
  id: string;
  file: File;
  previewUrl: string;
}

const BulkUpload: React.FC = () => {
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [percent, setPercent] = useState<number>(0);
  
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  // Xử lý khi nạp file (từ nút bấm hoặc kéo thả)
  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const newItems: PreviewItem[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substring(2, 11),
      file: file,
      previewUrl: URL.createObjectURL(file),
    }));

    setItems(prev => [...prev, ...newItems]);
  };

  const onSelectFile = (e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files);

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (items.length === 0 || loading) return;
    
    setLoading(true);
    const rawFiles = items.map(it => it.file);

    const result = await uploadImages(rawFiles, (current, total) => {
      setPercent(Math.round((current / total) * 100));
    });

    alert(`Hoàn tất!\n- Thành công: ${result.uploaded.length}\n- Thất bại: ${result.errors.length}`);
    
    setLoading(false);
    setPercent(0);
    // Nếu muốn dọn sạch danh sách sau khi xong, dùng: setItems([]);
  };

  return (
    <div style={css.wrapper}>
      <div style={css.container}>
        <h2 style={css.header}> HauShop - Tải ảnh lên Cloudinary</h2>
        
        {/* Vùng kéo thả */}
        <div 
          style={css.dropBox}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <div style={{ fontSize: "48px" }}>☁️</div>
          <p style={{ fontWeight: "600", color: "#4b5563" }}>Kéo thả ảnh hoặc thư mục vào đây</p>
          <div style={css.btnRow}>
            <button onClick={() => fileRef.current?.click()} style={css.btnLight}>Chọn Files</button>
            <button onClick={() => folderRef.current?.click()} style={css.btnLight}>Chọn Folder</button>
          </div>

          <input ref={fileRef} type="file" multiple hidden onChange={onSelectFile} accept="image/*" />
          <input 
            ref={folderRef} 
            type="file" 
            //@ts-ignore
            webkitdirectory="" 
            hidden 
            onChange={onSelectFile} 
          />
        </div>

        {/* Thanh tiến độ */}
        {loading && (
          <div style={css.progressBg}>
            <div style={{ ...css.progressActive, width: `${percent}%` }}></div>
            <span style={css.progressText}>Đang xử lý: {percent}%</span>
          </div>
        )}

        {/* Danh sách ảnh chờ */}
        <div style={css.imageGrid}>
          {items.map((item) => (
            <div key={item.id} style={css.imageTile}>
              <img src={item.previewUrl} alt="preview" style={css.thumb} />
              <div style={css.fileName}>{item.file.name}</div>
              {!loading && (
                <button 
                  onClick={() => setItems(items.filter(i => i.id !== item.id))} 
                  style={css.closeBtn}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Nút bấm cuối trang */}
        {items.length > 0 && (
          <div style={css.actionFooter}>
            <button onClick={() => setItems([])} disabled={loading} style={css.btnCancel}>Dọn danh sách</button>
            <button onClick={handleUpload} disabled={loading} style={css.btnSubmit}>
              {loading ? "🚀 Đang tải lên..." : `Bắt đầu tải ${items.length} ảnh`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// CSS viết dạng Object để dùng trong TSX
const css: { [key: string]: React.CSSProperties } = {
  wrapper: { padding: "40px 20px", backgroundColor: "#f3f4f6", minHeight: "100vh", fontFamily: "sans-serif" },
  container: { maxWidth: "850px", margin: "0 auto", backgroundColor: "#fff", borderRadius: "16px", padding: "30px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" },
  header: { textAlign: "center", marginBottom: "25px", color: "#111827" },
  dropBox: { border: "2px dashed #d1d5db", borderRadius: "12px", padding: "40px", textAlign: "center", backgroundColor: "#f9fafb", transition: "0.2s" },
  btnRow: { display: "flex", justifyContent: "center", gap: "12px", marginTop: "15px" },
  btnLight: { padding: "10px 20px", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", backgroundColor: "#fff", fontWeight: "500" },
  progressBg: { height: "26px", backgroundColor: "#e5e7eb", borderRadius: "13px", margin: "25px 0", position: "relative", overflow: "hidden" },
  progressActive: { height: "100%", backgroundColor: "#3b82f6", transition: "width 0.4s ease" },
  progressText: { position: "absolute", top: "5px", left: "45%", fontSize: "12px", color: "#fff", fontWeight: "bold" },
  imageGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "15px", marginTop: "25px", maxHeight: "400px", overflowY: "auto", padding: "10px" },
  imageTile: { position: "relative", border: "1px solid #f3f4f6", borderRadius: "10px", padding: "6px", backgroundColor: "#fff", textAlign: "center" },
  thumb: { width: "100%", height: "100px", objectFit: "cover", borderRadius: "6px" },
  fileName: { fontSize: "10px", color: "#6b7280", marginTop: "6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  closeBtn: { position: "absolute", top: "-5px", right: "-5px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", fontWeight: "bold" },
  actionFooter: { display: "flex", justifyContent: "space-between", marginTop: "30px", paddingTop: "20px", borderTop: "1px solid #f3f4f6" },
  btnCancel: { padding: "10px 20px", color: "#ef4444", border: "none", background: "none", cursor: "pointer", fontWeight: "600" },
  btnSubmit: { padding: "12px 30px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", fontSize: "15px" }
};

export default BulkUpload;