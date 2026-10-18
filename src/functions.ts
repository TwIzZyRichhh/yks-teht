const fetchData = async <T>(url: string, options = {}): Promise<T> => {
  const response = await fetch(url, options);
  if (!response.ok) {
    // try to read the API's own error message, fall back to the status code
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message ?? `Error ${response.status} occured`);
  }
  const json = (await response.json()) as T;
  return json;
};

export {fetchData};
