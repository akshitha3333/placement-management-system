import './App.css';
import {BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Home
import Home from './Components/home/Home';
import AboutPage from './Components/home/AboutPage';
import RoleSelection from './Components/home/RoleSelection';

// Admin
import AdminLogin from './Components/admin/AdminLogin';
// import AdminNav from './Components/admin/Adminpage/AdminNav';
import AdminPage from './Components/admin/Adminpage/AdminPage';
import AdminStudents from './Components/admin/Adminpage/AdminStudents';
import AdminCompanies from "./Components/admin/Adminpage/AdminCompanies";
import AdminTutors from './Components/admin/Adminpage/AdminTutors';
import AdminDepartments from './Components/admin/Adminpage/AdminDepartments';
import AdminDashboard from './Components/admin/Adminpage/AdminDashboard';
// Company
import CompanyRegister from './Components/company/CompanyRegister';
import CompanyLogin from './Components/company/CompanyLogin';
import CompanyPage from './Components/company/CompanyPages/CompanyPage';
import CompanyDashboard from './Components/company/CompanyPages/CompanyDashboard';// import CompanyNav from './Components/company/CompanyNav';
import CompanyJobPosts from './Components/company/CompanyPages/CompanyJobPosts';
import CompanyJobCategories from './Components/company/CompanyPages/CompanyJobCategories';
import CompanySkillsRequired from './Components/company/CompanyPages/CompanySkillsRequired'
import CompanyApplications from './Components/company/CompanyPages/CompanyApplications';
import CompanyShortlisted from './Components/company/CompanyPages/CompanyShortlisted';
import CompanyInterviews from './Components/company/CompanyPages/CompanyInterviews';
import CompanyOffers from './Components/company/CompanyPages/CompanyOffers';
import CompanyMeetings from './Components/company/CompanyPages/CompanyMeetings';
import CompanyProfile from './Components/company/CompanyPages/CompanyProfile';

// Students
import StudentRegister from './Components/student/StudentRegister';
import StudentLogin from './Components/student/StudentLogin';
import StudentDashboard from './Components/student/StudentPages/StudentDashboard';
import StudentPage from './Components/student/StudentPages/StudentPage';
import StudentJobPosts from './Components/student/StudentPages/StudentsJobPosts';
import StudentRecommended from './Components/student/StudentPages/StudentRecommended';
import StudentApplications from './Components/student/StudentPages/StudentApplications';
import StudentInterviews from './Components/student/StudentPages/StudentInterviews';
import StudentOffers from './Components/student/StudentPages/StudentOffers';
import StudentMeetings from './Components/student/StudentPages/StudentMeetings';
import StudentProfile from './Components/student/StudentPages/StudentProfile';

// Tutor
import TutorLogin from './Components/Tutor/TutorLogin';
import TutorPage from './Components/Tutor/TutorPages/TutorPage';
import TutorDashboard from './Components/Tutor/TutorPages/TutorDashboard';
import TutorStudents from './Components/Tutor/TutorPages/TutorStudents';
import TutorFeedback from './Components/Tutor/TutorPages/TutorFeedback';
import TutorJobposts from './Components/Tutor/TutorPages/TutorJobposts'
import TutorMeetings from './Components/Tutor/TutorPages/TutorMeetings';
import TutorPlacementReport from './Components/Tutor/TutorPages/TutorPlacementReport';


function App() {
  return (
    <Router>
      <div className='App'>
          <Routes>
            <Route path='/' element={<Home />}></Route>
            <Route path='/roleselection' Component={RoleSelection}></Route>
            <Route path='/about-page' Component={AboutPage}></Route>
            
            {/* Admin */}
            {/* <Route path='/admin-nav' Component={AdminNav}></Route> */}
            <Route path='/admin-login' Component={AdminLogin}></Route>
            <Route path='/admin-page' element={<AdminPage />}>
                 <Route index element={<AdminDashboard />} />
                 <Route path="dashboard" element={<AdminDashboard />} />
                 <Route path="students" element={<AdminStudents />} />
                 <Route path="companies" element={<AdminCompanies />} />
                 <Route path="tutors" element={<AdminTutors/>} />
                 <Route path="departments" element={<AdminDepartments/>} />
            </Route>
            
            {/* Company */}
            <Route path='/company-login' Component={CompanyLogin}></Route>
            <Route path='/company-register' Component={CompanyRegister}></Route>
            {/* <Route path='/company-nav' Component={CompanyNav}></Route> */}
            <Route path='/company-page' element={<CompanyPage/>}>
                <Route index element={<CompanyDashboard/>} />
                <Route path='dashboard' element={<CompanyDashboard/>} />
                <Route path='job-posts' element={<CompanyJobPosts />} />
                <Route path="job-categories" element={<CompanyJobCategories />} />
                <Route path="skills-required" element={<CompanySkillsRequired />} />
                <Route path='applications' element={<CompanyApplications />} />
                <Route path='shortlisted' element={<CompanyShortlisted />} />
                <Route path='interviews' element={<CompanyInterviews />} />
                <Route path='offers' element={<CompanyOffers />} />
                <Route path='meetings' element={<CompanyMeetings />} />
                <Route path='profile' element={<CompanyProfile />} />
            </Route>

            {/* students */}
            <Route path='/student-login' Component={StudentLogin}></Route>
            <Route path='/student-register' Component={StudentRegister}></Route>
            <Route path='/student-page' element={<StudentPage />}>
            <Route index element={<StudentDashboard />} />
            <Route path='dashboard' element={<StudentDashboard />} />
            <Route path='job-posts' element={<StudentJobPosts />} />
            <Route path='student-recommended' element={<StudentRecommended />} />
            <Route path='applications' element={<StudentApplications />} />
            <Route path='interviews' element={<StudentInterviews />} />
            <Route path='offers' element={<StudentOffers />} />
            <Route path='meetings' element={<StudentMeetings />} />
            <Route path='profile' element={<StudentProfile />} />
            </Route>

          {/* tutors */}
            <Route path='/tutor-login' element={<TutorLogin/>}></Route>
            <Route path='/tutor-page' element={<TutorPage />}>
            <Route index element={<TutorDashboard />} />
            <Route path='dashboard' element={<TutorDashboard />} />
            <Route path='students' element={<TutorStudents />} />
            <Route path='job-posts' element={<TutorJobposts />} />
            <Route path='feedback' element={<TutorFeedback />} />
            <Route path='meetings' element={<TutorMeetings />} />
            <Route path='placement-report' element={<TutorPlacementReport />} />
            </Route>            
          </Routes>
      </div>
    </Router>
  );
}

export default App;
