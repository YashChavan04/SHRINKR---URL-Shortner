# SHRINKR — URL Shortener

A full-stack URL shortener built with **Node.js, Express, HTML, CSS and JavaScript**.

## Features
- Convert long URLs into short links.
- Optional custom aliases (3–20 characters).
- Redirect short links to their original destination.
- Track click counts and last-clicked time.
- List and delete created links.
- Persistent storage in `data/links.json`.
- Input validation, duplicate-code handling and a custom 404 page.
- Responsive desktop and mobile interface.

## Run locally
1. Install Node.js (LTS).
2. Open this project folder in a terminal.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000`.

For a normal production start, use `npm start`.

## API
| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/shorten` | Create a short link. Body: `{ "url": "...", "customCode": "optional" }` |
| `GET` | `/api/links` | List all links and click counts |
| `DELETE` | `/api/links/:id` | Delete a link |
| `GET` | `/:code` | Redirect to the original URL and increment clicks |

## Storage
The server creates `data/links.json` automatically on the first saved link. This is file-based persistence intended for this internship project. For a multi-instance production deployment, replace it with a hosted database and persistent disk.

## Deployment note
Set `BASE_URL` to the public origin of your deployed app (for example, your hosting provider's URL) so the API returns the correct short-link domain. Make sure your hosting platform supports a persistent writable filesystem, or connect a database before deploying.
