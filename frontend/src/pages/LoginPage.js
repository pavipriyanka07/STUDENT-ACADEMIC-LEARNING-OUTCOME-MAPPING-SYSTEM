import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../services/authService';

const LoginPage = () => {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Admin');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      if (mode === 'register' && password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      const data = mode === 'login'
        ? await login({ username, password })
        : await register({ username, password, role });
      localStorage.setItem('token', data.token);
      localStorage.setItem('admin', data.username);
      localStorage.setItem('role', data.role);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || (mode === 'login' ? 'Login failed' : 'Registration failed'));
    }
  };

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={submit}>
        <h2>{mode === 'login' ? 'Login' : 'Create Account'}</h2>
        <p className="subtle">Academic Learning Outcome Mapping System</p>
        {error && <p className="error">{error}</p>}
        <label className="form-field">
          <span>Username</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label className="form-field">
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {mode === 'register' && (
          <label className="form-field">
            <span>Role</span>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="Admin">Admin</option>
              <option value="Faculty">Faculty</option>
            </select>
          </label>
        )}
        {mode === 'register' && (
          <label className="form-field">
            <span>Confirm Password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>
        )}
        <div className="login-actions">
          <button className="btn" type="submit">{mode === 'login' ? 'Login' : 'Create Account'}</button>
          <button
            className="btn btn-muted"
            type="button"
            onClick={() => {
              setError('');
              setMode(mode === 'login' ? 'register' : 'login');
              setPassword('');
              setConfirmPassword('');
            }}
          >
            {mode === 'login' ? 'Create account' : 'Back to login'}
          </button>
        </div>
        <p className="subtle login-switch">
          {mode === 'login'
            ? 'New here? Create an admin account to continue.'
            : 'Already have an account? Sign in with your admin credentials.'}
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
