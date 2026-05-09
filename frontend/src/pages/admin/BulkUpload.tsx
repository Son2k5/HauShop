import { Icon } from "@iconify/react";
import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { uploadImages } from "../../services/productService";
import {
  AdminBadge,
  AdminEmptyState,
  AdminPanel,
  AdminPanelHeader,
  AdminPrimaryButton,
  AdminSecondaryButton,
  AdminStatCard,
} from "./adminShared";

interface PreviewItem {
  id: string;
  file: File;
  previewUrl: string;
}

export default function BulkUpload() {
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [percent, setPercent] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  const totalSizeMb = useMemo(
    () => (items.reduce((sum, item) => sum + item.file.size, 0) / 1024 / 1024).toFixed(2),
    [items]
  );

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const newItems: PreviewItem[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(2, 11),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setMessage(null);
    setItems((prev) => [...prev, ...newItems]);
  };

  const onSelectFile = (e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files);

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (items.length === 0 || loading) return;

    setLoading(true);
    setMessage(null);
    setUploadedCount(0);
    setFailedCount(0);

    try {
      const rawFiles = items.map((item) => item.file);
      const result = await uploadImages(rawFiles, (current, total) => {
        setPercent(Math.round((current / total) * 100));
      });

      setUploadedCount(result.uploaded.length);
      setFailedCount(result.errors.length);
      setMessage(`Hoàn tất tải ảnh. Thành công ${result.uploaded.length}, thất bại ${result.errors.length}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể tải ảnh lên Cloudinary.");
    } finally {
      setLoading(false);
      setPercent(0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          icon="mdi:image-plus-outline"
          label="Tệp đang chờ"
          value={String(items.length)}
          meta="Danh sách ảnh sẵn sàng tải lên"
          accentClass="bg-blue-50 text-blue-700"
        />
        <AdminStatCard
          icon="mdi:database-outline"
          label="Dung lượng"
          value={`${totalSizeMb} MB`}
          meta="Tổng dung lượng hiện tại"
          accentClass="bg-cyan-50 text-cyan-700"
        />
        <AdminStatCard
          icon="mdi:check-circle-outline"
          label="Thành công"
          value={String(uploadedCount)}
          meta="Kết quả lần tải gần nhất"
          accentClass="bg-emerald-50 text-emerald-700"
        />
        <AdminStatCard
          icon="mdi:alert-outline"
          label="Thất bại"
          value={String(failedCount)}
          meta="Ảnh cần kiểm tra lại"
          accentClass="bg-red-50 text-red-700"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_380px]">
        <AdminPanel>
          <AdminPanelHeader
            title="Tải ảnh lên Cloudinary"
            subtitle="Kéo thả ảnh hoặc thư mục, xem trước và tải hàng loạt."
            action={<AdminBadge className="bg-sky-100 text-sky-700">Cloudinary</AdminBadge>}
          />

          <div className="space-y-6 p-5 sm:p-6">
            <div
              className="relative overflow-hidden rounded-[28px] border border-dashed border-sky-300 bg-[radial-gradient(circle_at_top,#eff6ff_0%,#f8fbff_45%,#ffffff_100%)] p-8"
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
            >
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-cyan-200/35 blur-3xl" />

              <div className="relative flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-[linear-gradient(135deg,#2563eb,#06b6d4)] text-white shadow-[0_18px_40px_rgba(37,99,235,0.25)]">
                  <Icon icon="mdi:cloud-upload-outline" width={38} />
                </div>
                <h2
                  className="mt-5 text-2xl font-semibold text-slate-900"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Kéo thả ảnh hoặc thư mục vào đây
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Hỗ trợ chọn nhiều ảnh cùng lúc để đẩy thẳng lên Cloudinary. Bạn có thể kết hợp kéo thả và chọn file thủ công.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <AdminPrimaryButton type="button" onClick={() => fileRef.current?.click()}>
                    <Icon icon="mdi:image-plus-outline" width={18} className="mr-2" />
                    Chọn ảnh
                  </AdminPrimaryButton>
                  <AdminSecondaryButton type="button" onClick={() => folderRef.current?.click()}>
                    <Icon icon="mdi:folder-outline" width={18} className="mr-2" />
                    Chọn thư mục
                  </AdminSecondaryButton>
                </div>

                <input ref={fileRef} type="file" multiple hidden onChange={onSelectFile} accept="image/*" />
                <input
                  ref={folderRef}
                  type="file"
                  hidden
                  onChange={onSelectFile}
                  // @ts-ignore
                  webkitdirectory=""
                />
              </div>
            </div>

            {loading ? (
              <div className="rounded-[24px] border border-sky-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">Đang tải lên Cloudinary</p>
                  <span className="text-sm font-medium text-sky-700">{percent}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#2563eb,#06b6d4)] transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            ) : null}

            {message ? (
              <div
                className={[
                  "rounded-[22px] px-4 py-3 text-sm",
                  failedCount > 0 ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700",
                ].join(" ")}
              >
                {message}
              </div>
            ) : null}

            {items.length ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Danh sách xem trước</p>
                    <p className="text-sm text-slate-500">Kiểm tra nhanh ảnh trước khi tải lên.</p>
                  </div>
                  <AdminSecondaryButton type="button" onClick={() => setItems([])} disabled={loading}>
                    <Icon icon="mdi:delete-outline" width={18} className="mr-2" />
                    Dọn danh sách
                  </AdminSecondaryButton>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="group overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_12px_26px_rgba(15,23,42,0.05)]"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        />
                        {!loading ? (
                          <button
                            type="button"
                            onClick={() => setItems((current) => current.filter((currentItem) => currentItem.id !== item.id))}
                            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-sm transition hover:bg-red-50"
                          >
                            <Icon icon="mdi:close-circle-outline" width={18} />
                          </button>
                        ) : null}
                      </div>
                      <div className="space-y-2 p-4">
                        <p className="truncate text-sm font-semibold text-slate-900">{item.file.name}</p>
                        <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                          <span>{(item.file.size / 1024 / 1024).toFixed(2)} MB</span>
                          <span>{item.file.type || "image/*"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <AdminEmptyState
                icon="mdi:image-multiple-outline"
                title="Chưa có ảnh nào trong danh sách"
                description="Chọn ảnh hoặc thư mục để bắt đầu tải hàng loạt lên Cloudinary."
              />
            )}
          </div>
        </AdminPanel>

        <div className="space-y-6">
          <AdminPanel>
            <AdminPanelHeader title="Luồng làm việc" />
            <div className="space-y-4 p-5 sm:p-6">
              {[
                ["1", "Chọn ảnh", "Thêm ảnh lẻ hoặc cả thư mục cần tải lên."],
                ["2", "Xem trước", "Rà nhanh dung lượng và loại bỏ ảnh chưa cần dùng."],
                ["3", "Tải lên", "Đẩy toàn bộ ảnh lên Cloudinary theo một lần xử lý."],
              ].map(([step, title, desc]) => (
                <div key={step} className="flex gap-4 rounded-[22px] border border-slate-200/80 bg-slate-50/70 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb,#0ea5e9)] text-sm font-semibold text-white">
                    {step}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminPanelHeader title="Lưu ý" />
            <div className="space-y-3 p-5 text-sm leading-6 text-slate-600 sm:p-6">
              <p>Ảnh quá lớn sẽ làm thời gian upload chậm hơn đáng kể.</p>
              <p>Nếu có ảnh lỗi, hệ thống vẫn tiếp tục các ảnh còn lại thay vì dừng toàn bộ.</p>
              <p>Sau khi upload xong, bạn có thể dán URL ảnh vào form sản phẩm để dùng ngay.</p>
            </div>
          </AdminPanel>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <AdminSecondaryButton type="button" onClick={() => setItems([])} disabled={loading || items.length === 0}>
          Dọn danh sách
        </AdminSecondaryButton>
        <AdminPrimaryButton type="button" onClick={handleUpload} disabled={loading || items.length === 0}>
          <Icon icon="mdi:cloud-upload-outline" width={18} className="mr-2" />
          {loading ? "Đang tải lên..." : `Bắt đầu tải ${items.length} ảnh`}
        </AdminPrimaryButton>
      </div>
    </div>
  );
}
