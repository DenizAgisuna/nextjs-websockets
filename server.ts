import { parse } from 'node:url';
import { createServer, Server, IncomingMessage, ServerResponse } from 'node:http';
import next from 'next';
import { WebSocket, WebSocketServer } from 'ws';
import { Socket } from 'node:net';

interface Client {
  ws: WebSocket;
  name: string;
  messagesThisTurn: number;
}

interface GameState {
  currentTurn: number;
  turnOrder: string[];
  messages: string[];
  isGameActive: boolean;
}

const nextApp = next({ dev: process.env.NODE_ENV !== "production" });
const handle = nextApp.getRequestHandler();
const clients: Map<WebSocket, Client> = new Map();
const gameState: GameState = {
  currentTurn: 0,
  turnOrder: [],
  messages: [],
  isGameActive: false
};

const MESSAGES_PER_TURN = 3;

function broadcastGameState() {
  const stateMessage = JSON.stringify({
    type: 'gameState',
    data: {
      currentTurn: gameState.currentTurn,
      turnOrder: gameState.turnOrder,
      messages: gameState.messages,
      isGameActive: gameState.isGameActive,
      currentPlayer: gameState.turnOrder[gameState.currentTurn] || null
    }
  });

  clients.forEach(client => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(stateMessage);
    }
  });
}

function sendGameStateToClient(ws: WebSocket) {
  const stateMessage = JSON.stringify({
    type: 'gameState',
    data: {
      currentTurn: gameState.currentTurn,
      turnOrder: gameState.turnOrder,
      messages: gameState.messages,
      isGameActive: gameState.isGameActive,
      currentPlayer: gameState.turnOrder[gameState.currentTurn] || null
    }
  });
  
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(stateMessage);
  }
}

function nextTurn() {
  if (gameState.turnOrder.length === 0) return;
  
  gameState.currentTurn = (gameState.currentTurn + 1) % gameState.turnOrder.length;
  
  // Reset message counters for all players
  clients.forEach(client => {
    client.messagesThisTurn = 0;
  });
  
  console.log(`Turn changed to: ${gameState.turnOrder[gameState.currentTurn]}`);
  broadcastGameState();
}

function startNewTurn() {
  if (gameState.turnOrder.length === 0) return;
  
  // Reset message counters for all players
  clients.forEach(client => {
    client.messagesThisTurn = 0;
  });
  
  console.log(`New turn started with: ${gameState.turnOrder[gameState.currentTurn]}`);
  broadcastGameState();
}

nextApp.prepare().then(() => {
  const server: Server = createServer((req: IncomingMessage, res: ServerResponse) => {
    handle(req, res, parse(req.url || '', true));
  });

  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws: WebSocket) => {
    console.log('New client connected');
    
    // Send current game state immediately to new client
    sendGameStateToClient(ws);

    ws.on('message', (message: Buffer, isBinary: boolean) => {
      try {
        const messageStr = message.toString();
        
        // Handle ping messages
        if (messageStr === `{"event":"ping"}`) {
          return;
        }

        const parsedMessage = JSON.parse(messageStr);
        
        if (parsedMessage.type === 'join') {
          const client: Client = {
            ws,
            name: parsedMessage.name,
            messagesThisTurn: 0
          };
          
          clients.set(ws, client);
          
          // Add to turn order if not already there
          if (!gameState.turnOrder.includes(parsedMessage.name)) {
            gameState.turnOrder.push(parsedMessage.name);
            gameState.isGameActive = true;
            
            // If this is the first player, start their turn
            if (gameState.turnOrder.length === 1) {
              gameState.currentTurn = 0;
            }
          }
          
          console.log(`User ${parsedMessage.name} joined the game`);
          console.log(`Current turn order: ${gameState.turnOrder.join(', ')}`);
          console.log(`Current turn: ${gameState.turnOrder[gameState.currentTurn]}`);
          
          // Broadcast updated game state to all clients
          broadcastGameState();
        }
        
        else if (parsedMessage.type === 'message') {
          const client = clients.get(ws);
          if (!client) return;
          
          const currentPlayer = gameState.turnOrder[gameState.currentTurn];
          console.log(`Message from ${client.name}, current turn: ${currentPlayer}, messages: ${client.messagesThisTurn}/${MESSAGES_PER_TURN}`);
          
          // Check if it's the player's turn and they haven't exceeded their message limit
          if (currentPlayer === client.name && client.messagesThisTurn < MESSAGES_PER_TURN) {
            const fullMessage = `${client.name}: ${parsedMessage.content}`;
            gameState.messages.push(fullMessage);
            client.messagesThisTurn++;
            
            console.log(`${client.name} sent message ${client.messagesThisTurn}/${MESSAGES_PER_TURN}`);
            
            // Broadcast the new message
            const messageToSend = JSON.stringify({
              type: 'newMessage',
              data: fullMessage
            });
            
            clients.forEach(c => {
              if (c.ws.readyState === WebSocket.OPEN) {
                c.ws.send(messageToSend);
              }
            });
            
            // Check if turn should end
            if (client.messagesThisTurn >= MESSAGES_PER_TURN) {
              console.log(`${client.name} used all messages, ending turn`);
              if (gameState.turnOrder.length > 1) {
                nextTurn();
              } else {
                // Single player - reset their message count
                client.messagesThisTurn = 0;
                console.log(`Single player mode - resetting message count for ${client.name}`);
                broadcastGameState();
              }
            } else {
              // Update game state to show current message count
              broadcastGameState();
            }
          } else {
            // Send error message to the client
            let errorMsg = '';
            if (currentPlayer !== client.name) {
              errorMsg = `It's ${currentPlayer}'s turn!`;
            } else {
              errorMsg = 'You have used all your messages for this turn!';
            }
            
            console.log(`Error for ${client.name}: ${errorMsg}`);
            
            const errorMessage = JSON.stringify({
              type: 'error',
              data: errorMsg
            });
            ws.send(errorMessage);
          }
        }
        
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    ws.on('close', () => {
      const client = clients.get(ws);
      if (client) {
        console.log(`User ${client.name} disconnected`);
        
        // Remove from turn order
        const index = gameState.turnOrder.indexOf(client.name);
        if (index > -1) {
          gameState.turnOrder.splice(index, 1);
          
          // Adjust current turn if necessary
          if (gameState.turnOrder.length === 0) {
            gameState.currentTurn = 0;
            gameState.isGameActive = false;
          } else if (gameState.currentTurn >= gameState.turnOrder.length) {
            gameState.currentTurn = 0;
          }
          
          console.log(`Updated turn order: ${gameState.turnOrder.join(', ')}`);
          console.log(`Current turn: ${gameState.turnOrder[gameState.currentTurn] || 'none'}`);
        }
        
        clients.delete(ws);
        broadcastGameState();
      }
    });
  });

  server.on("upgrade", (req: IncomingMessage, socket: Socket, head: Buffer) => {
    const { pathname } = parse(req.url || "/", true);

    if (pathname === "/_next/webpack-hmr") {
      nextApp.getUpgradeHandler()(req, socket, head);
    }

    if (pathname === "/api/ws") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    }
  });

  server.listen(3000);
  console.log('Server listening on port 3000');
});