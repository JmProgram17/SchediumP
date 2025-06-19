/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

declare global {
  interface Window {
    __MSW_ENABLED__?: boolean
  }
}