import Logo from './Logo';
import LogoutButton from './LogoutButton';

const Header = () => {
  return (
    <header className="container mx-auto px-4 py-6 flex justify-between items-center">
      <Logo />
      <LogoutButton />
    </header>
  );
};

export default Header; 