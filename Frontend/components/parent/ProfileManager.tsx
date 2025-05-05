import { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, User, X, RefreshCw, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';

const ProfileManager: React.FC = () => {
  const navigate = useNavigate();
  const { children, addChild } = useUser();
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [newChild, setNewChild] = useState({
    name: '',
    age: 8,
    seed: Math.random().toString(),
  });

  const generateAvatar = (seed: string) => {
    const avatar = createAvatar(adventurer, {
      seed,
      backgroundColor: ['b6e3f4', 'c0aede', 'ffd5dc', 'ffdfbf'],
      backgroundType: ['solid'],
      size: 128,
    });
    return avatar.toDataUriSync();
  };

  const regenerateAvatar = () => {
    setNewChild(prev => ({
      ...prev,
      seed: Math.random().toString()
    }));
  };

  const handleAddChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChild.name.trim()) {
      addChild({
        id: Date.now().toString(),
        name: newChild.name,
        age: newChild.age,
        avatar: generateAvatar(newChild.seed)
      });
      
      setNewChild({ name: '', age: 8, seed: Math.random().toString() });
      setIsAddingChild(false);
    }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Child Profiles</h2>
        <button
          onClick={() => setIsAddingChild(true)}
          className="btn-primary btn-sm"
        >
          <PlusCircle size={16} className="mr-1" />
          Add Child
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {children.map(child => (
          <div 
            key={child.id}
            className="bg-gray-50 p-4 rounded-xl flex items-center space-x-3 relative group"
          >
            <div className="w-16 h-16 flex-shrink-0 bg-primary-100 rounded-full overflow-hidden flex items-center justify-center">
              {child.avatar ? (
                <img src={child.avatar} alt={child.name} className="w-full h-full object-cover" />
              ) : (
                <User size={32} className="text-primary-500" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold">{child.name}</h3>
              <p className="text-gray-600 text-sm">Age: {child.age}</p>
            </div>
            <button
              onClick={() => navigate(`/edit-profile/${child.id}`)}
              className="absolute top-2 right-2 p-2 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
            >
              <Pencil size={14} className="text-gray-500" />
            </button>
          </div>
        ))}
      </div>

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
                onClick={() => setIsAddingChild(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
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
                    className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
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
                  required
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
                >
                  {[6, 7, 8, 9, 10, 11, 12].map(age => (
                    <option key={age} value={age}>{age} years old</option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddingChild(false)}
                  className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Add Profile
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