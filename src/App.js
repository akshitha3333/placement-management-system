import './App.css';
import {BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Components/home/Home';
import AdminLogin from './Components/admin/AdminLogin';
import AdminNav from './Components/admin/Adminpage/AdminNav';
import AdminPage from './Components/admin/Adminpage/AdminPage';
import AboutPage from './Components/home/AboutPage';
import AdminStudents from './Components/admin/Adminpage/AdminStudents';
import AdminCompanies from "./Components/admin/Adminpage/AdminCompanies";
import AdminTutors from './Components/admin/Adminpage/AdminTutors';
import AdminDepartments from './Components/admin/Adminpage/AdminDepartments';
import AdminDashboard from './Components/admin/Adminpage/AdminDashboard';
import RoleSelection from './Components/home/RoleSelection';
import CompanyRegister from './Components/company/CompanyRegister';
import CompanyLogin from './Components/company/CompanyLogin';
import TutorLogin from './Components/Tutor/tutorLogin';
import StudentRegister from './Components/student/StudentRegister';
import StudentLogin from './Components/student/StudentLogin';
import CompanyDashboard from './Components/company/CompanyDashboard';
import StudentDashbord from './Components/student/StudentDashbord';
import TutorDashboard from './Components/Tutor/TutorDashboard';
import CompanyPage from './Components/company/CompanyPage';
import CompanyNav from './Components/company/CompanyNav';

function App() {
  return (
    <Router>
      <div className='App'>
          <Routes>
            <Route path='/' element={<Home />}></Route>
            <Route path='/admin-nav' Component={AdminNav}></Route>
            <Route path='/admin-page' element={<AdminPage />}>
                 <Route index element={<AdminDashboard />} />
                 <Route path="dashboard" element={<AdminDashboard />} />
                 <Route path="students" element={<AdminStudents />} />
                 <Route path="companies" element={<AdminCompanies />} />
                 <Route path="tutors" element={<AdminTutors/>} />
                 <Route path="departments" element={<AdminDepartments/>} />
            </Route>
            <Route path='/roleselection' Component={RoleSelection}></Route>
            <Route path='/about-page' Component={AboutPage}></Route>
            <Route path='/admin-login' Component={AdminLogin}></Route>
            <Route path='/company-login' Component={CompanyLogin}></Route>
            <Route path='/company-register' Component={CompanyRegister}></Route>
            <Route path='/company-nav' Component={CompanyNav}></Route>
            <Route path='/company-page' element={<CompanyPage/>}>
                <Route index element={<CompanyDashboard/>} />
                <Route path='dashboard' element={<CompanyDashboard/>} />
            </Route>
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
