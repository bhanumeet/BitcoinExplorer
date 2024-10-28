import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import BitcoinExplorer from './BitcoinExplorer'; // Your existing component

// Initialize the Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_API_KEY);
console.log("API Key:", process.env.NEXT_PUBLIC_API_KEY);

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (input.trim() === '') return;

    setIsLoading(true);
    const userMessage = { text: input, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `You are a helpful assistant specializing in Bitcoin and blockchain technology.
        Please provide accurate and concise information about Bitcoin and blockchain concepts.
        If asked about price predictions or financial advice, remind the user that you cannot provide
        such information. Now, please answer the following question: ${input}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const botMessage = { text: response.text(), sender: 'bot' };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage = { text: 'Sorry, I encountered an error. Please try again.', sender: 'bot' };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-grow overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div key={index} className={`mb-4 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-2 rounded-lg ${message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              {message.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-center">
            <p className="text-gray-500">
              Thinking...
            </p>
          </div>
        )}
      </div>
      <div className="p-4 border-t">
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-grow p-2 border rounded-lg"
            placeholder="Ask a question about Bitcoin or blockchain..."
          />
          <button
            onClick={sendMessage}
            className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
            disabled={isLoading}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

// const BitcoinApp = () => {
//   return (
//     <div className="container mx-auto p-4">
//       {/* 
//       <BitcoinExplorer />
//       */}
//       <ChatBot />
//     </div>
//   );
// };

// export default BitcoinApp;

const BitcoinApp = () => {
  return (
    <div className="container mx-auto p-4">
      {/* <BitcoinExplorer /> */}
      <ChatBot />
    </div>
  );
};

export default BitcoinApp;