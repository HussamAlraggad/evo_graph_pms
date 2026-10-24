import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["out/**", "node_modules/**"] },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["media/**/*.js"],
    languageOptions: {
      globals: { acquireVsCodeApi: "readonly", window: "readonly", document: "readonly" },
    },
    rules: { "no-undef": "error" },
  },
);
