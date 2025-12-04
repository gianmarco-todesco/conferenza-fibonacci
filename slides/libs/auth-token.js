/**
 * Simple token-based authentication module for the presentation
 * Provides basic access control using pre-shared tokens
 */

"use strict";

// Configuration for valid tokens
const VALID_TOKENS = [
    'fibonacci-2025',
    'pisa-conference',
    'demo-token'
];

// Storage key for session token
const TOKEN_STORAGE_KEY = 'presentation_auth_token';

/**
 * Validates a token against the list of valid tokens
 * @param {string} token - The token to validate
 * @returns {boolean} - True if token is valid
 */
function validateToken(token) {
    if (!token || typeof token !== 'string') {
        return false;
    }
    return VALID_TOKENS.includes(token.trim());
}

/**
 * Stores the token in session storage
 * @param {string} token - The token to store
 */
function storeToken(token) {
    try {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch (e) {
        console.error('Failed to store token:', e);
    }
}

/**
 * Retrieves the stored token from session storage
 * @returns {string|null} - The stored token or null
 */
function getStoredToken() {
    try {
        return sessionStorage.getItem(TOKEN_STORAGE_KEY);
    } catch (e) {
        console.error('Failed to retrieve token:', e);
        return null;
    }
}

/**
 * Clears the stored token
 */
function clearToken() {
    try {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (e) {
        console.error('Failed to clear token:', e);
    }
}

/**
 * Checks if user is authenticated
 * First checks session storage, then URL parameter
 * @returns {boolean} - True if authenticated
 */
function isAuthenticated() {
    // Check stored token first
    const storedToken = getStoredToken();
    if (storedToken && validateToken(storedToken)) {
        return true;
    }

    // Check URL parameter as fallback
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    
    if (urlToken && validateToken(urlToken)) {
        storeToken(urlToken);
        // Clean URL by removing token parameter
        // Note: Token may still appear in browser history and server logs.
        // For production use, consider using POST requests or other secure methods.
        const url = new URL(window.location);
        url.searchParams.delete('token');
        window.history.replaceState({}, '', url);
        return true;
    }

    return false;
}

/**
 * Prompts user for token and validates it
 * Note: Uses browser prompt() which displays token in plain text.
 * For production use, consider implementing a custom modal with password input.
 * @returns {boolean} - True if successfully authenticated
 */
function promptForToken() {
    const token = prompt('Please enter your access token:');
    
    if (!token) {
        return false;
    }

    if (validateToken(token)) {
        storeToken(token);
        return true;
    } else {
        alert('Invalid token. Please try again.');
        return false;
    }
}

/**
 * Requires authentication before proceeding
 * Blocks access if not authenticated
 */
function requireAuth() {
    if (isAuthenticated()) {
        console.log('Authentication successful');
        return;
    }

    // Show authentication prompt
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        if (promptForToken()) {
            console.log('Authentication successful');
            return;
        }
        attempts++;
    }

    // Max attempts reached, block access
    document.body.innerHTML = `
        <div style="
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        ">
            <div style="text-align: center; padding: 40px;">
                <h1>Access Denied</h1>
                <p>Invalid authentication token.</p>
                <p>Please contact the presenter for access.</p>
                <button onclick="location.reload()" style="
                    margin-top: 20px;
                    padding: 10px 20px;
                    font-size: 16px;
                    background: white;
                    color: #667eea;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                ">Try Again</button>
            </div>
        </div>
    `;
}

export { 
    validateToken, 
    isAuthenticated, 
    requireAuth, 
    storeToken, 
    getStoredToken, 
    clearToken 
};
