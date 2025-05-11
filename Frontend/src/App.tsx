import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import StudySession from './pages/StudySession';
import ParentDashboard from './pages/ParentDashboard';
import ProfileSelection from './pages/ProfileSelection';
import EditProfile from './pages/EditProfile';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ResetPassword from './pages/auth/ResetPassword';
import { UserProvider } from './context/UserContext';
import { useEffect, useState } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });

    return () => unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return null; // Or a loading spinner
  }

  return (
    <UserProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            
            {/* Protected Routes */}
            <Route
              path="/profiles"
              element={isAuthenticated ? <ProfileSelection /> : <Navigate to="/auth/login" />}
            />
            <Route
              path="/study-session"
              element={isAuthenticated ? <StudySession /> : <Navigate to="/auth/login" />}
            />
            <Route
              path="/parent-dashboard"
              element={isAuthenticated ? <ParentDashboard /> : <Navigate to="/auth/login" />}
            />
            <Route
              path="/edit-profile/:id"
              element={isAuthenticated ? <EditProfile /> : <Navigate to="/auth/login" />}
            />
          </Routes>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;