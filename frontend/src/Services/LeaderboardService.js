//file fetches the data from the data base then creates a new array which it then sorts in decending order 

export async function fetchLeaderboard() {
    const response = await fetch('http://localhost:8000/api/leaderboard/');

    // Check if the response is unsuccessful
    if(!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
    }

    const data = await response.json();
    const coppy_data = [...data]; // Create a copy of the data to avoid mutating the original array

    const sortedStuents = [coppy_data].sort((a, b) => b.hours - a.hours); // Sort by hours in descending order
    return sortedStuents
}