# Render deployment

Open Party Lab can run as a single Render web service. The server remains authoritative and serves the built host and controller from the same HTTPS origin.

## Create the service

1. Connect the `Hartwich/Open-Party-Lab` GitHub repository to Render.
2. In the Render dashboard, choose **New > Blueprint**.
3. Select the repository. Render detects `render.yaml` and proposes the `open-party-lab` web service.
4. Apply the Blueprint and wait for the first deployment to finish.
5. Open the assigned `https://<service>.onrender.com` URL.

Render provides `PORT` and `RENDER_EXTERNAL_URL` automatically. The platform uses the external URL for controller QR codes and serves controllers below `/controller/`.

## Free-tier behavior

The free service can spin down after 15 minutes without inbound HTTP requests or WebSocket messages. The first request after that can take about a minute. Active rooms are stored in memory and are lost when the service restarts, redeploys, or spins down.
