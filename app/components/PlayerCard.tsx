interface PlayerCardProps {
  playerName: string;
  isCurrentPlayer: boolean;
  isMe: boolean;
  messagesThisTurn: number;
}

export function PlayerCard({ 
  playerName, 
  isCurrentPlayer, 
  isMe, 
  messagesThisTurn 
}: PlayerCardProps) {
  return (
    <div 
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
                num <= messagesThisTurn ? 'bg-green-500' : 'bg-green-200'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
} 