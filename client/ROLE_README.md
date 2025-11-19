Role-based sidebar

This project uses a frontend role variable to decide which sidebar items to show.

For local testing without backend auth, you can set the temporary role in the browser console before the app mounts:

window.__USER_ROLE__ = 'lab' // or 'admin', 'manager', 'operations', 'genetic_counselling', 'reporting', 'bioinformatics', etc.

The Sidebar will prefer the authenticated user's role (from AuthContext) if available, or fall back to this global variable.

Notes:
- Role names are normalized (lowercased, spaces to underscores). For example "Genetic Counselling" -> "genetic_counselling".
- The ProtectedRoute component still enforces access checks using AuthContext.hasRole.
