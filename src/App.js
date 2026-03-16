import './App.css';
import {BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Components/home/Home';
import AdminLogin from './Components/admin/AdminLogin';
import RoleSelection from './Components/home/RoleSelection';
import CompanyRegister from './Components/company/CompanyRegister';
import CompanyLogin from './Components/company/CompanyLogin';
import TutorLogin from './Components/Tutor/tutorLogin';
import StudentRegister from './Components/student/StudentRegister';
import StudentLogin from './Components/student/StudentLogin';
import AdminDashboard from './Components/admin/AdminDashboard';
import CompanyDashboard from './Components/company/CompanyDashboard';
import StudentDashbord from './Components/student/StudentDashbord';
import TutorDashboard from './Components/Tutor/TutorDashboard';


function App() {
  return (
    <Router>
      <div className='App'>
          <Routes>
            <Route path='/' Component={Home}></Route>
            <Route path='/roleselection' Component={RoleSelection}></Route>
            <Route path='/admin-login' Component={AdminLogin}></Route>
            <Route path='/admin-dashboard' Component={AdminDashboard}></Route>
            <Route path='/company-register' Component={CompanyRegister}></Route>
            <Route path='/company-login' Component={CompanyLogin}></Route>
            <Route path='/company-dashboard' Component={CompanyDashboard}></Route>
            <Route path='/tutor-login' Component={TutorLogin}></Route>
            <Route path='/tutor-dashboard' Component={TutorDashboard}></Route>
            <Route path='/student-register' Component={StudentRegister}></Route>
            <Route path='/student-login' Component={StudentLogin}></Route>
            <Route path='/student-dashboard' Component={StudentDashbord}></Route>
          </Routes>
      </div>
    </Router>
  );
}

export default App;
