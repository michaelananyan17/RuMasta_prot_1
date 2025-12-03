import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authcontext';
import { getAssignmentsByLevel, saveUserProgress, checkLevelCompletion } from '../services/assignmentService';
import LevelCompletionPopup from './LevelCompletionPopup';
import './AssignmentInterface.css';

function AssignmentInterface({ currentLevel = 'A1-1', onLevelChange, onAssignmentComplete }) {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [currentAssignmentIndex, setCurrentAssignmentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [score, setScore] = useState(0);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [completedAssignments, setCompletedAssignments] = useState(0);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [totalAssignmentsInLevel, setTotalAssignmentsInLevel] = useState(0);

  const currentAssignment = assignments[currentAssignmentIndex];
  const ASSIGNMENTS_PER_LEVEL = 10;

  useEffect(() => {
    loadAssignments();
  }, [currentLevel]);

  const getRandomSubset = (array, count) => {
    if (array.length <= count) return [...array];
    
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  const shuffleArray = (array) => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const assignmentsData = await getAssignmentsByLevel(currentLevel || 'A1-1');
      
      if (!assignmentsData || assignmentsData.length === 0) {
        console.warn(`No assignments found for level ${currentLevel}`);
        setAssignments([]);
        setCurrentAssignmentIndex(0);
        setTotalAssignmentsInLevel(0);
        return;
      }
      
      setTotalAssignmentsInLevel(assignmentsData.length);
      
      let selectedAssignments;
      if (assignmentsData.length >= ASSIGNMENTS_PER_LEVEL) {
        selectedAssignments = getRandomSubset(assignmentsData, ASSIGNMENTS_PER_LEVEL);
      } else {
        selectedAssignments = assignmentsData;
        console.warn(`Only ${assignmentsData.length} questions available for level ${currentLevel}, need ${ASSIGNMENTS_PER_LEVEL}`);
      }
      
      const transformedAssignments = selectedAssignments.map(assignment => {
        if (!assignment) return null;
        
        const incorrectAnswers = Array.isArray(assignment.incorrect_answers) 
          ? assignment.incorrect_answers 
          : [];
        const correctAnswer = assignment.correct_answer || '';
        
        const options = [
          ...incorrectAnswers,
          correctAnswer
        ].filter(option => option !== null && option !== undefined);
        
        const shuffledOptions = shuffleArray(options);
        
        return {
          ...assignment,
          id: assignment.id || Date.now() + Math.random(),
          options: shuffledOptions,
          completed: false,
          completedCorrectly: false
        };
      }).filter(assignment => assignment !== null);
      
      const finalAssignments = shuffleArray(transformedAssignments);
      
      setAssignments(finalAssignments);
      setCurrentAssignmentIndex(0);
      setShowCompletionPopup(false);
      setSelectedAnswer(null);
      setShowResult(false);
      setAttempts(0);
      setScore(0);
      setTotalMistakes(0);
      setCompletedAssignments(0);
      setAssignmentHistory([]);
    } catch (error) {
      console.error('Error loading assignments:', error);
      setAssignments([]);
      setTotalAssignmentsInLevel(0);
    } finally {
      setLoading(false);
    }
  };

  const getNextLevel = (currentLevel) => {
    const levels = ['A1-1', 'A1-2', 'A1-3', 'A2-1', 'A2-2', 'A2-3', 'B1-1', 'B1-2', 'B1-3'];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  };

  const handleAnswerSelect = (index) => {
    if (!showResult && currentAssignment) {
      setSelectedAnswer(index);
    }
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null || !currentAssignment) return;

    const selectedOption = currentAssignment.options[selectedAnswer];
    const isCorrect = selectedOption === currentAssignment.correct_answer;
    
    setShowResult(true);
    setAttempts(prevAttempts => prevAttempts + 1);
    
    if (!currentAssignment.completed) {
      const updatedAssignments = [...assignments];
      updatedAssignments[currentAssignmentIndex] = {
        ...currentAssignment,
        completed: true,
        completedCorrectly: isCorrect && attempts === 0
      };
      setAssignments(updatedAssignments);
      
      if (isCorrect && attempts === 0) {
        setScore(prevScore => prevScore + 1);
        setCompletedAssignments(prev => prev + 1);
        setAssignmentHistory(prev => [...prev, { 
          assignmentId: currentAssignment.id, 
          completed: true, 
          attempts: attempts + 1 
        }]);
      } else if (!isCorrect) {
        setTotalMistakes(prevMistakes => prevMistakes + 1);
      }
    }

    if (user && currentAssignment.id) {
      try {
        await saveUserProgress(
          user.id, 
          currentAssignment.id, 
          isCorrect, 
          attempts + 1
        );
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    }
  };

  const handleContinue = async () => {
    setShowResult(false);
    setSelectedAnswer(null);
    setAttempts(0);
    
    const isLastQuestion = currentAssignmentIndex >= assignments.length - 1;
    
    if (!isLastQuestion) {
      setCurrentAssignmentIndex(prevIndex => prevIndex + 1);
    } else {
      if (currentAssignment && !currentAssignment.completed) {
        const updatedAssignments = [...assignments];
        updatedAssignments[currentAssignmentIndex] = {
          ...currentAssignment,
          completed: true
        };
        setAssignments(updatedAssignments);
      }
      
      const allAssignmentsCompleted = assignments.every(assignment => assignment.completed);
      
      if (allAssignmentsCompleted) {
        const passingGrade = 8;
        const passed = score >= passingGrade;
        
        if (user) {
          try {
            await checkLevelCompletion(user.id, currentLevel, {
              completed: passed,
              score: score,
              totalQuestions: ASSIGNMENTS_PER_LEVEL,
              mistakes: totalMistakes,
              assignmentsCompleted: completedAssignments,
              passingGrade: passingGrade,
              totalAvailableInLevel: totalAssignmentsInLevel
            });
          } catch (error) {
            console.error('Error saving level completion:', error);
          }
        }
        
        setShowCompletionPopup(true);
        
        if (onAssignmentComplete) {
          onAssignmentComplete({
            level: currentLevel,
            completed: passed,
            score: score,
            totalQuestions: ASSIGNMENTS_PER_LEVEL,
            mistakes: totalMistakes,
            assignmentsCompleted: completedAssignments,
            passingGrade: passingGrade,
            totalAvailableInLevel: totalAssignmentsInLevel
          });
        }
      } else {
        console.warn("Not all assignments marked as completed, but reached end");
        setShowCompletionPopup(true);
      }
    }
  };

  const handleNextLevel = () => {
    const nextLevel = getNextLevel(currentLevel);
    setShowCompletionPopup(false);
    
    if (nextLevel && onLevelChange) {
      onLevelChange(nextLevel);
    } else if (nextLevel) {
      window.dispatchEvent(new CustomEvent('levelChange', {
        detail: { 
          level: nextLevel,
          timestamp: Date.now()
        }
      }));
      
      window.history.pushState({}, '', `/?level=${nextLevel}`);
      loadAssignments();
    } else {
      console.log('Congratulations! You have completed all available levels.');
      alert('Congratulations! You have completed all available levels.');
    }
  };

  const handleRetryLevel = () => {
    setShowCompletionPopup(false);
    loadAssignments();
  };

  const calculateProgress = () => {
    if (assignments.length === 0) return 0;
    return Math.round((completedAssignments / assignments.length) * 100);
  };

  if (loading) {
    return (
      <div className="assignment-interface">
        <div className="loading">
          Loading 10 random assignments for level {currentLevel}...
          {totalAssignmentsInLevel > 0 && (
            <div className="loading-subtext">
              (Selected from {totalAssignmentsInLevel} available questions)
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <div className="assignment-interface">
        <div className="error">
          <h3>No assignments available</h3>
          <p>No assignments found for level {currentLevel}.</p>
          <button onClick={loadAssignments} className="retry-button">
            Try Again
          </button>
          {onLevelChange && (
            <button 
              onClick={() => onLevelChange('A1-1')}
              className="home-button"
              style={{marginLeft: '10px'}}
            >
              Go to First Level
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!currentAssignment) {
    return (
      <div className="assignment-interface">
        <div className="error">
          <h3>Assignment Error</h3>
          <p>Unable to load current assignment.</p>
          <button onClick={loadAssignments} className="retry-button">
            Reload Assignments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="assignment-interface">
      <div className="assignment-content">
        <div className="level-info">
          <h2>Level: {currentLevel}</h2>
          <div className="progress-info">
            <span className="progress-text">
              Question {currentAssignmentIndex + 1} of {ASSIGNMENTS_PER_LEVEL}
            </span>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
            <span className="score-display">
              Score: {score}/{ASSIGNMENTS_PER_LEVEL}
            </span>
          </div>
          {totalAssignmentsInLevel > ASSIGNMENTS_PER_LEVEL && (
            <div className="random-notice">
              <small>
                ⚡ This level contains {totalAssignmentsInLevel} questions. 
                You are answering 10 random questions each attempt.
              </small>
            </div>
          )}
        </div>
        
        <h3 className="question">{currentAssignment.question_text}</h3>
        
        {currentAssignment.image_url && (
          <div className="question-image">
            <img src={currentAssignment.image_url} alt="Question illustration" />
          </div>
        )}
        
        <div className="options-container">
          {currentAssignment.options && currentAssignment.options.map((option, index) => (
            <div
              key={index}
              className={`option ${selectedAnswer === index ? 'selected' : ''} ${
                showResult ? (option === currentAssignment.correct_answer ? 'correct' : 'incorrect') : ''
              }`}
              onClick={() => handleAnswerSelect(index)}
            >
              <span className="option-letter">{String.fromCharCode(65 + index)}</span>
              <span className="option-text">{option}</span>
              {showResult && option === currentAssignment.correct_answer && (
                <span className="correct-indicator">✓</span>
              )}
            </div>
          ))}
        </div>
        
        {showResult && (
          <div className={`result ${currentAssignment.options[selectedAnswer] === currentAssignment.correct_answer ? 'success' : 'error'}`}>
            {currentAssignment.options[selectedAnswer] === currentAssignment.correct_answer ? (
              <div>
                <h4>✅ Correct!</h4>
                <p className="explanation">{currentAssignment.explanation}</p>
                <div className="result-stats">
                  <span>Attempts: {attempts}</span>
                  <span>Score: {score}/{ASSIGNMENTS_PER_LEVEL}</span>
                  <span>Progress: {completedAssignments}/{ASSIGNMENTS_PER_LEVEL}</span>
                </div>
              </div>
            ) : (
              <div>
                <h4>❌ Incorrect</h4>
                <p>The correct answer is: <strong>{currentAssignment.correct_answer}</strong></p>
                <p className="explanation">{currentAssignment.explanation}</p>
                <div className="result-stats">
                  <span>Attempts: {attempts}</span>
                  <span>Score: {score}/{ASSIGNMENTS_PER_LEVEL}</span>
                  <span>Mistakes: {totalMistakes}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="assignment-footer">
        {!showResult ? (
          <button 
            className={`submit-button ${selectedAnswer === null ? 'disabled' : ''}`}
            onClick={handleSubmit}
            disabled={selectedAnswer === null}
          >
            {selectedAnswer === null ? 'Select an Answer' : 'Check Answer'}
          </button>
        ) : (
          <button className="continue-button" onClick={handleContinue}>
            {currentAssignmentIndex < ASSIGNMENTS_PER_LEVEL - 1 ? 
              'Continue to Next Question →' : 
              'Finish Level'
            }
          </button>
        )}
      </div>
      
      {showCompletionPopup && (
        <LevelCompletionPopup
          username={user?.user_metadata?.username || user?.email?.split('@')[0] || 'Student'}
          currentLevel={currentLevel}
          nextLevel={getNextLevel(currentLevel)}
          mistakes={totalMistakes}
          totalQuestions={ASSIGNMENTS_PER_LEVEL}
          score={score}
          onNextLevel={handleNextLevel}
          onRetry={handleRetryLevel}
          onClose={() => {
            setShowCompletionPopup(false);
            setCurrentAssignmentIndex(0);
          }}
        />
      )}
    </div>
  );
}

export default AssignmentInterface;