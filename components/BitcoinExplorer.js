import React, { useState, useEffect } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Info, MessageSquare, X } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_API_KEY);

const BitcoinExplorer = () => {
  const [blockInfo, setBlockInfo] = useState(null);
  const [priceData, setPriceData] = useState([]);
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Fetch latest block info
  useEffect(() => {
    const fetchBlockInfo = async () => {
      try {
        const response = await fetch('https://blockchain.info/latestblock');
        const data = await response.json();
        
        // Get detailed block info
        const blockResponse = await fetch(`https://blockchain.info/rawblock/${data.hash}`);
        const blockData = await blockResponse.json();
        
        setBlockInfo({
          height: { 
            value: blockData.height,
            description: "Block height represents the number of blocks preceding this block on the blockchain."
          },
          hash: { 
            value: blockData.hash,
            description: "A unique identifier for this block, created by hashing the block's contents."
          },
          timestamp: { 
            value: new Date(blockData.time * 1000).toLocaleString(),
            description: "The time when this block was mined."
          },
          transactions: { 
            value: blockData.n_tx,
            description: "The number of transactions included in this block."
          },
          size: { 
            value: `${(blockData.size / 1000000).toFixed(2)} MB`,
            description: "The total size of the block in megabytes."
          },
        });
      } catch (error) {
        console.error('Error fetching block data:', error);
      }
    };

    fetchBlockInfo();
    const interval = setInterval(fetchBlockInfo, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Fetch price data
  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30&interval=daily');
        const data = await response.json();
        
        const formattedData = data.prices.map(([timestamp, price]) => ({
          date: new Date(timestamp).toLocaleDateString(),
          price: price.toFixed(2)
        }));
        
        setPriceData(formattedData);
      } catch (error) {
        console.error('Error fetching price data:', error);
      }
    };

    fetchPriceData();
    const interval = setInterval(fetchPriceData, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Chat functionality
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
    <div className="p-6 max-w-4xl mx-auto bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-lg space-y-6">
      <h1 className="text-3xl font-bold text-center mb-6 text-purple-800">Bitcoin Block Explorer</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {blockInfo && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-purple-700 mb-3">Block Information</h2>
            <TooltipProvider>
              {Object.entries(blockInfo).map(([key, { value, description }]) => (
                <div 
                  key={key} 
                  className="flex justify-between items-center p-3 bg-white hover:bg-purple-100 rounded-lg transition-colors duration-200 shadow-sm cursor-pointer"
                  onClick={() => setSelectedAttribute(key)}
                >
                  <span className="font-semibold capitalize text-purple-700">{key}:</span>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center">
                      <span className="text-gray-600 max-w-[200px] truncate mr-2">
                        {typeof value === 'string' && value.length > 30 
                          ? value.substring(0, 30) + '...' 
                          : value}
                      </span>
                      <Info size={16} className="text-purple-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{description}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              ))}
            </TooltipProvider>
          </div>
        )}
        
        <div>
          <h2 className="text-xl font-semibold text-purple-700 mb-3">Bitcoin Price (Last 30 Days)</h2>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={priceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Line type="monotone" dataKey="price" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
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
    </div>
  );
};

export default BitcoinExplorer;