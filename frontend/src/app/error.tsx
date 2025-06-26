'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-800">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 mx-auto mb-6 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
          Something went wrong!
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          We&apos;re sorry, but something unexpected happened. Please try again.
        </p>
        
        <button
          onClick={reset}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
        >
          Try again
        </button>
      </div>
    </div>
  );
} 