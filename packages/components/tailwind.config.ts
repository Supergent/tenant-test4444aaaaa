import type { Config } from "tailwindcss";
import { tailwindPreset } from "@jn7b6tyq8c6tpz02cef8h679f57skf7x/design-tokens/tailwind.preset";

const config: Config = {
  darkMode: ["class"],
  presets: [tailwindPreset],
  content: ["./src/**/*.{{ts,tsx}}"],
  plugins: [],
};

export default config;
