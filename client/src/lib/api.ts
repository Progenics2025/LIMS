export async function apiRequest(method: string, url: string, data?: any) {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = new Error('API request failed');
    try {
      const errorData = await response.json();
      (error as any).body = errorData;
      (error as any).status = response.status;
      (error as any).message = errorData.message || response.statusText;
    } catch {
      (error as any).message = response.statusText;
      (error as any).status = response.status;
    }
    throw error;
  }

  return response;
}