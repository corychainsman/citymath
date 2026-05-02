import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base path works for:
//  - GitHub Pages (project sites at /<repo>/)
//  - Vercel / Netlify (root domain)
//  - Local `vite preview`
export default defineConfig({
  plugins: [react()],
  base: "./",
});
