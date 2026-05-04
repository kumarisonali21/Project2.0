import React, { useEffect, useState } from 'react';
import { Trash2, Edit, MessageSquare } from 'lucide-react';
import TeamChat from '../components/TeamChat';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeChatProjectId, setActiveChatProjectId] = useState(null);
  
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        setError('Failed to load projects');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!projectName) return;
    try {
      const token = localStorage.getItem('token');
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId 
        ? `http://localhost:5000/api/projects/${editingId}`
        : 'http://localhost:5000/api/projects';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: projectName, description: projectDesc })
      });
      
      if (response.ok) {
        const newProject = await response.json();
        if (editingId) {
          setProjects(projects.map(p => p.id === editingId ? { ...p, ...newProject } : p));
        } else {
          // If the backend returns full owner info, it's great. Otherwise re-fetch.
          fetchProjects(); 
        }
        setProjectName('');
        setProjectDesc('');
        setIsAdding(false);
        setEditingId(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save project');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (project) => {
    setEditingId(project.id);
    setProjectName(project.name);
    setProjectDesc(project.description || '');
    setIsAdding(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setProjects(projects.filter(p => p.id !== id));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete project');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <div className="text-center mt-10 text-gray-500">Loading projects...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <div className="flex items-center gap-4">
          <input 
            type="text" 
            placeholder="Search projects..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <button 
            onClick={() => {
              setIsAdding(!isAdding);
              setEditingId(null);
              setProjectName('');
              setProjectDesc('');
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition whitespace-nowrap">
            {isAdding ? 'Cancel' : '+ New Project'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {isAdding && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Project Name</label>
            <input required type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="E.g., Website Redesign" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Optional details..." />
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition">
            {editingId ? 'Update Project' : 'Save Project'}
          </button>
        </form>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
        <ul className="divide-y divide-gray-200">
          {filteredProjects.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">No projects found.</li>
          ) : (
            filteredProjects.map(project => (
              <li key={project.id} className="px-6 py-4 hover:bg-gray-50 flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-indigo-600 truncate">{project.name}</p>
                    <p className="mt-1 flex items-center text-sm text-gray-500">
                      {project.description || 'No description provided'}
                    </p>
                  </div>
                  <div className="ml-6 flex items-center space-x-3">
                    <button onClick={() => setActiveChatProjectId(activeChatProjectId === project.id ? null : project.id)} className="text-green-500 hover:text-green-700 transition p-2" title="Team Chat">
                      <MessageSquare className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleEdit(project)} className="text-blue-500 hover:text-blue-700 transition p-2" title="Edit">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(project.id)} className="text-red-500 hover:text-red-700 transition p-2" title="Delete">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {activeChatProjectId === project.id && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <TeamChat projectId={project.id} />
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default ProjectList;
