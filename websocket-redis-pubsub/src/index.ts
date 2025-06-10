import { WebSocket, WebSocketServer } from 'ws';
import { createClient } from 'redis';

//! Configuration
const WS_PORT = 3000;
const REDIS_URL = 'redis://localhost:6379';

interface RedisEvent {
    userId: string;
    message: string;
    [key: string]: any; 
}

const wss = new WebSocketServer({ port: WS_PORT });
console.log(`WebSocket server started on port ${WS_PORT}`);

const redisClient = createClient({ url: REDIS_URL });

redisClient.on('error', (err) => console.log('Redis Client Error', err));

async function connectRedis(): Promise<void> {
    await redisClient.connect();
    await redisClient.subscribe('user-events', (message: string) => {
        try {
            const event: RedisEvent = JSON.parse(message);
            if (event.userId && userSockets.has(event.userId)) {
                const ws = userSockets.get(event.userId);
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(event));
                } else if (ws) {
                    console.log(`WebSocket for user ${event.userId} is not open. readyState: ${ws.readyState}`);
                    userSockets.delete(event.userId);
                } else {
                    console.log(`No socket found for user ${event.userId}`);
                }
            } else {
                console.log(`No socket found for user ${event.userId}`);
            }
        } catch (error: unknown) {
            console.error("Error parsing or handling message:", error);
        }
    });
}

connectRedis();

//! User ID to WebSocket mapping
const userSockets: Map<string, WebSocket> = new Map();

wss.on('connection', ws => {
    console.log('New WebSocket connection');

    //! Define a property on the WebSocket object to store the userId
    (ws as any).userId = null;

    ws.on('message', message => {
        try {
            const data = JSON.parse(message.toString());

            if (data.userId) {
                const userId: string = data.userId;
                console.log(`User ${userId} connected`);
                userSockets.set(userId, ws);
                (ws as any).userId = userId; // Store userId in websocket instance
            } else {
                console.log("invalid userId");
                ws.close();
            }
        } catch (e) {
            console.error("Error parsing message:", e);
            ws.close();
        }
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
        if ((ws as any).userId) {
            userSockets.delete((ws as any).userId);
            console.log(`User ${(ws as any).userId} disconnected`);
        }
    });

    ws.on('error', error => {
        console.error('WebSocket error:', error);
        if ((ws as any).userId) {
            userSockets.delete((ws as any).userId);
            console.log(`User ${(ws as any).userId} disconnected due to error`);
        }
    });
});
