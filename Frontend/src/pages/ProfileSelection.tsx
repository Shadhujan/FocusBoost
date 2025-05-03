import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, PlusCircle } from 'lucide-react';
import Logo from '../components/shared/Logo';
import { useUser } from '../context/UserContext';

const ProfileSelection: React.FC = () => {
  const navigate = useNavigate();
  const { children, selectChild } = useUser();

  useEffect(() => {
    // If no children profiles exist, redirect to parent dashboard to create some
    if (children.length === 0) {
      navigate('/parent-dashboard');
    }
  }, [children, navigate]);

  const handleSelectProfile = (childId: string) => {
    selectChild(childId);
    navigate('/study-session');
  };

  return (
    <div className="min-h-screen container mx-auto px-4 py-8">
      <header className="flex justify-between items-center mb-12">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-primary-500 hover:text-primary-600"
        >
          <ChevronLeft size={20} className="mr-1" />
          Back to Home
        </button>
        <Logo />
      </header>
      
      <div className="text-center mb-12">
        <motion.h1 
          className="text-3xl md:text-4xl font-bold mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Who's learning today?
        </motion.h1>
        <motion.p 
          className="text-xl text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Choose your profile to start a focus session!
        </motion.p>
      </div>
      
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-4xl mx-auto"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        initial="hidden"
        animate="show"
      >
        {children.map((child) => (
          <motion.div
            key={child.id}
            variants={{
              hidden: { opacity: 0, scale: 0.8 },
              show: { opacity: 1, scale: 1 }
            }}
            whileHover={{ y: -5, scale: 1.03 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <button
              onClick={() => handleSelectProfile(child.id)}
              className="w-full bg-white rounded-3xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300"
            >
              <div className="w-24 h-24 bg-primary-100 rounded-full mx-auto mb-4 overflow-hidden">
                {child.avatar ? (
                  <img 
                    src={child.avatar} 
                    alt={child.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary-500 text-4xl">
                    {child.name.charAt(0)}
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold mb-1">{child.name}</h2>
              <p className="text-gray-600">Age {child.age}</p>
            </button>
          </motion.div>
        ))}
        
        <motion.div
          variants={{
            hidden: { opacity: 0, scale: 0.8 },
            show: { opacity: 1, scale: 1 }
          }}
          whileHover={{ y: -5 }}
        >
          <button
            onClick={() => navigate('/parent-dashboard')}
            className="w-full h-full bg-gray-100 rounded-3xl p-6 text-center flex flex-col items-center justify-center min-h-[220px] hover:bg-gray-200 transition-colors"
          >
            <PlusCircle size={48} className="text-gray-400 mb-4" />
            <p className="text-gray-600 font-medium">Add Profile</p>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ProfileSelection;