import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Users, Shield, ArrowRight } from 'lucide-react';
import Logo from '../components/shared/Logo';
import ParentLogin from '../components/shared/ParentLogin';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [showParentLogin, setShowParentLogin] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <Logo size="lg" />
        <button 
          onClick={() => setShowParentLogin(true)}
          className="btn-sm bg-white hover:bg-gray-100 text-primary-500 font-medium"
        >
          Parent Access
        </button>
      </header>
      
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800 leading-tight">
              Learning is more fun when you <span className="text-primary-500">stay focused!</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              FocusBoost helps kids ages 8-10 improve concentration and learning skills through fun, interactive study sessions.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigate('/profiles')}
                className="btn-primary btn-lg"
              >
                Start Learning
                <ArrowRight className="ml-2" size={20} />
              </button>
              <button 
                onClick={() => setShowParentLogin(true)}
                className="btn-lg border-2 border-primary-500 text-primary-500 hover:bg-primary-50"
              >
                Parent Dashboard
              </button>
            </div>
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
      
      {showParentLogin && <ParentLogin onClose={() => setShowParentLogin(false)} />}
    </div>
  );
};

export default Landing;