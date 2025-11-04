/**
 * WebSocket Server Implementation
 *
 * This is a reference copy of the WebSocket server code that runs on the live server.
 * The actual running server uses a deployed copy of this exact implementation.
 *
 * This file serves as documentation and reference for developers working on the project.
 * Moving or modifying this file will NOT affect the live WebSocket functionality.
 *
 * Server Configuration:
 * - Port: 8080
 * - Handles: Desktop registration, mobile scanner registration, student scan forwarding
 * - Environment Variable: NEXT_PUBLIC_WEBSOCKET_URL should point to the live server
 */
const WebSocket = require("ws")

const wss = new WebSocket.Server({ port: 8080 })

// Store connected clients
const clients = new Map()

console.log("WebSocket server started on port 8080")

wss.on("connection", function connection(ws) {
  console.log("New client connected")

  ws.on("message", function incoming(message) {
    try {
      const data = JSON.parse(message)
      console.log("Received message:", data)

      switch (data.type) {
        case "register-computer": // Kept for potential backward compatibility or other uses
          clients.set(ws, { type: "computer", id: data.id || "legacy-desktop" })
          ws.send(
            JSON.stringify({
              type: "registered",
              role: "computer",
              timestamp: new Date().toISOString(),
            }),
          )
          console.log("Legacy Computer registered:", data.id || "legacy-desktop")
          break

        case "register-desktop": // New handler for the specific client message
          clients.set(ws, { type: "desktop", id: data.id || "main-desktop" })
          ws.send(
            JSON.stringify({
              type: "registered",
              role: "desktop",
              id: data.id || "main-desktop",
              timestamp: new Date().toISOString(),
            }),
          )
          console.log("Desktop client registered:", data.id || "main-desktop")
          break

        case "register-scanner":
          clients.set(ws, { type: "scanner", id: data.id || "mobile" })
          ws.send(
            JSON.stringify({
              type: "registered",
              role: "scanner",
              id: data.id || "mobile",
              timestamp: new Date().toISOString(),
            }),
          )
          console.log("Scanner registered:", data.id || "mobile")
          console.log(
            `Mobile scanner "${ws.id || clients.get(ws)?.id || "unknown"}" connected at ${new Date().toISOString()}`,
          )

          // Broadcast a status message to connected scanners (desktop clients)
          clients.forEach((client, clientWs) => {
            if ((client.type === "computer" || client.type === "desktop") && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: "mobile-connected",
                  id: clients.get(ws)?.id || "unknown-mobile",
                  timestamp: new Date().toISOString(),
                }),
              )
            }
          })
          break

        case "student-scan":
          console.log("=== STUDENT SCAN DATA RECEIVED ===")
          console.log("Student ID:", data.student?.id)
          console.log("Student Name:", data.student?.name)
          console.log("Student Data:", data.student)
          console.log("Scan Timestamp:", data.timestamp)
          console.log("Scanner ID:", clients.get(ws)?.id) // Log which scanner sent it
          console.log("==================================")

          // Send confirmation to scanner
          ws.send(
            JSON.stringify({
              type: "scan-confirmed",
              studentId: data.student?.id,
              studentName: data.student?.name,
              studentDetails: data.student,
              timestamp: new Date().toISOString(),
            }),
          )

          // Forward to all desktop/computer clients
          clients.forEach((client, clientWs) => {
            if ((client.type === "computer" || client.type === "desktop") && clientWs.readyState === WebSocket.OPEN) {
              // Note: clientWs !== ws check might be removed if desktop also needs to see its own "scans" if it could generate them
              clientWs.send(
                JSON.stringify({
                  type: "student-scanned",
                  student: data.student,
                  scanTimestamp: data.timestamp,
                  scannerId: clients.get(ws)?.id || "unknown-scanner", // Identify which scanner sent it
                  serverTimestamp: new Date().toISOString(),
                }),
              )
              console.log("Forwarded student scan to desktop/computer:", client.id)
            }
          })
          break

        default:
          console.log("Unknown message type:", data.type)
          ws.send(
            JSON.stringify({
              type: "error",
              message: `Unknown message type: ${data.type}`,
            }),
          )
      }
    } catch (error) {
      console.error("Error processing message:", error)
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid message format or server-side processing error.",
          details: error.message,
        }),
      )
    }
  })

  ws.on("close", () => {
    const client = clients.get(ws)
    if (client) {
      console.log(`${client.type} disconnected:`, client.id)
      // Optionally, notify other clients about disconnection
      // For example, notify desktop if a scanner disconnects
      if (client.type === "scanner") {
        clients.forEach((desktopClient, desktopWs) => {
          if (desktopClient.type === "desktop" && desktopWs.readyState === WebSocket.OPEN) {
            desktopWs.send(
              JSON.stringify({
                type: "scanner-disconnected",
                scannerId: client.id,
                timestamp: new Date().toISOString(),
              }),
            )
          }
        })
      }
      clients.delete(ws)
    } else {
      console.log("Unknown client disconnected")
    }
  })

  ws.on("error", (error) => {
    console.error("WebSocket error on a connection:", error)
    // ws.send(...) might fail here if the connection is already broken
  })
})

// Periodic cleanup of dead connections
setInterval(() => {
  clients.forEach((client, ws) => {
    if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
      console.log("Cleaning up dead connection for client:", client.id)
      // Similar disconnection logic as in ws.on('close') could be added here if needed
      if (client.type === "scanner") {
        clients.forEach((desktopClient, desktopWs) => {
          if (desktopClient.type === "desktop" && desktopWs.readyState === WebSocket.OPEN) {
            desktopWs.send(
              JSON.stringify({
                type: "scanner-disconnected",
                scannerId: client.id,
                reason: "cleaned-up",
                timestamp: new Date().toISOString(),
              }),
            )
          }
        })
      }
      clients.delete(ws)
    }
  })
}, 30000) // Check every 30 seconds

console.log("WebSocket server is ready to accept connections on port 8080")
