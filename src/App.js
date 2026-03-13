import './App.css';
import {BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Components/Home';
import AdminLogin from './Components/AdminLogin';
import RoleSelection from './Components/RoleSelection';
import CompanyRegister from './Components/Company-register';
import TutorLogin from './Components/tutorLogin';
import StudentRegister from './Components/student-register';


function App() {
  return (
    <Router>
      <div className='App'>
          <Routes>
            <Route path='/' Component={Home}></Route>
            <Route path='/roleselection' Component={RoleSelection}></Route>
            <Route path='/admin-login' Component={AdminLogin}></Route>
            <Route path='/company-register' Component={CompanyRegister}></Route>
            <Route path='/tutor-login' Component={TutorLogin}></Route>
            <Route path='/student-register' Component={StudentRegister}></Route>




          </Routes>
      </div>
    </Router>
  );
}

export default App;
