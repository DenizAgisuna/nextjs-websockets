import { PlayerCard } from './PlayerCard';
import { GameState } from '../types/game';

interface PlayersSidebarProps {
  gameState: GameState;
  userName: string;
  connectionStatus: string;
  messagesThisTurn: number;
}

export function PlayersSidebar({ 
  gameState, 
  userName, 
  connectionStatus, 
  messagesThisTurn 
}: PlayersSidebarProps) {
  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Players</h2>
        <p className="text-sm text-gray-600">{gameState.turnOrder.length} online</p>
      </div>

      {/* Players list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {gameState.turnOrder.map((playerName) => {
          const isCurrentPlayer = playerName === gameState.currentPlayer;
          const isMe = playerName === userName;
          
          return (
            <PlayerCard
              key={playerName}
              playerName={playerName}
              isCurrentPlayer={isCurrentPlayer}
              isMe={isMe}
              messagesThisTurn={isMe ? messagesThisTurn : 0}
            />
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
  );
} 