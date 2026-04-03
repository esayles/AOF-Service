//file fetches the data from the data base then creates a new array which it then sorts in decending order 

export async function fetchLeaderboard() {
    const response = await fetch('https://aof-service-back.vercel.app/api/leaderboard');
    //debugging 
    console.log("response:", response);

    // Check if the response is unsuccessful
    if(!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
    }

    const data = await response.json();
    //debugging
    console.log("Fetched leaderboard:", data);

    const sortedStuents = [...data].sort((a, b) => b.hours - a.hours); // Sort by hours in descending order
    return sortedStuents
}