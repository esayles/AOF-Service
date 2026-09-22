import { 
    getAccessToken, 
    refreshAccessToken,
    clearAuthTokens
 } from "./auth";

//adds the authorization header to the request options if an access token is available
 function addAuthHeader(options = {}) {
    const accessToken = getAccessToken();

    return {
        ...options, 
        headers: {
            ...(options.headers || {}),
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
    };
 }

 //call this instead of fetch() to automatically handle token expiration and refresh
 export async function apiFetch(url, options = {}){

    //current access token
    let response = await fetch(url, addAuthHeader(options));

    //check if token is still valid
    if (response.status !== 401) {
        return response;
    }

    console.log("Access token expired, attempting to refresh...");

    //check if refresh token is still vaild
    const refreshed = await refreshAccessToken();

    //if not send back to login
    if (!refreshed) {
        console.error("Unable to refresh access token, logging out...");
        clearAuthTokens();
        window.location.replace('/login'); // return to the login page not just giving an error message
        return response;
    }  
    
    console.log("Access token refreshed, retrying request...");

    response = await fetch(url, addAuthHeader(options));
    return response;

 }