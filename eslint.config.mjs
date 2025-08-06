import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Base ESLint config using FlatConfig
export default [
  // Next.js + TypeScript presets
  ...compat.extends("next/core-web-vitals", "next"),

  // Custom rules
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // Warn instead of error for unused vars
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          vars: "all",
          args: "after-used",
          ignoreRestSiblings: true,
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
];
