import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    react(),
    basicSsl(), // Plugin này sẽ tự tạo certificate cho bạn
  ],
  server: {
    port: 3000,
    strictPort: true,
    host: true,// SỬA Ở ĐÂY: Bật true để nhận chứng chỉ từ plugin basicSsl
  }
})
