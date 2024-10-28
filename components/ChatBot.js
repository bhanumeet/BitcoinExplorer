import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MessageSquare, X } from 'lucide-react';

// Initialize the Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_API_KEY);
console.log("API Key:", process.env.NEXT_PUBLIC_API_KEY);

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

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
    <>
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-4 right-4 p-4 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors duration-200"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {isChatOpen && (
        <div className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-lg shadow-xl flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="font-semibold text-lg">Bitcoin Chat</h3>
            <button onClick={() => setIsChatOpen(false)} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-2 rounded-lg ${message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                  {message.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-2 rounded-lg bg-gray-200">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-grow p-2 border rounded-lg text-sm"
                placeholder="Ask about Bitcoin..."
              />
              <button
                onClick={sendMessage}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 text-sm"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

