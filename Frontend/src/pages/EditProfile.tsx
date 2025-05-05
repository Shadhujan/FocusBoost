import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Save } from 'lucide-react';
import { useUser } from '../context/UserContext';
import Logo from '../components/shared/Logo';
import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { children, isParentMode } = useUser();
  const [profile, setProfile] = useState({
    name: '',
    age: 8,
    seed: '',
  });

  useEffect(() => {
    if (!isParentMode) {
      navigate('/parent-dashboard');
      return;
    }

    const child = children.find(c => c.id === id);
    if (!child) {
      navigate('/parent-dashboard');
      return;
    }

    setProfile({
      name: child.name,
      age: child.age,
      seed: id || Math.random().toString(),
    });
  }, [id, children, isParentMode, navigate]);

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
    setProfile(prev => ({
      ...prev,
      seed: Math.random().toString()
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Update child profile logic would go here
    // For now, just navigate back
    navigate('/parent-dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <button 
            onClick={() => navigate('/parent-dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={18} className="mr-1" />
            Back to Dashboard
          </button>
          <Logo />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>
          
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <form onSubmit={handleSubmit}>
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="w-40 h-40 rounded-full overflow-hidden bg-primary-50">
                    <img 
                      src={generateAvatar(profile.seed)} 
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={regenerateAvatar}
                    className="absolute bottom-2 right-2 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50"
                  >
                    <RefreshCw size={20} className="text-primary-500" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                    Child's Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="input"
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="age" className="block text-gray-700 font-medium mb-2">
                    Age
                  </label>
                  <select
                    id="age"
                    className="input"
                    value={profile.age}
                    onChange={(e) => setProfile({...profile, age: parseInt(e.target.value)})}
                  >
                    {[6, 7, 8, 9, 10, 11, 12].map(age => (
                      <option key={age} value={age}>{age} years old</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mt-8 flex space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/parent-dashboard')}
                  className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 flex items-center justify-center"
                >
                  <Save size={20} className="mr-2" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditProfile;