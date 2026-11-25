import { defineConfig } from "vite"
import { gui } from "@opencode/plugin/gui/vite"

// Entry `src/gui.tsx`, bundle `dist/gui-experimental.cjs` (default del preset).
// Il Desktop carica il prebuildato: ricompilare con `vite build` a ogni modifica.
export default defineConfig({ plugins: [gui()] })
