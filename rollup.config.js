import css from 'rollup-plugin-import-css';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
    input: "src/app.js",
    output: {
        dir: "dist",
        format: "iife",
        // Убираем хэш из имен ассетов
        assetFileNames: "[name][extname]"
    },
    plugins: [
        css({
            output: "bundle.css", // Фиксированное имя файла
            minify: false // Отключаем минификацию для разработки
        }),
        nodeResolve()
    ]
};

