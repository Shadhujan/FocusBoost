// src/pages/EditProfile.tsx
// Updated to use backend API for child profile management

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Save, AlertCircle } from 'lucide-react';
import { useUser } from '../context/UserContext';
import Logo from '../components/shared/Logo';

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { children, isParentMode, updateChild, childrenLoading } = useUser();
  
  const [profile, setProfile] = useState({
    name: '',
    age: 8,
    seed: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Find the child being edited
  const child = children.find(c => c.id === id);

  useEffect(() => {
    if (!isParentMode) {
      navigate('/parent-dashboard');
      return;
    }

    if (!child && !childrenLoading) {
      console.error('Child not found:', id);
      navigate('/parent-dashboard');
      return;
    }

    if (child) {
      setProfile({
        name: child.name,
        age: child.age,
        seed: child.seed || id || Math.random().toString(),
      });
    }
  }, [id, child, isParentMode, navigate, childrenLoading]);

  const generateAvatar = (seed: string) => {
    // Generate avatar URL using DiceBear API (same as backend)
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,ffd5dc,ffdfbf&backgroundType=solid`;
  };

  const regenerateAvatar = () => {
    const newSeed = Math.random().toString(36).substring(2, 15);
    setProfile(prev => ({
      ...prev,
      seed: newSeed
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!child) {
      setError('Child profile not found');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      console.log('✏️ Updating child profile:', profile);

      const updatedChild = await updateChild(child.id, {
        name: profile.name,
        age: profile.age,
        seed: profile.seed
      });

      if (updatedChild) {
        console.log('✅ Profile updated successfully');
        setSuccess(true);
        
        // Navigate back after a short delay
        setTimeout(() => {
          navigate('/parent-dashboard');
        }, 1500);
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } catch (error: any) {
      console.error('🚨 Error updating profile:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while children are being loaded
  if (childrenLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show error if child not found
  if (!child) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Child profile not found</p>
          <button 
            onClick={() => navigate('/parent-dashboard')}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <button 
            onClick={() => navigate('/parent-dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={18} className="mr-1" />
            Back to Dashboard
          </button>
          <Logo />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">Edit Profile</h1>
            <p className="text-gray-600">Update {child.name}'s profile information</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-lg p-6"
          >
            {error && (
              <div className="mb-6 p-4 bg-error-50 text-error-700 rounded-xl flex items-center">
                <AlertCircle size={20} className="mr-2 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-success-50 text-success-700 rounded-xl">
                <p className="text-sm">Profile updated successfully! Redirecting...</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="w-40 h-40 rounded-full overflow-hidden bg-primary-50 ring-4 ring-white shadow-lg">
                    <img 
                      src={generateAvatar(profile.seed)} 
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={regenerateAvatar}
                    className="absolute bottom-2 right-2 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                    title="Generate new avatar"
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
                    placeholder="Enter child's name"
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
                  className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 flex-1 transition-colors"
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
                    <>
                      <Save size={20} className="mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default EditProfile;