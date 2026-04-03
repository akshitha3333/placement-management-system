import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../Rest")

function CompanyLogin() {
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
                setEmailError("valid Email");
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
     const CompanyLogin = (e) => {
        e.preventDefault();
        let email = document.getElementById("Email").value;
        let password=document.getElementById("Password").value;
        let data ={
                "email": email,
                "password": password,
            };
         axios.post(rest.login, data, header)
            .then(response => {
                console.log(response.data);
                localStorage.setItem("token", response.data.data.token);
                const success = response.data.success;
                const msg     = response.data.message || "";
                const token   = response.data.data;    

                if (success && token) {
                    // save token — same way your admin login saves it
                    Cookies.set("token", token);
                    localStorage.setItem("token", token);

                    setMessage(" Login successful!");
                    setMsgType("success");

                    setTimeout(() => navigate("/company-page"), 1000);

                } else {
                    // show the message string, never the whole object
                    setMessage(msg || "Login failed. Please check your credentials.");
                    setMsgType("error");
                }
            })
            .catch(error => {
                console.log(error);
                const errMsg = error.response?.data?.message || "Something went wrong. Please try again.";
                setMessage(errMsg); // always a string
                setMsgType("error");
            });
    };
    return (
        <div className="">
            <div className="card w-30 m-auto p-5">
                <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="currentColor" className="bi bi-buildings" viewBox="0 0 16 16">
                      <path d="M14.763.075A.5.5 0 0 1 15 .5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V14h-1v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V10a.5.5 0 0 1 .342-.474L6 7.64V4.5a.5.5 0 0 1 .276-.447l8-4a.5.5 0 0 1 .487.022M6 8.694 1 10.36V15h5zM7 15h2v-1.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5V15h2V1.309l-7 3.5z"/>
                      <path d="M2 11h1v1H2zm2 0h1v1H4zm-2 2h1v1H2zm2 0h1v1H4zm4-4h1v1H8zm2 0h1v1h-1zm-2 2h1v1H8zm2 0h1v1h-1zm2-2h1v1h-1zm0 2h1v1h-1zM8 7h1v1H8zm2 0h1v1h-1zm2 0h1v1h-1zM8 5h1v1H8zm2 0h1v1h-1zm2 0h1v1h-1zm0-2h1v1h-1z"/>
                    </svg>
                     <h2 className="mt-2">Company Login</h2>
                     <p className="mt-2">Access your recruiter portal</p>
                    {message && (
                      <p className={msgType === "success" ? "text-sucess" : "text-danger"}>
                        {message}
                      </p>
                    )}  
                </div>
               <form onSubmit={CompanyLogin} method="post">
                <div className="form-group mt-5">
                    <label className="form-control-label" htmlFor="Email">Email Address</label>
                    <input  className="form-control" type="email" name="Email" id="Email" placeholder="Enter your email" onKeyUp={validateEmail} />
                    <p className="text-danger">{emailError}</p>
                </div>
                 <div className="form-group mt-5">
                    <label className="form-control-label" htmlFor="Password">Password</label>
                    <input  className="form-control" type="password" name="password" id="Password" placeholder="Enter your Password" onKeyUp={validatePassword} />
                    <p className="text-danger">{passwordError}</p>
                </div>
                <div>
                    <input  className="btn btn-primary mt-5" type="submit" name="Login" value="Login" />
                </div>
               </form>
                <div className="fs-p7 text-center text-link mt-2" >
                    <a   href="/roleselection">Back to role Selection</a>
                </div>
            </div>
        </div>
            
    )
}
export default CompanyLogin; 