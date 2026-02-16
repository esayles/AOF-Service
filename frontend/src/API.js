const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const getServiceLogs = async () => {
    //put service app url to login page here
  const response = await fetch(`https://aof-service-back.vercel.app`);
  return response.json();
};

export const createServiceLog = async (logData) => {
    //put service app url to login page here
  const response = await fetch(`https://aof-service-back.vercel.app`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(logData),
  });
  return response.json();
};
