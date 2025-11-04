# Mobile QR Code Scanning Feature Documentation

## 1. Overview

The mobile QR code scanning feature enables event staff to use their smartphones to scan student QR codes during the graduation ceremony. When a QR code is scanned on a mobile device using the `/mobile-scan` page, the student's information is transmitted in real-time via a WebSocket connection to a central desktop dashboard (e.g., `/admin` or `/scanner` page) for processing and name announcement. This system allows for flexible and distributed scanning across the event venue.

## 2. System Architecture

### Components

1.  **Mobile Scanner Page (`/mobile-scan/page.tsx`)**: A web-based QR scanner accessible on mobile devices. It uses the `MobileQrScanner` component.
2.  **`MobileQrScanner` Component (`components/mobile-qr-scanner.tsx`)**: Handles camera access, QR code detection using `html5-qrcode`, and user interface for the scanning process on the mobile page.
3.  **WebSocket Server (`documentation/websocket.js`)**: A Node.js server acting as a real-time communication hub. It runs on a specified port (default 8080).
4.  **Desktop Dashboard (e.g., `/admin/page.tsx`, `/scanner/page.tsx`)**: Desktop interface that includes the `DesktopWebSocketClient` component to receive student data from the WebSocket server.
5.  **`DesktopWebSocketClient` Component (`components/desktop-websocket-client.tsx`)**: Connects desktop pages to the WebSocket server to listen for incoming scans and other messages.
6.  **QR Code Generator (`components/qr-code-generator.tsx`)**: Creates unique QR codes for each student.

### Communication Flow

\`\`\`
Mobile Device (navigates to /mobile-scan) → Scans QR Code → Sends data to WebSocket Server → WebSocket Server relays data to Desktop Dashboard → Desktop Dashboard processes data (e.g., for voice announcement)
\`\`\`

## 3. Setup and Configuration Guide

### Step 1: Prepare the WebSocket Server

1.  **Ensure `ws` dependency is installed**:
    \`\`\`bash
    npm install ws
    # or yarn add ws
    \`\`\`
2.  The WebSocket server script is located at `documentation/websocket.js`.

### Step 2: Configure WebSocket URL

1.  The application expects the WebSocket URL to be defined via an environment variable: `NEXT_PUBLIC_WEBSOCKET_URL`.
2.  Create or edit the `.env.local` file in your project root:
    \`\`\`env
    NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8080
    \`\`\`
    -   For local development where the WebSocket server runs on the same machine.
    -   **Important for Mobile Testing**: If testing on a mobile device that's not on the same network or cannot resolve `localhost`, you'll need to use a publicly accessible URL. See "Deployment with ngrok" (Section 6.2). For ngrok, the URL would be like `wss://your-ngrok-id.ngrok-free.app`. Remember to use `wss://` for secure WebSocket connections if your ngrok tunnel is HTTPS.

### Step 3: Run the Servers

1.  **Start the WebSocket Server**:
    Open a terminal and run:
    \`\`\`bash
    node documentation/websocket.js
    \`\`\`
    You should see output like: "WebSocket server started on port 8080". Keep this terminal running.

2.  **Start the Next.js Development Server**:
    Open another terminal and run:
    \`\`\`bash
    npm run dev
    # or yarn dev
    \`\`\`
    Ensure this starts *after* you've set the `NEXT_PUBLIC_WEBSOCKET_URL` in `.env.local`. If you set/change the env var while the dev server is running, restart it.

### Step 4: Access the Application

1.  **Desktop Dashboard**: Open a browser on your computer and navigate to a page that integrates the `DesktopWebSocketClient` (e.g., `http://localhost:3000/admin` or `http://localhost:3000/scanner`). Check the browser's developer console for WebSocket connection messages. You should see a status indicator like "Desktop: connected" in the bottom-right corner.
2.  **Mobile Scanner**:
    *   On your smartphone, connect to the same Wi-Fi network as your computer (if using `localhost` or local IP for WebSocket).
    *   Navigate to `http://<your-computer-ip>:3000/mobile-scan`.
    *   If using ngrok for the Next.js app, use the ngrok URL: `https://<your-nextjs-ngrok-url>/mobile-scan`.
    *   The mobile scanner page will attempt to connect to the WebSocket server specified by `NEXT_PUBLIC_WEBSOCKET_URL`.

## 4. Mobile Scanner Implementation Details (`components/mobile-qr-scanner.tsx`)

### Camera Permission Handling

-   The component automatically checks camera permissions on load.
-   If permissions are already granted, it attempts to list available cameras and select a default (preferring rear-facing).
-   If permissions are not granted, it provides a button to "Allow Camera Access".
-   The UI displays the current permission status (Granted, Denied, Prompt, Unknown).

### QR Code Scanning

-   Uses the `html5-qrcode` library for robust, cross-browser QR code scanning.
-   Once camera access is granted and a camera is selected, the "Start Scanning" button becomes active (if connected to WebSocket).
-   The video feed is displayed within a designated area on the page.
-   Successful scans trigger the `onScanSuccess` callback, which in `app/mobile-scan/page.tsx` sends the data via WebSocket.
-   Visual feedback (border flash) and haptic feedback (vibration, if supported) are provided on successful scan.

### Automatic Camera Selection

-   The camera selection dropdown has been removed for a simpler user experience.
-   The system automatically tries to select the rear-facing ("environment") camera. If not found, it defaults to the first available camera.

### QR Code Data Format (Expected)

The scanner expects QR codes to contain JSON data with at least:
\`\`\`json
{
  "id": "student-id",          // Unique identifier for the student
  "n": "Student Name",         // Full name of the student
  "p": "Phonetic Spelling",    // Optional phonetic spelling
  "t": 1,                      // Type identifier (e.g., for student QR codes)
  "v": "validation-code"       // A verification code for authenticity
}
\`\`\`
The `handleScanSuccess` function in `app/mobile-scan/page.tsx` parses this data.

## 5. WebSocket Communication Details

(This section primarily describes the mobile client's interaction. The desktop client's resilience improvements are better detailed in project-overview.md, but you could add a note here if desired.)
-   **Desktop Client Resilience**: Note that the desktop components receiving these WebSocket messages (e.g., on `/admin`, `/scanner`) have improved handling for when the WebSocket server is temporarily unavailable.

### Connection Management (`app/mobile-scan/page.tsx` and `components/desktop-websocket-client.tsx`)

-   **URL Configuration**: Uses `process.env.NEXT_PUBLIC_WEBSOCKET_URL`. Falls back to `ws://localhost:8080` if the env var is not set.
-   **Client Registration**:
    -   Mobile scanners send: `{ type: "register-scanner" }`
    -   Desktop clients send: `{ type: "register-computer", id: "desktop" }`
-   **Message Types (Mobile to Server)**:
    -   `register-scanner`: To identify itself.
    -   `test-connection`: Sent shortly after connection to verify end-to-end communication. Includes `deviceInfo`.
    -   `student-scan`: Contains the scanned `student` data object and a `timestamp`.
-   **Message Types (Server to Clients)**:
    -   `registered`: Confirms registration (e.g., `{ type: "registered", role: "scanner" }`).
    -   `test-connection-confirmed`: Sent back to the originating client (mobile or desktop) to confirm test data was received by the server.
    -   `test-data-received`: Sent to 'computer' clients when a 'scanner' sends test data.
    -   `scan-confirmed`: Sent back to the originating 'scanner' client to confirm scan data was received by the server.
    -   `student-scanned`: Sent to 'computer' clients with the `student` data and `scanTimestamp`.
    -   `error`: If the server encounters an issue processing a message.
-   **Reconnection Logic**: Both mobile and desktop clients implement automatic reconnection with exponential backoff in case of connection drops.

## 6. Deployment Considerations

### 6.1 Local Development

1.  Run the WebSocket server: `node documentation/websocket.js`
2.  Set `NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8080` in `.env.local`.
3.  Run the Next.js app: `npm run dev`.
4.  Access on desktop: `http://localhost:3000/admin`.
5.  Access on mobile (same network): `http://<your-computer-ip>:3000/mobile-scan`.

### 6.2 Development/Testing with ngrok (for external mobile access)

If your mobile device cannot access `localhost` or your computer's local IP, ngrok is essential for exposing both your Next.js app and your WebSocket server.

1.  **Install ngrok**: Follow instructions at [ngrok.com](https://ngrok.com).
2.  **Expose WebSocket Server (port 8080)**:
    \`\`\`bash
    ngrok http 8080
    \`\`\`
    ngrok will provide a forwarding URL (e.g., `https://unique-id.ngrok-free.app`). Note this URL.

3.  **Expose Next.js App (port 3000)**:
    In a separate terminal:
    \`\`\`bash
    ngrok http 3000
    \`\`\`
    ngrok will provide another forwarding URL.

4.  **Configure Environment Variable**:
    Update `.env.local` with the WebSocket ngrok URL, using `wss://` for the secure tunnel:
    \`\`\`env
    NEXT_PUBLIC_WEBSOCKET_URL=wss://<websocket-ngrok-id>.ngrok-free.app
    \`\`\`
    Restart your Next.js dev server.

5.  **Access**:
    *   Desktop: Use the Next.js ngrok URL + `/admin` (e.g., `https://<nextjs-ngrok-id>.ngrok-free.app/admin`).
    *   Mobile: Use the Next.js ngrok URL + `/mobile-scan` (e.g., `https://<nextjs-ngrok-id>.ngrok-free.app/mobile-scan`).

### 6.3 Production Deployment

-   Deploy the WebSocket server (`websocket.js`) to a hosting service that supports Node.js and WebSockets (e.g., Vercel Serverless Functions with WebSocket support, Heroku, AWS EC2/ECS, DigitalOcean).
-   Deploy the Next.js application (e.g., to Vercel).
-   Set the `NEXT_PUBLIC_WEBSOCKET_URL` environment variable in your Next.js deployment to point to your live WebSocket server URL (using `wss://`).
-   Ensure your WebSocket server's port is open and accessible.

## 7. User Interface Features (`/mobile-scan` page)

-   **Mobile Login**: Before accessing the scanner, staff are required to log in using a specific password on a mobile-optimized login screen.
-   **Connection Status Bar**: Displays current WebSocket connection status (Connecting, Connected, Disconnected, Error, Reconnecting) with color-coded icons.
-   **Camera Permission Status**: Shows if camera access is granted, denied, or needs to be prompted.
-   **Scanner Viewport**: A designated area where the camera feed appears. Includes an overlay to guide QR code positioning.
-   **Control Buttons**:
    -   "Allow Camera Access" (if permission not granted).
    -   "Start Scanning" / "Stop Scanning".
-   **Error Messages**: Displays relevant error messages for camera or scanning issues.
-   **Connection Logs**: A scrollable log area showing recent WebSocket events and messages for debugging.
-   **Last Scanned Student**: Displays information about the most recently successfully processed scan.

## 8. Troubleshooting Common Issues

1.  **Mobile Scanner Stuck on "Connecting..." or Shows "Connection Error"**:
    *   **Verify WebSocket Server**: Ensure `node documentation/websocket.js` is running and accessible. Check its console for errors.
    *   **Check `NEXT_PUBLIC_WEBSOCKET_URL`**: Must be correct in `.env.local` (and Next.js server restarted). Use `wss://` for secure ngrok tunnels.
    *   **ngrok Status**: If using ngrok, ensure the tunnel for port 8080 is active and the URL matches.
    *   **Network/Firewall**: Corporate networks or firewalls might block WebSocket connections. Try a different network (e.g., mobile data, if ngrok is used for the WebSocket server).
    *   **Browser Console**: Check the mobile browser's developer console on the `/mobile-scan` page for detailed errors.

2.  **Camera Feed is Black or Not Showing**:
    *   **Permissions**: Double-check that camera permission is granted for the site in the mobile browser's settings.
    *   **Secure Context (HTTPS)**: Camera access typically requires a secure context (`https://`). If accessing via an IP address locally (`http://...`), some browsers might restrict camera access. Using ngrok (which provides `https://`) for your Next.js app can solve this.
    *   **Browser Compatibility**: Try a different browser on the mobile device (Chrome and Safari are generally well-supported).
    *   **Other Apps Using Camera**: Ensure no other app is exclusively using the camera.
    *   **Restart Browser/Device**: Sometimes a simple restart can resolve temporary glitches.

3.  **"Start Scanning" Button is Disabled/Greyed Out**:
    *   **WebSocket Connection**: The button is disabled if not connected to the WebSocket server (`isConnected` prop). Check connection status.
    *   **Camera Selection**: The button is disabled if no camera ID is selected (`selectedCameraId`). This should happen automatically if permissions are granted. If it remains an issue, check logs for errors during `getCamerasAndSetDefault`.
    *   **Permissions**: If camera permission is not "granted", the "Allow Camera Access" button should be shown instead.

4.  **QR Codes Not Scanning or Scanned Incorrectly**:
    *   **Lighting**: Ensure good lighting on the QR code.
    *   **QR Code Quality**: Use clear, high-contrast QR codes.
    *   **Distance/Focus**: Adjust the phone's distance and ensure the camera can focus on the QR code.
    *   **QR Code Format**: Verify the QR code contains valid JSON with the expected fields (`id`, `n`, `t`, `v`).
    *   **Console Logs**: Check mobile scanner logs for any parsing errors after a scan attempt.

5.  **Desktop Dashboard Not Receiving Scans**:
    *   **Desktop WebSocket Connection**: Ensure the desktop page (e.g., `/admin`) shows "Desktop: connected" and its console logs indicate a successful WebSocket connection and registration as a 'computer'.
    *   **Same WebSocket Server**: Verify both mobile and desktop are configured to use the exact same `NEXT_PUBLIC_WEBSOCKET_URL`.
    *   **WebSocket Server Logs**: Check the terminal running `documentation/websocket.js`. It logs received messages and forwarding actions. If messages arrive from mobile but aren't forwarded, there's an issue in the server script. If messages don't arrive at all, the issue is with the mobile client or network path.

## 9. Customization and Advanced Options

-   **Styling**: The UI components (`MobileQrScanner`, `MobileScanPage`) can be styled further using Tailwind CSS classes.
-   **QR Code Data Handling**: Modify `handleScanSuccess` in `app/mobile-scan/page.tsx` to change how QR data is processed or validated before sending.
-   **WebSocket Message Structure**: If you need to send more/different data, update the message structures in both client files (`app/mobile-scan/page.tsx`, `components/desktop-websocket-client.tsx`) and the server (`documentation/websocket.js`).
-   **Error Handling**: Enhance error reporting or user feedback in `MobileQrScanner.tsx` or `MobileScanPage.tsx`.
-   **Phonetic Announcement on Mobile**: Currently, name announcement is primarily a desktop feature. To add it to mobile, you would need to integrate the Web Speech API into the `/mobile-scan` page.

This documentation should provide a comprehensive guide to setting up, using, and troubleshooting the updated mobile QR scanning feature.
