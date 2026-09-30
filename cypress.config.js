import { defineConfig } from 'cypress';

export default defineConfig({
  defaultCommandTimeout: 10000,
  experimentalMemoryManagement: true,
  numTestsKeptInMemory: 0,
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter-config.json',
  },
  component: {
    viewportWidth: 1440,
    viewportHeight: 900,
    specPattern: 'cypress/component/*.cy.js',
    devServer: {
      framework: 'vue',
      bundler: 'vite',
    },
  },
  video: true,
  videoCompression: true,
});
