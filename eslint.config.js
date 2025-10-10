const js = require("@eslint/js");
const globals = require("globals");
const reactHooks = require("eslint-plugin-react-hooks");
const reactRefresh = require("eslint-plugin-react-refresh");
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
  { ignores: ["dist", ".next", "node_modules"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // Make rules less strict for now
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^ignored" },
      ],
      "@typescript-eslint/no-explicit-any": "warn", // Change from error to warning
      "@typescript-eslint/ban-ts-comment": "warn", // Change from error to warning
      "@typescript-eslint/no-require-imports": "warn", // Change from error to warning
      "prefer-const": "warn", // Change from error to warning
      "no-empty": "warn", // Change from error to warning
    },
  }
);
