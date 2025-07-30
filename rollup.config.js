import css from 'rollup-plugin-import-css';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';

export default {
    input: 'src/app.js',
    output: {
        dir: 'dist',
        format: 'iife',
        // Убираем хэш из имен ассетов
        assetFileNames: '[name][extname]',
    },
    plugins: [
        replace({
            preventAssignment: true,
            'process.env.NODE_ENV': JSON.stringify('development'),
        }),
        css({
            output: 'bundle.css', // Фиксированное имя файла
            minify: false, // Отключаем минификацию для разработки
        }),
        nodeResolve(),
    ],
};
