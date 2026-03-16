import {useNavigate} from "react-router-dom"

function RoleSelection(){
    const navigate =useNavigate();
    return(
        <div className="card w-30 m-auto p-5 " >
            <h2 className="text-center">Select Your Role</h2>
            <div className="mt-5" >
                <input className="btn-primary btn" type="button" name="Admin" value="Admin"onClick={() => navigate("/admin-login")} />
            </div>
            <div className="mt-5">
                <input className="btn-primary btn" type="button" name="Company" value="Company" onClick={() => navigate("/Company-register")}/>
            </div>
            <div className="mt-5">
                <input  className=" btn-primary btn" type="button" name="Tutors" value="Tutors" onClick={() => navigate("/tutor-login")}/>
            </div>
            <div className="mt-5">
                <input className=" btn-primary btn" type="button" name="Students" value="Students"onClick={() => navigate("/student-register")}/>
            </div>
            <div>
                <a href="/"  className="text-center">Back to home</a>
            </div>
        </div>
    );
}
export  default RoleSelection;
 