export const fetchData = async <T>(
  url: string,
  method: string = 'GET',
  data?: any,
  token?: string
): Promise<T> => {
  // Alustetaan otsikot
  const headers: HeadersInit = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Jos dataa ei ole tai data on FormData, ei aseteta Content-Type-otsikkoa
  if (data && !(data instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Alustetaan fetchin asetukset
  const options: RequestInit = {
    method,
    headers,
    body: data
      ? data instanceof FormData
        ? data
        : JSON.stringify(data)
      : undefined,
  };

  // Suoritetaan API-pyyntö
  const response = await fetch(url, options);

  // Tarkistetaan vastaus
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'An error occurred');
  }

  // Palautetaan JSON-data
  return response.json();
};
