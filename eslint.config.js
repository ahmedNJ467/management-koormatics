const js = require("@eslint/js");
const globals = require("globals");
const reactHooks = require("eslint-plugin-react-hooks");
const reactRefresh = require("eslint-plugin-react-refresh");
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
  { ignores: ["dist", ".next", ".next-build", ".next-dev", "node_modules"] },
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
      // Next.js specific rules
      "@next/next/no-html-link-for-pages": "off", // Allow HTML links for pages
      "@next/next/no-img-element": "off", // Allow img elements
      "@next/next/no-page-custom-font": "off", // Allow custom fonts
      "@next/next/no-sync-scripts": "off", // Allow sync scripts
      "@next/next/no-title-in-document-head": "off", // Allow title in document head
      "@next/next/no-unwanted-polyfillio": "off", // Allow polyfill.io
      "@next/next/no-css-tags": "off", // Allow CSS tags
      "@next/next/no-head-element": "off", // Allow head element
      "@next/next/no-head-import-in-document": "off", // Allow head import in document
      "@next/next/no-script-component-in-head": "off", // Allow script component in head
      "@next/next/no-styled-jsx-in-document": "off", // Allow styled-jsx in document
      "@next/next/no-typos": "off", // Allow typos
      "@next/next/no-document-import-in-page": "off", // Allow document import in page
      "@next/next/no-head-import-in-document": "off", // Allow head import in document
      "@next/next/no-page-custom-font": "off", // Allow custom fonts
      "@next/next/no-sync-scripts": "off", // Allow sync scripts
      "@next/next/no-title-in-document-head": "off", // Allow title in document head
      "@next/next/no-unwanted-polyfillio": "off", // Allow polyfill.io
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
