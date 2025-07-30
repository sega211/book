import css from 'rollup-plugin-import-css';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import html from '@rollup/plugin-html';
import copy from 'rollup-plugin-copy';
import { readFileSync } from 'fs';

// Вспомогательная функция для создания атрибутов тега (необходима для плагина)
const makeHtmlAttributes = (attributes) => {
    if (!attributes) return '';
    const keys = Object.keys(attributes);
    return keys.reduce(
        (result, key) => (result += ` ${key}="${attributes[key]}"`),
        ''
    );
};

export default {
    input: 'src/app.js',
    output: {
        dir: 'dist',
        format: 'iife',
        // Добавляем хэш к имени JS файла для корректного кэширования
        entryFileNames: 'app-[hash].js',
        assetFileNames: '[name]-[hash][extname]',
    },
    plugins: [
        replace({
            preventAssignment: true,
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),
        css({
            // Имя CSS файла теперь будет генерироваться с хэшем автоматически
            // благодаря настройкам Rollup, поэтому опцию 'output' здесь можно убрать.
            minify: true,
        }),
        nodeResolve(),
        // Добавляем плагин для HTML
        html({
            template: ({ attributes, files, publicPath }) => {
                const template = readFileSync('index.html', 'utf-8');
                const scripts = (files.js || [])
                    .map(
                        ({ fileName }) =>
                            `<script src="${publicPath}${fileName}"${makeHtmlAttributes(
                                attributes.script
                            )}></script>`
                    )
                    .join('\n');
                const links = (files.css || [])
                    .map(
                        ({ fileName }) =>
                            `<link href="${publicPath}${fileName}" rel="stylesheet"${makeHtmlAttributes(
                                attributes.link
                            )}>`
                    )
                    .join('\n');

                // Заменяем старые теги на новые, сгенерированные для продакшена
                return template
                    .replace(
                        '<script src="./dist/app.js" type="module"></script>',
                        scripts
                    )
                    .replace(
                        '<link rel="stylesheet" href="./dist/bundle.css">',
                        links
                    );
            },
        }),
        // Добавляем плагин для копирования статичных файлов
        copy({
            targets: [
                // Копируем всю папку static в корень папки dist
                { src: 'static', dest: 'dist' },
                // Копируем манифест и иконки в dist
                { src: 'site.webmanifest', dest: 'dist' },
                { src: 'apple-touch-icon.png', dest: 'dist' },
                { src: 'favicon-32x32.png', dest: 'dist' },
                { src: 'favicon-16x16.png', dest: 'dist' },
                { src: 'favicon.ico', dest: 'dist' },
            ],
        }),
    ],
};