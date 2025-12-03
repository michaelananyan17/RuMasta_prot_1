import React, { useState } from 'react';
import { useAuth } from '../context/authcontext';
import './LoginForm.css';

function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signUp, signIn } = useAuth();

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  // Basic validation
  if (!email || !password) {
    setError('Please fill in all fields');
    setLoading(false);
    return;
  }

  try {
    if (isSignUp) {
      await signUp(email, password, username);
    } else {
      await signIn(email, password);
    }
  } catch (error) {
    // Network error handling
    if (error.message.includes('Failed to fetch') || error.message.includes('TIMED_OUT')) {
      setError('Network error: Cannot connect to server. Please check your internet connection and Supabase configuration.');
    } else {
      setError(error.message);
    }
  } finally {
    setLoading(false);
  }
};

  // Demo login function - SIMPLIFIED VERSION
const handleDemoLogin = async (demoType = 'student') => {
  setLoading(true);
  setError('');

  const demoAccounts = {
    student: {
      email: 'student@russianmaster.com',
      password: 'demo123'
    }
  };

  const demo = demoAccounts[demoType];

  try {
    // Try simple credentials first
    setEmail(demo.email);
    setPassword(demo.password);
    
    // Use the regular signIn function
    await signIn(demo.email, demo.password);
  } catch (error) {
    setError(`Demo login failed: ${error.message}. Please check your Supabase connection.`);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
        <p>{isSignUp ? 'Join Russian Master today!' : 'Sign in to continue learning'}</p>
        
        {/* Demo Login Section */}
        <div className="demo-section">
          <h3>Quick Demo Access</h3>
          <div className="demo-buttons">
            <button 
              type="button"
              onClick={() => handleDemoLogin('student')}
              disabled={loading}
              className="demo-button student"
            >
              🎓 Student Demo
            </button>
            <button 
              type="button"
              onClick={() => handleDemoLogin('teacher')}
              disabled={loading}
              className="demo-button teacher"
            >
              👨‍🏫 Teacher Demo
            </button>
            <button 
              type="button"
              onClick={() => handleDemoLogin('admin')}
              disabled={loading}
              className="demo-button admin"
            >
              ⚙️ Admin Demo
            </button>
          </div>
          <p className="demo-note">Click any demo button to instantly access the platform</p>
        </div>

        <div className="divider">
          <span>OR</span>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label>Username:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          )}
          
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
            />
          </div>
          
          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>
        
        <div className="toggle-form">
          <p>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button 
              type="button" 
              onClick={() => setIsSignUp(!isSignUp)}
              className="toggle-button"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;