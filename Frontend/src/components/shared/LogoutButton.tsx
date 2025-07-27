import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useUser } from '../../context/UserContext';

const LogoutButton = () => {
  const navigate = useNavigate();
  const { logout } = useUser();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
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