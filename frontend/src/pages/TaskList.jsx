import React, { useEffect, useState } from 'react';
import { Trash2, Edit, CheckCircle, Clock, Paperclip, ListTodo } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import TaskDetailsModal from '../components/TaskDetailsModal';

const COLUMNS = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

const TaskList = ({ user }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        setError('Failed to load tasks');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) {
        const data = await response.json();
        alert(data.error);
        fetchTasks(); // revert optimistic update
      }
    } catch (err) {
      console.error(err);
      fetchTasks();
    }
  };

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const taskId = parseInt(draggableId);
    const newStatus = destination.droppableId;

    // Optimistic UI update
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    
    // API Call
    if (source.droppableId !== destination.droppableId) {
      handleStatusChange(taskId, newStatus);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setTasks(tasks.filter(t => t.id !== taskId));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete task');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDesc,
          status: 'PENDING'
        })
      });
      
      if (response.ok) {
        const newTask = await response.json();
        setTasks([...tasks, newTask]);
        setNewTaskTitle('');
        setNewTaskDesc('');
        setIsAdding(false);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create task');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <div className="text-center mt-10 text-gray-500">Loading tasks...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Task Board</h1>
        <div className="flex items-center gap-4">
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {user.role === 'ADMIN' && (
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition whitespace-nowrap">
              {isAdding ? 'Cancel' : '+ New Task'}
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {isAdding && (
        <form onSubmit={handleCreateTask} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Task Title</label>
            <input required type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="E.g., Update the documentation" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Optional details..." />
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition">Save Task</button>
        </form>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {COLUMNS.map(colId => (
            <div key={colId} className="flex-1 min-w-[300px] bg-gray-100 rounded-lg p-4 flex flex-col">
              <h2 className="text-sm font-bold text-gray-700 mb-4 tracking-wide">
                {colId.replace('_', ' ')} ({filteredTasks.filter(t => t.status === colId).length})
              </h2>
              <Droppable droppableId={colId}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 space-y-3 min-h-[150px]"
                  >
                    {filteredTasks.filter(t => t.status === colId).map((task, index) => (
                      <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 ${snapshot.isDragging ? 'shadow-md ring-2 ring-indigo-500' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-gray-900 cursor-pointer hover:text-indigo-600" onClick={() => setSelectedTask(task)}>{task.title}</h3>
                              {user.role === 'ADMIN' && (
                                <button onClick={() => handleDelete(task.id)} className="text-red-400 hover:text-red-600">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{task.description}</p>
                            )}
                            <div className="flex items-center justify-between mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
                              <span>Assignee: {task.assignee?.name || 'Unassigned'}</span>
                              <div className="flex gap-2">
                                <button onClick={() => setSelectedTask(task)} className="hover:text-indigo-600" title="Subtasks"><ListTodo className="w-4 h-4" /></button>
                                <button onClick={() => setSelectedTask(task)} className="hover:text-indigo-600" title="Attachments"><Paperclip className="w-4 h-4" /></button>
                                <button onClick={() => setSelectedTask(task)} className="hover:text-indigo-600" title="Time Tracking"><Clock className="w-4 h-4" /></button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {selectedTask && (
        <TaskDetailsModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)}
          onUpdateTask={(updatedTask) => {
            setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
            setSelectedTask(updatedTask);
          }}
        />
      )}
    </div>
  );
};

export default TaskList;
