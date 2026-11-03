import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
  plugins: [react()], // KHÔNG dùng @vitejs/plugin-basic-ssl
  server: {
    port: 3000,
    https: {
      key: fs.readFileSync('./certs/localhost.key'),
      cert: fs.readFileSync('./certs/localhost.pem'),
    },
  },
})