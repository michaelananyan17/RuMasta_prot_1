import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authcontext';
import { getUserProgress } from '../services/assignmentService';
import './Dashboard.css';

function Dashboard({ currentLevel, onStartLearning }) {
  const { user } = useAuth();
  const [userProgress, setUserProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProgress();
  }, [user]);

  const loadUserProgress = async () => {
    if (!user) return;
    
    try {
      const progress = await getUserProgress(user.id, currentLevel);
      setUserProgress(progress);
    } catch (error) {
      console.error('Error loading user progress:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress statistics
  const completedAssignments = userProgress.filter(p => p.completed).length;
  const correctAnswers = userProgress.filter(p => p.completed_correctly).length;
  const progressPercentage = completedAssignments > 0 ? Math.round((correctAnswers / completedAssignments) * 100) : 0;

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading your progress...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="user-welcome">
        <h2>Welcome back, {user?.user_metadata?.username || 'Student'}!</h2>
        <p>Let's continue your Russian language journey</p>
      </div>
      
      <div className="progress-section">
        <div className="level-info">
          <h3>Current Level: {currentLevel || 'A1-1'}</h3>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <span>{progressPercentage}% Success Rate</span>
        </div>
        
        <div className="quick-stats">
          <div className="stat">
            <h4>Assignments Completed</h4>
            <p>{completedAssignments}</p>
          </div>
          <div className="stat">
            <h4>Correct Answers</h4>
            <p>{correctAnswers}</p>
          </div>
          <div className="stat">
            <h4>Success Rate</h4>
            <p>{progressPercentage}%</p>
          </div>
        </div>
      </div>
      
      <button className="resume-button" onClick={onStartLearning}>
        {completedAssignments > 0 ? 'Resume Learning' : 'Start Learning'}
      </button>
    </div>
  );
}

export default Dashboard;
