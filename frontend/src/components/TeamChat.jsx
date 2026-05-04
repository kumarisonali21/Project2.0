import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send } from 'lucide-react';

const TeamChat = ({ projectId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Fetch existing messages
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/projects/${projectId}/messages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error('Failed to fetch messages', err);
      }
    };
    fetchMessages();

    // Setup Socket.IO
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('joinProject', projectId);
    });

    newSocket.on('newMessage', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      newSocket.emit('leaveProject', projectId);
      newSocket.disconnect();
    };
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newMessage })
      });
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  return (
    <div className="flex flex-col h-96 bg-gray-50 rounded-lg border border-gray-200">
      <div className="bg-indigo-600 text-white px-4 py-2 rounded-t-lg font-semibold">
        Team Chat
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={msg.id || idx} className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500 mb-1">{msg.sender?.name || 'User'}</span>
            <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 text-sm inline-block max-w-[80%]">
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 bg-white rounded-b-lg flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500 text-sm"
        />
        <button type="submit" className="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 transition">
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default TeamChat;
