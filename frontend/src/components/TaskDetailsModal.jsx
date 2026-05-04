import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, Play, Square, Paperclip, CheckSquare, Trash2, Download } from 'lucide-react';

const TaskDetailsModal = ({ task, onClose, onUpdateTask }) => {
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [attachments, setAttachments] = useState([]);
  
  const [isTracking, setIsTracking] = useState(false);
  const [timeSpent, setTimeSpent] = useState(task.timeSpent || 0);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchSubtasks();
    fetchAttachments();
  }, [task.id]);

  useEffect(() => {
    if (isTracking) {
      timerRef.current = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTracking]);

  const fetchSubtasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/tasks/${task.id}/subtasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setSubtasks(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttachments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/tasks/${task.id}/attachments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setAttachments(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtask) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/tasks/${task.id}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: newSubtask })
      });
      if (res.ok) {
        setSubtasks([...subtasks, await res.json()]);
        setNewSubtask('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSubtask = async (subtaskId, isDone) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/subtasks/${subtaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isDone: !isDone })
      });
      if (res.ok) {
        setSubtasks(subtasks.map(st => st.id === subtaskId ? { ...st, isDone: !isDone } : st));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/tasks/${task.id}/attachments`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        setAttachments([...attachments, await res.json()]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTimer = async () => {
    if (isTracking) {
      // Stop and save
      setIsTracking(false);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/tasks/${task.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ timeSpent })
        });
        if (res.ok) {
          onUpdateTask(await res.json());
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setIsTracking(true);
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
            <p className="text-sm text-gray-500 mt-1">Status: {task.status}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Time Tracking */}
          <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between border border-gray-200">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-indigo-600" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Time Tracked</p>
                <p className="text-2xl font-mono text-gray-900">{formatTime(timeSpent)}</p>
              </div>
            </div>
            <button 
              onClick={handleToggleTimer}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-white transition font-medium ${isTracking ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {isTracking ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              {isTracking ? 'Stop Timer' : 'Start Timer'}
            </button>
          </div>

          {/* Subtasks */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-600" /> Checklists
            </h3>
            <div className="space-y-2 mb-4">
              {subtasks.map(st => (
                <div key={st.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md">
                  <input 
                    type="checkbox" 
                    checked={st.isDone} 
                    onChange={() => handleToggleSubtask(st.id, st.isDone)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className={`flex-1 text-sm ${st.isDone ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {st.title}
                  </span>
                </div>
              ))}
              {subtasks.length === 0 && <p className="text-sm text-gray-500 italic">No subtasks yet.</p>}
            </div>
            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input 
                type="text" 
                value={newSubtask} 
                onChange={(e) => setNewSubtask(e.target.value)} 
                placeholder="Add an item..." 
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition text-sm">Add</button>
            </form>
          </div>

          {/* Attachments */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-indigo-600" /> Attachments
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {attachments.map(att => (
                <div key={att.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <span className="text-sm text-gray-700 truncate w-48">{att.fileName}</span>
                  <a href={`http://localhost:5000${att.fileUrl}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800">
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
              {attachments.length === 0 && <p className="text-sm text-gray-500 italic">No attachments yet.</p>}
            </div>
            <div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition text-sm font-medium"
              >
                Upload File
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
