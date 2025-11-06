/**
 * Test script to verify Supabase Real-Time WebSocket connection
 * 
 * Run this in your browser console to test if Real-Time can connect
 * Replace YOUR_SUPABASE_URL and YOUR_ANON_KEY with your actual values
 */

const SUPABASE_URL = 'https://qetjvxqiygghrhochoke.supabase.co' // Replace with your URL
const ANON_KEY = 'YOUR_ANON_KEY_HERE' // Replace with your anon key

// Extract WebSocket URL
const wsUrl = SUPABASE_URL.replace('https', 'wss') + '/realtime/v1/websocket'

console.log('🔌 Testing WebSocket connection to:', wsUrl)
console.log('⏱️ Timeout set to 30 seconds...')

// Create WebSocket connection
const ws = new WebSocket(`${wsUrl}?apikey=${ANON_KEY}&vsn=1.0.0`)

let timeout = setTimeout(() => {
  console.error('❌ Connection timed out after 30 seconds')
  ws.close()
}, 30000)

ws.onopen = () => {
  console.log('✅ WebSocket connection opened successfully!')
  clearTimeout(timeout)
  
  // Send a heartbeat message
  console.log('💓 Sending heartbeat...')
  ws.send(JSON.stringify({
    topic: 'phoenix',
    event: 'heartbeat',
    payload: {},
    ref: '1'
  }))
}

ws.onmessage = (event) => {
  console.log('📨 Received message:', event.data)
  try {
    const data = JSON.parse(event.data)
    if (data.event === 'phx_reply' && data.payload.status === 'ok') {
      console.log('✅ Heartbeat acknowledged - connection is healthy!')
      ws.close()
    }
  } catch (e) {
    console.error('❌ Error parsing message:', e)
  }
}

ws.onerror = (error) => {
  console.error('❌ WebSocket error:', error)
  clearTimeout(timeout)
}

ws.onclose = (event) => {
  console.log('🔌 WebSocket closed:', {
    code: event.code,
    reason: event.reason || 'No reason provided',
    wasClean: event.wasClean
  })
  clearTimeout(timeout)
  
  if (event.code === 1000) {
    console.log('✅ Connection closed normally')
  } else {
    console.error('❌ Connection closed with error code:', event.code)
  }
}

console.log('⏳ Waiting for connection...')
