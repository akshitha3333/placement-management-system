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
import AdminJobCategories from './Components/admin/Adminpage/AdminJobCategories';
import AdminJobPosts from './Components/admin/Adminpage/AdminJobPosts';
import AdminApplications from './Components/admin/Adminpage/AdminApplications';
import AdminInterviews from './Components/admin/Adminpage/AdminInterviews';
import AdminOffers from './Components/admin/Adminpage/AdminOffers';
import AdminMeetings from './Components/admin/Adminpage/AdminMeetings';
import AdminReports from './Components/admin/Adminpage/AdminReports';
import AdminSkills from './Components/admin/Adminpage/AdminSkills';
// Company
import CompanyRegister from './Components/company/CompanyRegister';
import CompanyLogin from './Components/company/CompanyLogin';
import CompanyPage from './Components/company/CompanyPage';
// import CompanyNav from './Components/company/CompanyNav';
import CompanyDashboard from './Components/company/CompanyDashboard';
import CompanyJobPosts from './Components/company/CompanyPages/CompanyJobPosts';
import CompanyApplications from './Components/company/CompanyPages/CompanyApplications';
import CompanyShortlisted from './Components/company/CompanyPages/CompanyShortlisted';
import CompanyInterviews from './Components/company/CompanyPages/CompanyInterviews';
import CompanyOffers from './Components/company/CompanyPages/CompanyOffers';
import CompanyMeetings from './Components/company/CompanyPages/CompanyMeetings';
import CompanyProfile from './Components/company/CompanyPages/CompanyProfile';

// Students
import StudentRegister from './Components/student/StudentRegister';
import StudentLogin from './Components/student/StudentLogin';
import StudentDashboard from './Components/student/StudentDashbord';
import StudentPage from './Components/student/StudentPage';
import StudentJobPosts from './Components/student/StudentPages/StudentJobPosts';
import StudentApplications from './Components/student/StudentPages/StudentApplications';
import StudentInterviews from './Components/student/StudentPages/StudentInterviews';
import StudentOffers from './Components/student/StudentPages/StudentOffers';
import StudentMeetings from './Components/student/StudentPages/StudentMeetings';
import StudentProfile from './Components/student/StudentPages/StudentProfile';

// Tutor
import TutorDashboard from './Components/Tutor/TutorDashboard';
import TutorLogin from './Components/Tutor/tutorLogin';
import TutorDashboard from './Components/Tutor/TutorPages/TutorDashboard';
import TutorStudents from './Components/Tutor/TutorPages/TutorStudents';
import TutorFeedback from './Components/Tutor/TutorPages/TutorFeedback';
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
                 <Route path='job-categories' element={<AdminJobCategories />} />
                 <Route path='job-posts' element={<AdminJobPosts />} />
                 <Route path='applications' element={<AdminApplications />} />
                 <Route path='interviews' element={<AdminInterviews />} />
                 <Route path='offers' element={<AdminOffers />} />
                 <Route path='meetings' element={<AdminMeetings />} />
                 <Route path='reports' element={<AdminReports />} />
                 <Route path='skills' element={<AdminSkills />} />
            </Route>
            
            {/* Company */}
            <Route path='/company-login' Component={CompanyLogin}></Route>
            <Route path='/company-register' Component={CompanyRegister}></Route>
            {/* <Route path='/company-nav' Component={CompanyNav}></Route> */}
            <Route path='/company-page' element={<CompanyPage/>}>
                <Route index element={<CompanyDashboard/>} />
                <Route path='dashboard' element={<CompanyDashboard/>} />
                <Route path='job-posts' element={<CompanyJobPosts />} />
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
            <Route path='applications' element={<StudentApplications />} />
            <Route path='interviews' element={<StudentInterviews />} />
            <Route path='offers' element={<StudentOffers />} />
            <Route path='meetings' element={<StudentMeetings />} />
            <Route path='profile' element={<StudentProfile />} />
            </Route>

          {/* tutors */}
            <Route path='/tutor-login' Component={TutorLogin}></Route>
            <Route path='/tutor-page' element={<TutorPage />}>
            <Route index element={<TutorDashboard />} />
            <Route path='dashboard' element={<TutorDashboard />} />
            <Route path='students' element={<TutorStudents />} />
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
