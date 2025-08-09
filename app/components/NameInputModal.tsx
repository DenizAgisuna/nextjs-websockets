interface NameInputModalProps {
  userName: string;
  setUserName: (name: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function NameInputModal({ 
  userName, 
  setUserName, 
  onSubmit 
}: NameInputModalProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-md mx-4 bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Turn-Based Chat</h1>
          <p className="text-gray-600">Each player gets 3 messages per turn</p>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-4">
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