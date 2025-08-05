// src/components/parent/ProfileManager.tsx
// Updated to use backend API instead of mock data

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, User, X, RefreshCw, Pencil, AlertCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

const ProfileManager: React.FC = () => {
  const navigate = useNavigate();
  const { 
    children, 
    addChild, 
    deleteChild, 
    childrenLoading, 
    childrenError,
    user 
  } = useUser();
  
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newChild, setNewChild] = useState({
    name: '',
    age: 8,
    seed: Math.random().toString(),
  });

  // Generate avatar URL using DiceBear API (same as backend)
  const generateAvatar = (seed: string) => {
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,ffd5dc,ffdfbf&backgroundType=solid`;
  };

  const regenerateAvatar = () => {
    setNewChild(prev => ({
      ...prev,
      seed: Math.random().toString(36).substring(2, 15)
    }));
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newChild.name.trim()) {
      setError('Please enter a name for the child');
      return;
    }

    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      console.log('➕ Adding new child:', newChild);

      const result = await addChild({
        name: newChild.name.trim(),
        age: newChild.age,
        seed: newChild.seed
      });

      if (result) {
        console.log('✅ Child added successfully:', result);
        setNewChild({ 
          name: '', 
          age: 8, 
          seed: Math.random().toString(36).substring(2, 15) 
        });
        setIsAddingChild(false);
      } else {
        setError('Failed to add child. Please try again.');
      }
    } catch (error: any) {
      console.error('🚨 Error adding child:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChild = async (childId: string, childName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${childName}'s profile? This action cannot be undone.`);
    
    if (!confirmed) return;

    try {
      console.log('🗑️ Deleting child:', childId);
      
      const success = await deleteChild(childId);
      
      if (success) {
        console.log('✅ Child deleted successfully');
      } else {
        alert('Failed to delete child profile. Please try again.');
      }
    } catch (error: any) {
      console.error('🚨 Error deleting child:', error);
      alert('An error occurred while deleting the profile.');
    }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Child Profiles</h2>
        <button
          onClick={() => setIsAddingChild(true)}
          className="btn-primary btn-sm"
          disabled={childrenLoading}
        >
          <PlusCircle size={16} className="mr-1" />
          Add Child
        </button>
      </div>

      {/* Error Message */}
      {childrenError && (
        <div className="mb-4 p-4 bg-error-50 text-error-700 rounded-xl flex items-center">
          <AlertCircle size={20} className="mr-2 flex-shrink-0" />
          <p className="text-sm">{childrenError}</p>
        </div>
      )}

      {/* Loading State */}
      {childrenLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mr-3"></div>
          <p className="text-gray-600">Loading profiles...</p>
        </div>
      )}

      {/* Children Grid */}
      {!childrenLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {children.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              <User size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No child profiles yet.</p>
              <p className="text-sm">Click "Add Child" to create the first profile.</p>
            </div>
          ) : (
            children.map(child => (
              <div 
                key={child.id}
                className="bg-gray-50 p-4 rounded-xl flex items-center space-x-3 relative group hover:bg-gray-100 transition-colors"
              >
                <div className="w-16 h-16 flex-shrink-0 bg-primary-100 rounded-full overflow-hidden flex items-center justify-center">
                  {child.avatar ? (
                    <img 
                      src={child.avatar} 
                      alt={child.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback if avatar fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <User size={32} className="text-primary-500 hidden" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold">{child.name}</h3>
                  <p className="text-gray-600 text-sm">Age: {child.age}</p>
                  <p className="text-gray-400 text-xs">
                    Created: {new Date(child.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => navigate(`/edit-profile/${child.id}`)}
                    className="p-2 bg-white rounded-full shadow hover:bg-gray-50 transition-colors"
                    title="Edit profile"
                  >
                    <Pencil size={14} className="text-gray-500" />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteChild(child.id, child.name)}
                    className="p-2 bg-white rounded-full shadow hover:bg-red-50 transition-colors"
                    title="Delete profile"
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Child Modal */}
      {isAddingChild && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-white rounded-3xl p-6 w-full max-w-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 20 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Child Profile</h2>
              <button 
                onClick={() => {
                  setIsAddingChild(false);
                  setError(null);
                }}
                className="text-gray-500 hover:text-gray-700"
                disabled={loading}
              >
                <X size={20} />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-error-50 text-error-700 rounded-xl flex items-center">
                <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleAddChild}>
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-primary-50">
                    <img 
                      src={generateAvatar(newChild.seed)} 
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={regenerateAvatar}
                    className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                    disabled={loading}
                    title="Generate new avatar"
                  >
                    <RefreshCw size={16} className="text-primary-500" />
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="childName" className="block text-gray-700 font-medium mb-2">
                  Child's Name
                </label>
                <input
                  id="childName"
                  type="text"
                  className="input"
                  value={newChild.name}
                  onChange={(e) => setNewChild({...newChild, name: e.target.value})}
                  placeholder="Enter child's name"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="childAge" className="block text-gray-700 font-medium mb-2">
                  Child's Age
                </label>
                <select
                  id="childAge"
                  className="input"
                  value={newChild.age}
                  onChange={(e) => setNewChild({...newChild, age: parseInt(e.target.value)})}
                  disabled={loading}
                >
                  {[6, 7, 8, 9, 10, 11, 12].map(age => (
                    <option key={age} value={age}>{age} years old</option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingChild(false);
                    setError(null);
                  }}
                  className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 flex-1"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Add Profile'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ProfileManager;