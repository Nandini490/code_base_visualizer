const API_BASE = 'http://localhost:5000';

export const fetchRepoContents = async (repo, path = '/') => {
  const response = await fetch(`${API_BASE}/repo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo, path })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch');
  }

  return response.json();
};
