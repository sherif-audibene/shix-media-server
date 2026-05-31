import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  ...compat.extends("plugin:storybook/recommended"),
  {
    rules: {
      // Thumbnails/posters are streamed from API routes, not static assets,
      // so next/image optimization doesn't apply — plain <img> is intended.
      "@next/next/no-img-element": "off",
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "storybook-static/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
