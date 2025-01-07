import { resolve } from "node:path"

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        port: 8081,
    },
    plugins: [
        vue(),
        Components({
            // allow auto load markdown components under `./src/components/`
            extensions: ['vue', 'md'],
            // allow auto import and register components used in markdown
            include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
            resolvers: [
                ElementPlusResolver({
                    importStyle: 'sass',
                }),
            ],
            dts: './src/components.d.ts',
        }),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        }
    },
    build: {
        lib: {
            entry: resolve(__dirname, "./src/components/index.js"),
            name: "MapSideBar",
            fileName: 'map-side-bar',
        },
        rollupOptions: {
            external: ["vue", "@abi-software/map-utilities"],
            output: {
              globals: {
                vue: "Vue",
                "@abi-software/map-utilities": "@abi-software/map-utilities"
              },
            },
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: `@use './src/assets/styles' as *;`
            }
        }
    }
})