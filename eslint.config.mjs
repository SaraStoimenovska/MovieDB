import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import functional from "eslint-plugin-functional";
import prettier from "eslint-config-prettier/flat";

/**
 * Module boundaries (Angular-style standalone modules):
 *   app  →  modules  →  shared
 * - other modules are consumed only through their public API: `@/modules/<name>`
 * - inside a module, files import each other relatively (`./x`, `../model/x`)
 * - a relative import may never climb out of its module (`../../…`)
 * - shared must never depend on modules or app
 */
const deepModuleImport = {
  // `@/modules/<name>/server` is the second public entry: server-only exports (cached TMDB calls,
  // async Server Components), kept apart so client bundles never pull in `server-only` code.
  // gitignore semantics: the negation must come last, or a later pattern re-matches it.
  group: ["@/modules/*/*", "**/modules/*/*", "!@/modules/*/server"],
  message:
    "Import other modules only through `@/modules/<name>` or `@/modules/<name>/server`; inside a module use relative imports.",
};

const relativeParentImport = {
  group: ["../*"],
  message: "Use the `@/` alias instead of parent-relative imports.",
};

const escapeModuleImport = {
  group: ["../../*"],
  message: "Don't climb out of the module. Use `@/modules/<name>` or `@/shared/...`.",
};

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  // Typed linting for all TS sources
  {
    files: ["**/*.{ts,tsx,mts}"],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "always"],
      "prefer-const": "error",
    },
  },

  // Immutability & functional style for application code
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.{ts,tsx}", "src/**/__tests__/**", "src/shared/ui/**"],
    plugins: { functional },
    rules: {
      "functional/immutable-data": [
        "error",
        { ignoreClasses: true, ignoreImmediateMutation: true },
      ],
      "functional/no-let": "error",
      "functional/no-loop-statements": "error",
      "functional/no-classes": "error",
      "functional/no-this-expressions": "error",
      "functional/prefer-property-signatures": "error",
    },
  },

  // Boundaries: app → only module public APIs, no parent-relative imports
  {
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [deepModuleImport, relativeParentImport] }],
    },
  },

  // Boundaries: modules → public APIs of other modules; relative imports stay inside the module
  {
    files: ["src/modules/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [deepModuleImport, escapeModuleImport] }],
    },
  },

  // Boundaries: shared is the bottom layer
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/*", "@/modules", "@/app/*"],
              message: "`shared` must not depend on `modules` or `app`.",
            },
            relativeParentImport,
          ],
        },
      ],
    },
  },

  // Vendored shadcn/ui components: generated code, kept as upstream ships it.
  {
    files: ["src/shared/ui/**/*.tsx"],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },

  prettier,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "next-env.d.ts",
  ]),
]);
