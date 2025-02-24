import { Suspense } from 'react';
import OthelloGame from '../components/othello/othello-game';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">オセロゲーム</h1>
      <Suspense
        fallback={
          <div className="flex min-h-[600px] items-center justify-center">
            <div className="h-32 w-32 animate-spin rounded-full border-4 border-green-700 border-t-transparent" />
          </div>
        }
      >
        <OthelloGame />
      </Suspense>
    </main>
  );
}
