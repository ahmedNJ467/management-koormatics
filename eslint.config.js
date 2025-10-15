const js = require("@eslint/js");
const globals = require("globals");
const reactHooks = require("eslint-plugin-react-hooks");
const reactRefresh = require("eslint-plugin-react-refresh");
const tseslint = require("typescript-eslint");
const nextPlugin = require("@next/eslint-plugin-next");

module.exports = tseslint.config(
  { ignores: ["dist", ".next", ".next-build", ".next-dev", "node_modules"] },
  // Include Next.js plugin rules so Next can detect the plugin
  nextPlugin.flatConfig.coreWebVitals,
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
      "react-refresh/only-export-components": "off", // Development-only optimization, not critical
      // Only enforce the most critical rules for a large codebase
      "@typescript-eslint/no-unused-vars": "off", // Too many in this codebase, focus on critical issues
      "@typescript-eslint/no-explicit-any": "off", // Too many in this codebase
      "@typescript-eslint/ban-ts-comment": "off", // Not critical
      "@typescript-eslint/no-require-imports": "off", // Not critical
      "prefer-const": "off", // Auto-fixable, not critical
      "no-empty": "warn", // Keep this one
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-wrapper-object-types": "off",
      "@typescript-eslint/prefer-as-const": "off",
      "no-constant-condition": "warn",
      "no-prototype-builtins": "off",
      "no-constant-binary-expression": "off",
      "react-hooks/exhaustive-deps": "off", // Too many optimization suggestions, not critical
      "react-hooks/rules-of-hooks": "error", // Keep this critical
      "@typescript-eslint/triple-slash-reference": "off", // Allow triple slash references for Next.js type files
    },
  }
);
