# Render deployment

Open Party Lab can run as a single Render web service. The server remains authoritative and serves the built host and controller from the same HTTPS origin.

## Create the service

1. Connect the `Hartwich/Open-Party-Lab` GitHub repository to Render.
2. In the Render dashboard, choose **New > Blueprint**.
3. Select the repository. Render detects `render.yaml` and proposes the `open-party-lab` web service.
4. Apply the Blueprint and wait for the first deployment to finish.
5. Open the assigned `https://<service>.onrender.com` URL.

Render provides `PORT` and `RENDER_EXTERNAL_URL` automatically. The platform uses the external URL for controller QR codes and serves controllers below `/controller/`.

The hosted build opens on a room start page. Creating a room sends the browser to `/host?room=<code>`; joining an existing room opens the controller with the entered code. This landing page is enabled only by `npm run build:hosted`, so local development and portable Windows builds continue to open their host directly.

Rooms stay alive while a host or controller is connected. After the last participant disconnects, an in-memory room is deleted after ten minutes of inactivity. `ROOM_INACTIVITY_TIMEOUT_MS` and `ROOM_CLEANUP_INTERVAL_MS` can override the defaults when needed.

## Free-tier behavior

The free service can spin down after 15 minutes without inbound HTTP requests or WebSocket messages. The first request after that can take about a minute. Active rooms are stored in memory and are lost when the service restarts, redeploys, or spins down.
