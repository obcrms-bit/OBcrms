const nextWebCoreVitals = require('eslint-config-next/core-web-vitals');

module.exports = [
  nextWebCoreVitals,
  {
    ignores: [
      "src/pages-archive/**",
      "src/components/Layout/**",
    ]
  }
];
