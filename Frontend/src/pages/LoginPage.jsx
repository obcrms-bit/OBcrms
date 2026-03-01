import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        setError('Please enter both email and password');
        return;
      }

      const response = await login(email, password);
      if (response?.success && response?.user) {
        // Navigate based on user role
        const userRole = response.user.role?.toLowerCase();
        if (userRole === 'admin') {
          navigate('/admin');
        } else if (userRole === 'counselor') {
          navigate('/counselor');
        } else {
          setError('Invalid user role. Please contact support.');
        }
      } else {
        setError('Login response invalid. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="login-box" style={{ background: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ marginBottom: '30px', color: '#333', textAlign: 'center', fontSize: '28px' }}>Trust Education CRM</h1>
        {error && <div className="error-message" style={{ color: 'red', marginBottom: '15px', padding: '10px', background: '#ffe6e6', borderRadius: '5px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '600', fontSize: '14px' }}>Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', width: '100%', fontSize: '14px' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '600', fontSize: '14px' }}>Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', width: '100%', fontSize: '14px' }}
            />
          </div>
          <button
            type="submit"
            className="btn-login"
            disabled={loading}
            style={{ width: '100%', padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginBottom: '20px' }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#666', background: '#f9f9f9', padding: '15px', borderRadius: '5px' }}>
          <strong>📝 Demo Credentials:</strong><br/>
          <strong>Admin:</strong> admin@seed.com / admin123<br/>
          <strong>Counselor:</strong> counselor1@seed.com / counselor123
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
