import React, { useEffect } from 'react';
import './LevelCompletionPopup.css';

function LevelCompletionPopup({ 
  username, 
  currentLevel, 
  nextLevel, 
  onNextLevel, 
  onClose, 
  onRetry,
  mistakes = 0,
  totalQuestions = 10
}) {
  
  const getLevelName = (levelCode) => {
    const levelNames = {
      'A1-1': 'Russian A1-1: Basic Nouns & Gender',
      'A1-2': 'Russian A1-2: Simple Verbs',
      'A1-3': 'Russian A1-3: Basic Sentences',
      'A2-1': 'Russian A2-1: Past Tense',
      'A2-2': 'Russian A2-2: Future Tense',
      'A2-3': 'Russian A2-3: Complex Sentences',
      'B1-1': 'Russian B1-1: Advanced Grammar',
      'B1-2': 'Russian B1-2: Conversation',
      'B1-3': 'Russian B1-3: Fluency'
    };
    return levelNames[levelCode] || levelCode;
  };

  // Calculate star rating based on mistakes
  const calculateStars = () => {
    if (mistakes === 0) return 5;
    if (mistakes === 1) return 4;
    if (mistakes === 2) return 3;
    if (mistakes >= 3) return 0; // Failed level
    return 5; // Default
  };

  const stars = calculateStars();
  const hasPassed = stars >= 3; // 3+ stars means passed
  const hasFailed = mistakes >= 3;
  const scorePercentage = Math.max(0, 100 - (mistakes * 20)); // Each mistake reduces score by 20%

  // Get performance message based on stars
  const getPerformanceMessage = () => {
    if (stars === 5) return "Perfect! Flawless victory!";
    if (stars === 4) return "Excellent! Almost perfect!";
    if (stars === 3) return "Good job! You passed!";
    if (stars === 0) return "Needs improvement. Try again!";
    return "Well done!";
  };

  // Get trophy emoji based on performance
  const getTrophyEmoji = () => {
    if (stars === 5) return "🏆";
    if (stars === 4) return "🥈";
    if (stars === 3) return "🥉";
    return "📘";
  };

  // Render star rating
  const renderStars = () => {
    if (hasFailed) {
      return (
        <div className="stars-container failed">
          <div className="failed-message">
            <span className="failed-icon">❌</span>
            <span className="failed-text">Level Failed</span>
          </div>
          <div className="stars-count">
            {Array(5).fill(0).map((_, i) => (
              <span key={i} className="star empty">☆</span>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="stars-container">
        <div className="stars-display">
          {Array(5).fill(0).map((_, i) => (
            <span 
              key={i} 
              className={`star ${i < stars ? 'filled' : 'empty'}`}
            >
              {i < stars ? '★' : '☆'}
            </span>
          ))}
        </div>
        <div className="stars-rating">
        </div>
      </div>
    );
  };

  // Add confetti effect only for passing grades
  useEffect(() => {
    if (hasPassed) {
      const createConfetti = () => {
        for (let i = 0; i < 20; i++) {
          const confetti = document.createElement('div');
          confetti.className = 'confetti';
          confetti.style.left = `${Math.random() * 100}%`;
          confetti.style.animationDelay = `${Math.random() * 2}s`;
          confetti.style.width = `${Math.random() * 10 + 5}px`;
          confetti.style.height = confetti.style.width;
          document.querySelector('.popup-overlay')?.appendChild(confetti);
        }
      };

      createConfetti();

      return () => {
        document.querySelectorAll('.confetti').forEach(el => el.remove());
      };
    }
  }, [hasPassed]);

  return (
    <div className="popup-overlay" onClick={hasFailed ? onClose : undefined}>
      <div className="level-completion-popup" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <div className="trophy-container">
            <div className="trophy-glow"></div>
            <div className="trophy-icon">{getTrophyEmoji()}</div>
          </div>
          <h2>{hasFailed ? "Level Incomplete" : "Level Complete!"}</h2>
          <div className="performance-message">
            {getPerformanceMessage()}
          </div>
        </div>
        
        <div className="popup-content">
          <div className="congratulations-message">
            <h3>
              {hasFailed ? "Keep practicing," : "Great job,"} 
              <span className="username"> {username}</span>!
            </h3>
            
            {/* Score Circle */}
            <div className="score-display">
              <div 
                className="score-circle" 
                style={{ '--percentage': scorePercentage }}
              >
                <div className="score-percentage">{scorePercentage}%</div>
                <div className="score-details">
                  {totalQuestions - mistakes}/{totalQuestions} correct
                </div>
              </div>
            </div>
            
            {/* Star Rating */}
            {renderStars()}
            
            <p className="level-text">
              {hasFailed ? (
                <>You made <strong>{mistakes} mistakes</strong> in <strong>{getLevelName(currentLevel)}</strong></>
              ) : (
                <>You completed <strong>{getLevelName(currentLevel)}</strong> with {stars} stars!</>
              )}
            </p>
            
            {hasPassed && (
              <p className="question-text">
                Ready to advance to {getLevelName(nextLevel)}?
              </p>
            )}
            
            {hasFailed && (
              <div className="failure-message">
                <p className="failure-text">
                  You need 3 or fewer mistakes to pass. Review the material and try again!
                </p>
              </div>
            )}
          </div>
          
          {/* Achievement Badge - Only show for passing grades */}
          {hasPassed && (
            <div className="achievement-badge">
              <div className="badge-icon">
                {stars === 5 ? "👑" : stars === 4 ? "⭐" : "✨"}
              </div>
              <div className="badge-text">
                {stars === 5 ? "Perfect Master" : 
                 stars === 4 ? "Excellent Achiever" : 
                 "Level Completer"}
              </div>
            </div>
          )}
        </div>
        
        <div className="popup-footer">
          <div className="action-buttons">
            {/* Primary Button - Changes based on pass/fail */}
            {hasPassed ? (
              <button 
                className="primary-action" 
                onClick={onNextLevel}
                autoFocus
              >
                <span className="button-icon">🚀</span>
                <span className="button-text">Continue to {nextLevel}</span>
              </button>
            ) : (
              <button 
                className="primary-action retry-action" 
                onClick={onRetry}
                autoFocus
              >
                <span className="button-icon">🔄</span>
                <span className="button-text">Try Again</span>
              </button>
            )}
            
            {/* Secondary Button */}
            <button 
              className="secondary-action" 
              onClick={onClose}
            >
              <span className="button-icon">
                {hasFailed ? "📖" : "📚"}
              </span>
              <span className="button-text">
                {hasFailed ? "Review Material" : "Review Assignments"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LevelCompletionPopup;