const fetchData = async <T>(url: string, options = {}): Promise<T> => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Error ${response.status} occured`);
  }
  const json = (await response.json()) as T;
  return json;
};

export {fetchData};
