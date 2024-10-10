module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    '@electron-toolkit/eslint-config-ts/recommended'
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'react/no-unknown-property': 'off',
    "no-restricted-imports": ["error", {
      "paths": [],
      "patterns": [{
        "group": ["^*/internal$", "^*/internal/[^/]+(?!/public/?)"],
        "message": "internal is private, except the modules in internal/public."
      }]
    }]
  }
}
