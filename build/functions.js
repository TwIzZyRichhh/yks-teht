const fetchData = async (url, options = {}) => {
    const response = await fetch(url, options);
    if (!response.ok) {
        // try to read the API's own error message, fall back to the status code
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.message ?? `Error ${response.status} occured`);
    }
    const json = (await response.json());
    return json;
};
export { fetchData };
