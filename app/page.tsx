"use client"
import { useEffect, useRef, useState } from "react";

interface GameState {
  currentTurn: number;
  turnOrder: string[];
  messages: string[];
  isGameActive: boolean;
  currentPlayer: string | null;
}

export default function Home() {
  const [messages, setMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [userName, setUserName] = useState('');
  const [showNameInput, setShowNameInput] = useState(true);
  const [gameState, setGameState] = useState<GameState>({
    currentTurn: 0,
    turnOrder: [],
    messages: [],
    isGameActive: false,
    currentPlayer: null
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [messagesThisTurn, setMessagesThisTurn] = useState(0);
  const [hasJoined, setHasJoined] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Check if user name is already stored
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
      setShowNameInput(false);
    }
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);
        
        if (data.type === 'gameState') {
          setGameState(data.data);
          setMessages(data.data.messages);
          console.log('Updated game state:', data.data);
        } else if (data.type === 'newMessage') {
          setMessages(prev => [...prev, data.data]);
          // Increment message count if it's our message
          if (data.data.startsWith(`${userName}:`)) {
            setMessagesThisTurn(prev => prev + 1);
          }
        } else if (data.type === 'error') {
          setErrorMessage(data.data);
          setTimeout(() => setErrorMessage(''), 3000);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(`{"event":"ping"}`);
      }
    }, 29000);

    return () => {
      clearInterval(pingInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (userName && wsRef.current?.readyState === WebSocket.OPEN && !hasJoined) {
      console.log('Sending join message for:', userName);
      wsRef.current.send(JSON.stringify({
        type: 'join',
        name: userName
      }));
      setHasJoined(true);
    }
  }, [userName, connectionStatus, hasJoined]);

  const handleNameSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (userName.trim()) {
      localStorage.setItem('userName', userName.trim());
      setShowNameInput(false);
    }
  };

  const sendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content: newMessage
      }));
      setNewMessage('');
    }
  };

  const isMyTurn = gameState.currentPlayer === userName;
  const canSendMessage = isMyTurn && messagesThisTurn < 3;
  const isSinglePlayer = gameState.turnOrder.length === 1;

  console.log('Current game state:', {
    turnOrder: gameState.turnOrder,
    currentPlayer: gameState.currentPlayer,
    isMyTurn,
    messagesThisTurn,
    canSendMessage
  });

  if (showNameInput) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="w-full max-w-md mx-4 bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Turn-Based Chat</h1>
            <p className="text-gray-600">Each player gets 3 messages per turn</p>
          </div>
          
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter your name..."
              autoFocus
            />
            <button
              type="submit"
              disabled={!userName.trim()}
              className={`w-full px-6 py-3 rounded-lg font-medium transition-all ${
                userName.trim()
                  ? 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 shadow-sm hover:shadow'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Join Game
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-lg flex h-[90vh] border border-gray-200">
        {/* Left sidebar - Players list */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Players</h2>
            <p className="text-sm text-gray-600">{gameState.turnOrder.length} online</p>
          </div>

          {/* Players list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {gameState.turnOrder.map((playerName, index) => {
              const isCurrentPlayer = playerName === gameState.currentPlayer;
              const isMe = playerName === userName;
              
              return (
                <div 
                  key={playerName}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isCurrentPlayer 
                      ? 'bg-green-100 border border-green-200' 
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isMe ? 'bg-blue-500' : 'bg-gray-400'
                  }`}>
                    <span className="text-white font-medium text-sm">
                      {playerName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium truncate ${
                        isMe ? 'text-blue-600' : 'text-gray-800'
                      }`}>
                        {playerName}
                        {isMe && <span className="text-xs text-blue-500 ml-1">(You)</span>}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${
                        isCurrentPlayer ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                      <span className="text-xs text-gray-500">
                        {isCurrentPlayer ? 'Current Turn' : 'Waiting'}
                      </span>
                    </div>
                  </div>

                  {/* Turn indicator */}
                  {isCurrentPlayer && (
                    <div className="flex gap-1">
                      {[1, 2, 3].map(num => (
                        <div
                          key={num}
                          className={`w-2 h-2 rounded-full ${
                            num <= (isMe ? messagesThisTurn : 0) ? 'bg-green-500' : 'bg-green-200'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Connection status */}
          <div className="p-4 border-t border-gray-200">
            <div className={`flex items-center gap-2 text-sm ${
              connectionStatus === 'connected' ? 'text-green-600' :
              connectionStatus === 'disconnected' ? 'text-red-600' :
              'text-yellow-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'disconnected' ? 'bg-red-500' :
                'bg-yellow-500'
              }`}></div>
              {connectionStatus}
            </div>
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          {/* Chat header */}
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">{userName}</h2>
                  <p className="text-sm text-gray-600">
                    {isMyTurn ? 'Your turn!' : 'Waiting...'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('userName');
                  setShowNameInput(true);
                  setUserName('');
                  setHasJoined(false);
                }}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Change Name
              </button>
            </div>
          </div>

          {/* Game status */}
          <div className="px-6 py-3 bg-purple-50 border-b border-purple-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span className="text-sm font-medium text-purple-700">
                  {isSinglePlayer 
                    ? 'Single Player Mode' 
                    : `Current Turn: ${gameState.currentPlayer || 'None'}`
                  }
                </span>
              </div>
              <div className="text-sm text-purple-600">
                Turn {gameState.currentTurn + 1} of {gameState.turnOrder.length}
              </div>
            </div>
          </div>

          {/* Turn indicator */}
          {isMyTurn && (
            <div className="px-6 py-2 bg-green-50 border-b border-green-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-700">
                  {isSinglePlayer 
                    ? `Messages: ${messagesThisTurn}/3` 
                    : `Your turn! Messages: ${messagesThisTurn}/3`
                  }
                </span>
                <div className="flex gap-1">
                  {[1, 2, 3].map(num => (
                    <div
                      key={num}
                      className={`w-3 h-3 rounded-full ${
                        num <= messagesThisTurn ? 'bg-green-500' : 'bg-green-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {errorMessage && (
            <div className="px-6 py-2 bg-red-50 border-b border-red-100">
              <span className="text-sm text-red-700">{errorMessage}</span>
            </div>
          )}

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div 
                key={index}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 transition-all hover:shadow-md"
              >
                <p className="text-gray-800 font-medium">{message}</p>
              </div>
            ))}
          </div>

          {/* Message input */}
          <form 
            onSubmit={sendMessage}
            className="border-t border-gray-100 p-6 bg-white"
          >
            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder={
                  isSinglePlayer 
                    ? "Type your message..." 
                    : isMyTurn 
                      ? "Type your message..." 
                      : `It's ${gameState.currentPlayer}'s turn`
                }
                disabled={!canSendMessage}
              />
              <button
                type="submit"
                disabled={!canSendMessage}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  canSendMessage
                    ? 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 shadow-sm hover:shadow'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
