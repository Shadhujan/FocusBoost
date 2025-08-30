import { Sparkles } from 'lucide-react';

const Logo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div className={`flex items-center ${sizeClasses[size]}`}>
      <div className="bg-primary-500 text-white p-2 rounded-full mr-2">
        <Sparkles size={size === 'sm' ? 16 : size === 'md' ? 20 : 24} />
      </div>
      <span className="font-bold">Focus<span className="text-primary-500">Boost</span></span>
    </div>
  );
};

export default Logo;