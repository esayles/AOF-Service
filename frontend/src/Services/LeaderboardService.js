//file fetches the data from the data base then creates a new array which it then sorts in decending order 

export async function fetchLeaderboard() {

  const token = localStorage.getItem("access", data.access);

    
  if (!token) {
      throw new Error("No auth token found. Please log in.");
    }

    const response = await fetch("http://localhost:8000/api/dashboard/", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
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

  const sortedStuents = [...data].sort((a, b) => b.hours - a.hours); // Sort by hours in descending order
  return sortedStuents
}