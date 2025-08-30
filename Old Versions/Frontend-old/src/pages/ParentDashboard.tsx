import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, User } from 'lucide-react';
import Logo from '../components/shared/Logo';
import DashboardCharts from '../components/parent/DashboardCharts';
import ProfileManager from '../components/parent/ProfileManager';
import { useUser } from '../context/UserContext';

const ParentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { children, isParentMode, toggleParentMode } = useUser();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // Redirect if not in parent mode and there are no children profiles
  useEffect(() => {
    if (!isParentMode && children.length === 0) {
      toggleParentMode(); // Auto-enable parent mode if no profiles exist
    } else if (!isParentMode) {
      navigate('/profiles');
    }
  }, [isParentMode, children, navigate, toggleParentMode]);

  useEffect(() => {
    // Set first child as selected by default
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <button 
            onClick={() => {
              toggleParentMode();
              navigate('/');
            }}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={18} className="mr-1" />
            Exit Parent Mode
          </button>
          <Logo />
          <button className="text-gray-600 hover:text-gray-800">
            <Settings size={20} />
          </button>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Parent Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow p-4 mb-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <User size={20} className="mr-2 text-primary-500" />
                Child Profiles
              </h2>
              
              {children.length > 0 ? (
                <div className="space-y-3">
                  {children.map(child => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChildId(child.id)}
                      className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                        selectedChildId === child.id
                          ? 'bg-primary-50 border border-primary-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200">
                        {child.avatar ? (
                          <img 
                            src={child.avatar} 
                            alt={child.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary-500">
                            {child.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">{child.name}</div>
                        <div className="text-sm text-gray-500">Age {child.age}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  No profiles created yet
                </div>
              )}
            </div>
            
            <div className="bg-primary-50 rounded-xl p-4">
              <h3 className="font-bold mb-2">Need Help?</h3>
              <p className="text-sm text-gray-700 mb-3">
                Learn how to get the most out of FocusBoost with our parent guides.
              </p>
              <a 
                href="#"
                className="text-primary-500 hover:text-primary-600 text-sm font-medium"
              >
                Read Parent Guide →
              </a>
            </div>
          </div>
          
          <div className="lg:col-span-3">
            {selectedChildId ? (
              <DashboardCharts childId={selectedChildId} />
            ) : (
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <h2 className="text-xl font-bold mb-2">No Child Selected</h2>
                <p className="text-gray-600 mb-4">
                  Please select a child from the sidebar to view their focus data.
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-10">
          <ProfileManager />
        </div>
      </main>
    </div>
  );
};

export default ParentDashboard;