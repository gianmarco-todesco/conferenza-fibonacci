# Token Configuration

This file documents the token-based authentication system for the Fibonacci presentation.

## Overview

The presentation system now includes a simple token-based authentication mechanism to control access. This ensures that only authorized viewers can access the presentation.

## Valid Tokens

The following tokens are currently valid for accessing the presentation:

1. `fibonacci-2025` - Main conference token
2. `pisa-conference` - Alternate conference token
3. `demo-token` - Demo/testing token

## Usage

### Accessing with a Token

There are two ways to authenticate:

#### 1. URL Parameter (Recommended)

Add the token as a URL parameter:
```
https://yourdomain.com/slides/index.html?token=fibonacci-2025
```

The token will be validated and stored in the session, then removed from the URL for security.

#### 2. Manual Entry

Simply visit the presentation URL without a token:
```
https://yourdomain.com/slides/index.html
```

You will be prompted to enter a valid token. You have 3 attempts before access is denied.

### Session Management

- Tokens are stored in the browser's session storage
- The token remains valid for the duration of the browser session
- Closing the tab/browser will require re-authentication
- No permanent cookies are stored

## Configuration

To modify the list of valid tokens, edit the `VALID_TOKENS` array in:
```
slides/libs/auth-token.js
```

Example:
```javascript
const VALID_TOKENS = [
    'fibonacci-2025',
    'pisa-conference',
    'demo-token',
    'your-custom-token'  // Add new tokens here
];
```

## Security Notes

- This is a basic client-side authentication mechanism
- Tokens are visible in the browser's session storage
- For production use with sensitive content, consider:
  - Using a backend authentication service
  - Implementing JWT tokens
  - Adding token expiration
  - Using HTTPS exclusively
  
## Disabling Authentication

To disable authentication (for public presentations), comment out the `requireAuth()` call in:
```
slides/libs/gmtlib.js
```

Look for this line in the DOMContentLoaded event:
```javascript
// requireAuth();  // Comment this line to disable authentication
```

## Development

During development, you can:
1. Use one of the demo tokens: `demo-token`
2. Add your own token to the `VALID_TOKENS` array
3. Temporarily disable authentication as described above

## Support

For access issues or to request a token, contact the presentation administrator.
