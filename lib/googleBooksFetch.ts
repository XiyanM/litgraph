export async function fetchWithRetry(
  url: string,
  retries = 3,
  delay = 500
): Promise<Response> {
  const res = await fetch(url);
  if (res.status === 503 && retries > 0) {
    console.log(`Google Books 503, retrying in ${delay}ms (${retries} left)`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, retries - 1, delay * 2);
  }
  return res;
}
