import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import StudySession from './pages/StudySession';
import ParentDashboard from './pages/ParentDashboard';
import ProfileSelection from './pages/ProfileSelection';
import EditProfile from './pages/EditProfile';
import { UserProvider } from './context/UserContext';

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/profiles" element={<ProfileSelection />} />
            <Route path="/study-session" element={<StudySession />} />
            <Route path="/parent-dashboard" element={<ParentDashboard />} />
            <Route path="/edit-profile/:id" element={<EditProfile />} />
          </Routes>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;