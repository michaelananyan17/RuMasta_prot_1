import React, { useState } from 'react';
import { useAuth } from '../context/authcontext';
import './EmailVerification.css';

function EmailVerification() {
  const { user, resendVerificationEmail, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResendEmail = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      await resendVerificationEmail(user.email);
      setMessage('Verification email sent! Check your inbox.');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verification-container">
      <div className="verification-card">
        <div className="verification-icon">📧</div>
        <h2>Verify Your Email Address</h2>
        <p>
          We've sent a verification email to: <br />
          <strong>{user?.email}</strong>
        </p>
        
        <p className="verification-instructions">
          Please check your email and click the verification link to activate your account. 
          If you don't see the email, check your spam folder.
        </p>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="verification-actions">
          <button 
            onClick={handleResendEmail} 
            disabled={loading}
            className="resend-button"
          >
            {loading ? 'Sending...' : 'Resend Verification Email'}
          </button>
          
          <button 
            onClick={() => window.location.reload()}
            className="refresh-button"
          >
            I've Verified My Email
          </button>
          
          <button 
            onClick={signOut}
            className="logout-button"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailVerification;