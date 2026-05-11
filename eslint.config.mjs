import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      "client/**",
      "server/**",
      ".next/**",
      "node_modules/**",
      "docs/**",
      "spec/**",
    ],
  },
  ...nextVitals,
  ...nextTs,
];

export default eslintConfig;
