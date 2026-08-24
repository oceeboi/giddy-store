import ky from 'ky';

const getBaseUrl = () => {
  // If we are in the browser, a relative path or proxy route works fine
  if (typeof window !== 'undefined') {
    return '/api/';
  }

  // If we are on the server side, we MUST provide an absolute URL.
  // Fallback to localhost:3000 if NEXT_PUBLIC_API_URL isn't set.
  return process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/`
    : 'http://localhost:3000/api/';
};

const http = ky.create({
  prefix: getBaseUrl(),
  timeout: 30000, // 30 seconds
});

export default http;
