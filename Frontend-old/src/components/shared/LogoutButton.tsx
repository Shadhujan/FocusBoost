import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="btn-sm bg-white hover:bg-gray-100 text-primary-500 font-medium flex items-center gap-2"
    >
      <LogOut size={20} />
      Logout
    </button>
  );
};

export default LogoutButton; 