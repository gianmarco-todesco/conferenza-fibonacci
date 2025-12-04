# conferenza-fibonacci-pisa2025

Presentation slides for the Fibonacci conference in Pisa 2025.

## Authentication

This presentation includes a token-based authentication system to control access.

### Quick Start

Access the presentation with a valid token:
```
slides/index.html?token=demo-token
```

### Valid Tokens

- `fibonacci-2025` - Main conference token
- `pisa-conference` - Alternate conference token  
- `demo-token` - Demo/testing token

### Testing

To test the token system:
```
open slides/test-token.html
```

For detailed token configuration and management, see [TOKEN_CONFIG.md](TOKEN_CONFIG.md).

## Development

The presentation uses:
- Two.js for graphics
- GSAP for animations
- Custom slide management system

Open `slides/index.html` in a browser to view the presentation.