export async function fetchWithRetry(
  url: string,
  retries = 1
): Promise<Response> {
  const res = await fetch(url);
  if (res.status === 503 && retries > 0) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return fetchWithRetry(url, retries - 1);
  }
  return res;
}
