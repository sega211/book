const API_BASE_URL = process.env.NODE_ENV === 'production'
  // Для продакшена: URL НЕ должен содержать /public.
  // Веб-сервер будет настроен так, что DocumentRoot указывает на папку public,
  // делая ее "корнем" API.
  ? 'https://mnogodeto4ka.ru/others/book/book_API'
  // Для локальной разработки (например, в XAMPP без VirtualHost):
  // URL ДОЛЖЕН содержать /public, так как мы обращаемся напрямую к папке,
  // чтобы запустить index.php внутри нее.
  : 'http://localhost:8075/book_API/public';

export { API_BASE_URL };