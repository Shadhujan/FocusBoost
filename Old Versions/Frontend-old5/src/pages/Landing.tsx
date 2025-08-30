// src/pages/Landing.tsx
// Updated to handle authentication state properly

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Users, Shield, ArrowRight, LogOut, User } from 'lucide-react';
import { useUser } from '../context/UserContext';
import Logo from '../components/shared/Logo';
import ParentLogin from '../components/shared/ParentLogin';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, children, logout, loading } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showParentLogin, setShowParentLogin] = useState(false);

  const handleStartLearning = () => {
    if (!isAuthenticated) {
      // Not logged in - redirect to login with return path to profiles
      navigate('/auth/login', { 
        state: { from: { pathname: '/profiles' } } 
      });
      return;
    }

    // Logged in - check if they have children
    if (children.length === 0) {
      // No children - redirect to parent dashboard to create profiles
      navigate('/parent-dashboard');
    } else {
      // Have children - go to profile selection
      navigate('/profiles');
    }
  };

  const handleParentAccess = () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
    } else {
      setShowParentLogin(true);
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    // Stay on landing page after logout
  };

  // Don't render until we know the auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <Logo size="lg" />
        
        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            // Logged in state
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <span className="text-gray-700 font-medium">{user.fullName}</span>
              </button>
              
              {/* User menu dropdown */}
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-50"
                >
                  <div className="p-3 border-b">
                    <p className="font-medium text-gray-800">{user.fullName}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  
                  <div className="p-1">
                    <button
                      onClick={() => {
                        setShowParentLogin(true);
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      Parent Dashboard
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md transition-colors text-red-600 flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            // Not logged in state
            <button 
              onClick={() => navigate('/auth/login')}
              className="btn-sm bg-white hover:bg-gray-100 text-primary-500 font-medium"
            >
              Login
            </button>
          )}
        </div>
      </header>

      {/* Parent Login Modal */}
      {showParentLogin && (
        <ParentLogin onClose={() => setShowParentLogin(false)} />
      )}
      
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {isAuthenticated && user ? (
              // Personalized greeting for logged in users
              <div className="mb-6">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800 leading-tight">
                  Welcome back, <span className="text-primary-500">{user.fullName.split(' ')[0]}!</span>
                </h1>
                {children.length > 0 ? (
                  <p className="text-xl text-gray-600">
                    Ready to continue learning with {children.length} child{children.length > 1 ? 'ren' : ''} profile{children.length > 1 ? 's' : ''}?
                  </p>
                ) : (
                  <p className="text-xl text-gray-600">
                    Let's create your first child profile to get started!
                  </p>
                )}
              </div>
            ) : (
              // Default greeting for visitors
              <div className="mb-6">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800 leading-tight">
                  Learning is more fun when you <span className="text-primary-500">stay focused!</span>
                </h1>
                <p className="text-xl text-gray-600">
                  FocusBoost helps kids ages 8-10 improve concentration and learning skills through fun, interactive study sessions.
                </p>
              </div>
            )}
            
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={handleStartLearning}
                className="btn-primary btn-lg"
              >
                {isAuthenticated ? (
                  children.length > 0 ? 'Continue Learning' : 'Create Profile'
                ) : (
                  'Start Learning'
                )}
                <ArrowRight className="ml-2" size={20} />
              </button>
              
              {!isAuthenticated && (
                <button 
                  onClick={handleParentAccess}
                  className="btn-lg border-2 border-primary-500 text-primary-500 hover:bg-primary-50"
                >
                  Parent Dashboard
                </button>
              )}
            </div>

            {/* Status indicators for logged in users */}
            {isAuthenticated && (
              <div className="mt-6 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Logged in
                </div>
                
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                  <Users size={14} />
                  {children.length} Profile{children.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center"
          >
            <img 
              src="https://images.pexels.com/photos/8535214/pexels-photo-8535214.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
              alt="Child learning on tablet" 
              className="rounded-3xl shadow-xl max-w-full h-auto"
            />
          </motion.div>
        </div>
        
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">How FocusBoost Helps</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              className="card text-center"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="bg-primary-100 text-primary-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Focus Tracking</h3>
              <p className="text-gray-600">
                Our friendly AI watches your child's attention and helps them stay on task with gentle reminders.
              </p>
            </motion.div>
            
            <motion.div 
              className="card text-center"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="bg-secondary-100 text-secondary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Parent Insights</h3>
              <p className="text-gray-600">
                See how your child is progressing with detailed reports on focus, study time, and learning patterns.
              </p>
            </motion.div>
            
            <motion.div 
              className="card text-center"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="bg-accent-100 text-accent-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Privacy First</h3>
              <p className="text-gray-600">
                We never store video of your child. All focus tracking happens on your device, not in the cloud.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Call to action for non-authenticated users */}
        {!isAuthenticated && (
          <div className="mt-24 text-center">
            <div className="bg-primary-50 rounded-2xl p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-gray-600 mb-6">
                Create your free account and help your child develop better focus and study habits today.
              </p>
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => navigate('/auth/signup')}
                  className="btn-primary"
                >
                  Create Account
                </button>
                <button 
                  onClick={() => navigate('/auth/login')}
                  className="btn border-2 border-primary-500 text-primary-500 hover:bg-primary-50"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <footer className="bg-gray-50 py-12 mt-24">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <Logo size="md" />
          <p className="mt-4">© 2025 FocusBoost. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <a href="#" className="text-primary-500 hover:underline">Privacy Policy</a>
            <a href="#" className="text-primary-500 hover:underline">Terms of Service</a>
            <a href="#" className="text-primary-500 hover:underline">Help Center</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;