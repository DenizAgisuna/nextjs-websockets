"use client"
import { useEffect, useRef, useState } from "react";
import { PlayerCard } from "./components/PlayerCard";
import { PlayersSidebar } from "./components/PlayersSidebar";
import { Message } from "./components/Message";
import { TurnIndicator } from "./components/TurnIndicator";
import { NameInputModal } from "./components/NameInputModal";
import { GameState } from "./types/game";

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
  const userNameRef = useRef<string>('');

  // Update the ref whenever userName changes
  useEffect(() => {
    userNameRef.current = userName;
  }, [userName]);

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
          const previousCurrentPlayer = gameState.currentPlayer;
          setGameState(data.data);
          setMessages(data.data.messages);
          
          // Get our message count from server
          if (data.data.playerMessageCounts && data.data.playerMessageCounts[userNameRef.current] !== undefined) {
            setMessagesThisTurn(data.data.playerMessageCounts[userNameRef.current]);
            console.log('Updated message count from server:', data.data.playerMessageCounts[userNameRef.current]);
          }
          
          // Reset message count when turn changes
          if (previousCurrentPlayer !== data.data.currentPlayer) {
            console.log('Turn changed, resetting message count');
          }
          
          console.log('Updated game state:', data.data);
        } else if (data.type === 'newMessage') {
          setMessages(prev => [...prev, data.data]);
          // Don't increment locally - wait for server to send updated game state
          console.log('Received new message:', data.data);
          console.log('Current userNameRef:', userNameRef.current);
          console.log('Message starts with our name:', data.data.startsWith(`${userNameRef.current}:`));
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
  }, []); // Empty dependency array - connection only created once

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
      <NameInputModal 
        userName={userName}
        setUserName={setUserName}
        onSubmit={handleNameSubmit}
      />
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-lg flex h-[90vh] border border-gray-200">
        {/* Left sidebar - Players list */}
        <PlayersSidebar 
          gameState={gameState}
          userName={userName}
          connectionStatus={connectionStatus}
          messagesThisTurn={messagesThisTurn}
        />

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
          <TurnIndicator 
            isMyTurn={isMyTurn}
            isSinglePlayer={isSinglePlayer}
            messagesThisTurn={messagesThisTurn}
          />

          {/* Error message */}
          {errorMessage && (
            <div className="px-6 py-2 bg-red-50 border-b border-red-100">
              <span className="text-sm text-red-700">{errorMessage}</span>
            </div>
          )}

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <Message key={index} message={message} />
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
