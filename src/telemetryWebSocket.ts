import * as http from 'http';
import * as WebSocket from 'ws';
import {drivers, SESSION} from '.';

const express = require('express');
export const app = express();

//initialize a simple http server
export const server = http.createServer(app);

//initialize the WebSocket server instance
export const wss = new WebSocket.Server({server});

/**
 * Connected Websockets
 */
const connections = new Array<WebSocket>();

/**
 * New Connections will be added to the connections Array
 * Sends first data Message on Connection
 */
wss.on('connection', (ws: WebSocket) => {
  connections.push(ws);

  const message = {drivers: drivers, session: SESSION};
  ws.send(JSON.stringify(message));
});

/**
 * Removes Connection from ConnectionArray when Connection is closed
 */
wss.on('close', (ws: WebSocket) => {
  connections.splice(connections.lastIndexOf(ws));
});

/**
 * Sends a Message to all connected Websocket Clients
 * @param message Message to be send
 */
export function broadcast(message: string) {
  connections.forEach(connection => {
    connection.send(message);
  });
}

/**
 * Starts Server on WS_PORT (Default 8999)
 */
server.listen(process.env.WS_PORT || 8999, () => {
  console.log('Websocket Server started on port ', process.env.WS_PORT);
});
