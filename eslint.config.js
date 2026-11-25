const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
    expoConfig,
    { ignores: ['dist/**', '.expo/**'] },
    {
        // Existing screens fetch through callbacks that also reset loading state.
        // Keep the compiler recommendation visible without blocking that pattern.
        rules: { 'react-hooks/set-state-in-effect': 'warn' },
    },
    { files: ['tests/**/*.cjs'], languageOptions: { globals: { __dirname: 'readonly' } } },
]);
