import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Pinned because the OAuth redirect allow-list names an exact port, and
  // Vite quietly hopping to 5174 makes sign-in land on the wrong deployment.
  server: { port: 5173, strictPort: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
