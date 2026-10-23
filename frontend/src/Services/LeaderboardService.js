//file fetches the data from the data base then creates a new array which it then sorts in decending order

import { API_URL } from "../API";
import { apiFetch } from "../auth/apiClient";

export async function fetchLeaderboard(period) {
  const periodQuery = period === "total" ? "" : `?period=${encodeURIComponent(period)}`;

  const response = await(apiFetch(`${API_URL}/api/leaderboard/${periodQuery}`, {
    method: "GET", headers: {"Content-Type": "application/json", },
  }
));


//debugging 
console.log("response:", response);

// Check if the response is unsuccessful
if(!response.ok) {
    const errorText = await response.text(); // Get the error message from backend
    //no idea how this line works VS code auto filled for me, but it works so hey. 
    throw new Error(`Failed to fetch leaderboard: ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  //debugging
  console.log("Fetched leaderboard:", data);

  return [...data].sort((a, b) => Number(b.total_hours) - Number(a.total_hours));
}