"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [blockHeight, setBlockHeight] = useState<number>(0);

  useEffect(() => {
    // Initial fetch to get the block height when the component mounts
    const fetchBlockHeight = () => {
      fetch("http://localhost:3000/api/blocks/block")
        .then((response) => response.json())
        .then((data) => {
          setBlockHeight(data.message[0].height);
        });
    };

    // Call the function immediately on mount
    fetchBlockHeight();

    // Set up interval to fetch block height every 10 seconds
    const intervalId = setInterval(() => {
      fetchBlockHeight();
    }, 10000); // 10000ms = 10 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const handleBtnClick = () => {
    fetch("http://localhost:3000/api/blocks/block")
      .then((response) => response.json())
      .then((data) => {
        setBlockHeight(data.message[0].height);
      });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col justify-center items-center p-6">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-yellow-400">Bitcoin Block Height</h1>
        <p className="text-lg text-gray-400 mt-2">Stay updated with the latest Bitcoin block height</p>
      </header>

      <main className="bg-gray-800 shadow-lg rounded-lg p-10 max-w-md w-full flex flex-col items-center">
        <div className="mb-8">
          <p className="text-6xl font-bold text-yellow-400">{blockHeight}</p>
          <p className="text-sm text-gray-400 mt-2">Current Bitcoin Block Height</p>
        </div>
        <button
          onClick={handleBtnClick}
          className="bg-yellow-500 text-gray-900 px-6 py-3 rounded-md shadow-md hover:bg-yellow-600 transition duration-200"
        >
          Refresh
        </button>
      </main>

      <footer className="mt-10">
        <a
          href="https://github.com/joseph-c-c/next-tailwind-starter"
          target="_blank"
          rel="noopener noreferrer"
          className="text-yellow-400 hover:underline"
        >
          View on GitHub
        </a>
      </footer>
    </div>
  );
}
