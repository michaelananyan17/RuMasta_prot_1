import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import AssignmentInterface from './components/AssignmentInterface';
import LevelSelection from './components/LevelSelection';
import LoginForm from './components/LoginForm';
import EmailVerification from './components/EmailVerification';
import { useAuth } from './context/authcontext';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentLevel, setCurrentLevel] = useState('A1-1');
  const { user, authState, signOut } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize level from URL or localStorage
  useEffect(() => {
    const initializeLevel = () => {
      // First check URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const levelFromUrl = urlParams.get('level');
      
      if (levelFromUrl) {
        // Validate level format
        const validLevels = ['A1-1', 'A1-2', 'A1-3', 'A2-1', 'A2-2', 'A2-3', 'B1-1', 'B1-2', 'B1-3'];
        if (validLevels.includes(levelFromUrl)) {
          setCurrentLevel(levelFromUrl);
          localStorage.setItem('russianMaster_currentLevel', levelFromUrl);
          
          // Clean URL without page reload
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
      } else {
        // Check localStorage for saved level
        const savedLevel = localStorage.getItem('russianMaster_currentLevel');
        if (savedLevel) {
          setCurrentLevel(savedLevel);
        }
      }
      
      setIsInitialized(true);
    };

    if (!isInitialized) {
      initializeLevel();
    }
  }, [isInitialized]);

  // Handle level change from AssignmentInterface
  const handleLevelChange = (newLevel) => {
    setCurrentLevel(newLevel);
    localStorage.setItem('russianMaster_currentLevel', newLevel);
    
    // Optionally update URL (commented out to avoid conflicts)
    // window.history.pushState({}, '', `/?level=${newLevel}`);
    
    // Switch back to dashboard to see progress
    setCurrentView('dashboard');
    
    console.log(`Level changed to: ${newLevel}`);
  };

  const handleStartLearning = () => {
    setCurrentView('assignment');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleLevelSelect = (levelId) => {
    setCurrentLevel(levelId);
    localStorage.setItem('russianMaster_currentLevel', levelId);
    setCurrentView('dashboard');
  };

  const showLevelSelection = () => {
    setCurrentView('level-selection');
  };

  const getLevelDisplayName = (levelCode) => {
    const levelNames = {
      'A1-1': 'Beginner A1-1',
      'A1-2': 'Beginner A1-2', 
      'A1-3': 'Beginner A1-3',
      'A2-1': 'Elementary A2-1',
      'A2-2': 'Elementary A2-2',
      'A2-3': 'Elementary A2-3',
      'B1-1': 'Intermediate B1-1',
      'B1-2': 'Intermediate B1-2',
      'B1-3': 'Intermediate B1-3'
    };
    return levelNames[levelCode] || levelCode;
  };

  // Helper function to get next level
  const getNextLevel = (currentLevel) => {
    const levels = ['A1-1', 'A1-2', 'A1-3', 'A2-1', 'A2-2', 'A2-3', 'B1-1', 'B1-2', 'B1-3'];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  };

  // Listen for custom events for backward compatibility
  useEffect(() => {
    const handleLevelChangeEvent = (event) => {
      if (event.detail?.level) {
        console.log('Received levelChange event:', event.detail.level);
        handleLevelChange(event.detail.level);
      }
    };

    window.addEventListener('levelChange', handleLevelChangeEvent);

    return () => {
      window.removeEventListener('levelChange', handleLevelChangeEvent);
    };
  }, []);

  if (authState === 'unauthenticated') {
    return <LoginForm />;
  }

  if (authState === 'unverified') {
    return <EmailVerification />;
  }

  if (authState === 'loading' || !isInitialized) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your learning journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        {/* Left section - empty for now, can be used for future elements */}
        <div className="header-left"></div>
        
        {/* Center section - Title */}
        <div className="header-center">
          <h1>RuMasta App</h1>
        </div>
        
        {/* Right section - Navigation buttons */}
        <div className="header-right">
          <div className="user-info">
            <div className="level-display">
              <span className="level-badge">{getLevelDisplayName(currentLevel)}</span>
              <span className="welcome-text">
                Welcome, {user?.user_metadata?.username || user?.email?.split('@')[0] || 'Student'}!
              </span>
            </div>
            <div className="nav-buttons">
              <button 
                className="nav-button change-level" 
                onClick={showLevelSelection}
                title="Change your current learning level"
              >
                📚 Change Level
              </button>
              <button 
                className="nav-button logout" 
                onClick={signOut}
                title="Log out of your account"
              >
                🔓 Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="app-main">
        {/* Navigation buttons for specific views */}
        <div className="view-navigation">
          {currentView === 'assignment' && (
            <button className="back-button" onClick={handleBackToDashboard}>
              ← Back to Dashboard
            </button>
          )}
          {currentView === 'level-selection' && (
            <button className="back-button" onClick={() => setCurrentView('dashboard')}>
              ← Back to Dashboard
            </button>
          )}
        </div>
        
        {/* Main content area */}
        {currentView === 'dashboard' && (
          <Dashboard 
            currentLevel={currentLevel} 
            onStartLearning={handleStartLearning} 
            onLevelChange={handleLevelChange}
            getNextLevel={getNextLevel}
          />
        )}
        {currentView === 'assignment' && (
          <AssignmentInterface 
            currentLevel={currentLevel} 
            onLevelChange={handleLevelChange}
          />
        )}
        {currentView === 'level-selection' && (
          <LevelSelection 
            onLevelSelect={handleLevelSelect} 
            currentLevel={currentLevel} 
          />
        )}
      </main>
      
      <footer className="app-footer">
        <div className="footer-content">
          <p>RuMasta App • Learn Russian Grammar Step by Step</p>
          <div className="progress-info">
            <span>Current Level: {getLevelDisplayName(currentLevel)}</span>
            <span>•</span>
            <span>View: {currentView.charAt(0).toUpperCase() + currentView.slice(1)}</span>
            <span>•</span>
            <span>Next Level: {getNextLevel(currentLevel) || 'Complete!'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
