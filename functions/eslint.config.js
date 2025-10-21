import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import importPlugin from "eslint-plugin-import";
// import googleConfig from "eslint-config-google";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.dev.json"],
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "import": importPlugin,
    },
    rules: {
      // ...googleConfig.rules,
      ...tsPlugin.configs.recommended.rules,
      "quotes": ["error", "double"],
      "indent": ["error", 2],
      "semi": ["error", "always"],
      "import/no-unresolved": "off",
      "import/named": "error",
    },
  },
  {
    ignores: [
      "lib/**/*",
      "node_modules/**/*"
    ],
  },
];