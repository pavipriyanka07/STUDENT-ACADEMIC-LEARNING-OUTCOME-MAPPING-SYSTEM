import { NavLink, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'Admin';

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="brand">
        <span className="brand-mark">ALO</span>
        <span>Mapping Studio</span>
      </div>
      <div className="nav-links">
        <NavLink to="/" end className={({ isActive }) => `nav-pill ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
        {role === 'Admin' && (
          <NavLink to="/courses" className={({ isActive }) => `nav-pill ${isActive ? 'active' : ''}`}>Courses</NavLink>
        )}
        <NavLink to="/subjects" className={({ isActive }) => `nav-pill ${isActive ? 'active' : ''}`}>Subjects</NavLink>
        <NavLink to="/outcomes" className={({ isActive }) => `nav-pill ${isActive ? 'active' : ''}`}>Outcomes</NavLink>
        <NavLink to="/mappings" className={({ isActive }) => `nav-pill ${isActive ? 'active' : ''}`}>Mappings</NavLink>
        <NavLink to="/marks" className={({ isActive }) => `nav-pill ${isActive ? 'active' : ''}`}>Marks</NavLink>
        <NavLink to="/reports" className={({ isActive }) => `nav-pill ${isActive ? 'active' : ''}`}>Reports</NavLink>
      </div>
      <div className="nav-meta">
        <span className="role-pill">{role}</span>
      </div>
      <button className="btn btn-danger" onClick={logout}>Logout</button>
    </nav>
  );
};

export default Navbar;
