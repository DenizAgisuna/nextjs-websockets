interface MessageProps {
  message: string;
}

export function Message({ message }: MessageProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 transition-all hover:shadow-md">
      <p className="text-gray-800 font-medium">{message}</p>
    </div>
  );
} 