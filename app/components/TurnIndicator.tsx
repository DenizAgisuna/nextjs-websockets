interface TurnIndicatorProps {
  isMyTurn: boolean;
  isSinglePlayer: boolean;
  messagesThisTurn: number;
}

export function TurnIndicator({ 
  isMyTurn, 
  isSinglePlayer, 
  messagesThisTurn 
}: TurnIndicatorProps) {
  if (!isMyTurn) return null;

  return (
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
  );
} 