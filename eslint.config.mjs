import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Allow data fetching pattern in useEffect (this is a valid React pattern)
      "react-hooks/set-state-in-effect": "off",
      // Allow img tags for dynamic images (Next Image requires static src or external config)
      "@next/next/no-img-element": "warn",
    },
  },
]);

export default eslintConfig;
