export interface GameState {
  currentTurn: number;
  turnOrder: string[];
  messages: string[];
  isGameActive: boolean;
  currentPlayer: string | null;
} 