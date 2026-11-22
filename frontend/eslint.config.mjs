import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Limits from AGENTS.md, as warnings until existing code is brought under them.
    rules: {
      "max-len": ["warn", { code: 120, ignoreUrls: true }],
      "max-lines": ["warn", { max: 200, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["warn", { max: 40, skipBlankLines: true, skipComments: true }],
      complexity: ["warn", 12],
      "no-console": "warn",
      eqeqeq: "warn",
    },
  },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    rules: { "@typescript-eslint/no-explicit-any": "warn" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
