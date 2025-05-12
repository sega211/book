import css from 'rollup-plugin-import-css';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
    input: "src/app.js",
    output: {
        dir: "dist",
        format: "iife",
        assetFileNames: "[name]-[hash][extname]" // Хэш только для прода
    },
    plugins: [
        css({
            output: "bundle-[hash].css", // Хэшированное имя
            minify: true // Минификация
        }),
        nodeResolve()
    ]
};