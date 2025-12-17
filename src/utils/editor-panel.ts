export function getQueryParam(name: string) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}
