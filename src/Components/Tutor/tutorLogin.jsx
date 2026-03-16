import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
const rest = require("../../Rest")

function TutorLogin() {
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [message, setMessage] = useState("");
    const [msgType, setMsgType] = useState("");
    const navigate = useNavigate();
            const validateEmail= (e)=>{
            const email= e.target.value;
            const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if(email ===""){
                setEmailError("Email is required");
            }else if(!emailPattern.test(email)){
                setEmailError("Invalid Email Format");   
            }else{
                setEmailError("");
            }
        }
        const validatePassword = (e) => {
        const password = e.target.value;
        const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
        if(password === ""){
            setPasswordError("Password is required");
        }
        else if(!pattern.test(password)){
            setPasswordError(
            "Password must contain 8 characters, uppercase, lowercase, number and special character"
            );
        }
        else{
            setPasswordError("");
        }
    
    }
    let header = {
        headers: {
            "Content-type": "Application/json"
        }
    }
      const TutorLogin = (e) => {
        e.preventDefault();
        let email = document.getElementById("Email").value;
        let password=document.getElementById("Password").value;
        let data = {
            "email": email,
            "password": password,
        }
        axios.post(rest.TutorLogin, data, header)
            .then(response => {
                console.log(response.data);
                if (response.data === "Login Successfully") {

                    setMessage(response.data);
                    setMsgType("success");

                    setTimeout(() => {
                        navigate("/tutor-dashboard");
                    }, 1500);

                } else {

                    setMessage(response.data);
                    setMsgType("error");
                }
            })
            .catch(error => {
                console.log(error);
                setMessage("Something Went Wrong");
                setMsgType("error");
            });
    }
    return (
            <div className="card w-30 m-auto p-5">
                <div className="text-center">
                   <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="currentColor" class="bi bi-person" viewBox="0 0 16 16">
                      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
                    </svg>
                     <h2 className="mt-2">Tutor Login</h2>
                     <p className="mt-2">Access Your tutor Portal</p>
                     {message && <p className={`alert-${msgType}`}>{message}</p>}
                </div>
                <form onSubmit={TutorLogin} method="post">
                    <div className="form-group mt-5">
                    <label className="form-control-label" htmlFor="Email">Email Address</label>
                    <input  className="form-control" type="email" name="Email" id="Email" placeholder="Enter your email" onKeyUp={validateEmail} />
                    <p className="error">{emailError}</p>
                </div>
                 <div className="form-group mt-5">
                    <label className="form-control-label" htmlFor="Password">Password</label>
                    <input  className="form-control" type="password" name="password" id="Password" placeholder="Enter your Password" onKeyUp={validatePassword} />
                    <p className="error">{passwordError}</p>
                </div>
                <div>
                    <input  className="btn btn-primary mt-5" type="submit" name="Login" value="Login" />
                </div>
                </form>
                <div className="fs-p7 text-center link-color mt-2" >
                    <a   href="/roleselection">Back to role Selection</a>
                </div>
            </div>

    )
}
export default TutorLogin; 