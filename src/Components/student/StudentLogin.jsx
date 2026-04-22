import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from 'js-cookie';
import axios from "axios";
const rest = require("../../Rest")

function StudentLogin() {
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [message, setMessage] = useState("");
    const [msgType, setMsgType] = useState("");
    const navigate = useNavigate();

    const validateEmail = (e) => {
        const email = e.target.value;
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email === "") {
            setEmailError("Email is required");
        } else if (!emailPattern.test(email)) {
            setEmailError("Invalid Email Format");
        } else {
            setEmailError("");
        }
    }
    const validatePassword = (e) => {
        const password = e.target.value;
        if (password === "") {
            setPasswordError("Password is required");
        } else {
            setPasswordError("");
        }
    }

    let header = {
        headers: {
            "Content-type": "Application/json"
        }
    }

    const StudentLogin = (e) => {
        e.preventDefault();
        let email = document.getElementById("Email").value;
        let password=document.getElementById("Password").value;
        let data = {
            "email": email,
            "password": password,
        }
        axios.post(rest.login, data, header)
            .then(response => {
                console.log(response.data);
                if (response.data.success && response.data.data) {
                    Cookies.set("token", response.data.data, { path: "/" });
                    console.log("cookie saved:", Cookies.get("token")); 
                    setMessage("Login successful! Redirecting...");
                    setMsgType("success");
                    setTimeout(() => navigate("/student-page"), 1500);
                } else {
                    setMessage(response.data.message || "Invalid credentials. Please try again.");
                    setMsgType("error");
                }
            })
            .catch(error => {
                console.log(error);
                setMessage(error.response?.data?.message || "Something went wrong. Please try again.");
                setMsgType("error");
            });
    }

    return (
        <div className="card w-30 m-auto p-5">
            <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="currentColor" className="bi bi-mortarboard" viewBox="0 0 16 16">
                    <path d="M8.211 2.047a.5.5 0 0 0-.422 0l-7.5 3.5a.5.5 0 0 0 .025.917l7.5 3a.5.5 0 0 0 .372 0L14 7.14V13a1 1 0 0 0-1 1v2h3v-2a1 1 0 0 0-1-1V6.739l.686-.275a.5.5 0 0 0 .025-.917zM8 8.46 1.758 5.965 8 3.052l6.242 2.913z" />
                    <path d="M4.176 9.032a.5.5 0 0 0-.656.327l-.5 1.7a.5.5 0 0 0 .294.605l4.5 1.8a.5.5 0 0 0 .372 0l4.5-1.8a.5.5 0 0 0 .294-.605l-.5-1.7a.5.5 0 0 0-.656-.327L8 10.466zm-.068 1.873.22-.748 3.496 1.311a.5.5 0 0 0 .352 0l3.496-1.311.22.748L8 12.46z" />
                </svg>
                <h2 className="mt-2">Student Login</h2>
                <p className="mt-2">Access your placement portal</p>

                {message && (
                    <div className={msgType === "success" ? "alert-success mt-3" : "alert-danger mt-3"}>
                        <p className={msgType === "success" ? "text-success" : "text-danger"}>
                            {message}
                        </p>
                    </div>
                )}

            </div>
            <form onSubmit={StudentLogin} method="post">
                <div className="form-group mt-5">
                    <label className="form-control-label" htmlFor="Email">Email Address</label>
                    <input className="form-control" type="email" name="Email" id="Email" placeholder="Enter your email" onKeyUp={validateEmail} />
                    {emailError && <p className="text-danger fs-p8 mt-1">{emailError}</p>}
                </div>
                <div className="form-group mt-5">
                    <label className="form-control-label" htmlFor="Password">Password</label>
                    <input className="form-control" type="password" name="password" id="Password" placeholder="Enter your Password" onKeyUp={validatePassword} />
                    {passwordError && <p className="text-danger fs-p8 mt-1">{passwordError}</p>}
                </div>
                <div>
                    <input className="btn btn-primary mt-5" type="submit" name="Login" value="Login" />
                </div>
            </form>
            <div className="fs-p7 text-center text-link mt-2" >
                <a href="/roleselection">Back to role Selection</a>
            </div>
        </div>
    )
}
export default StudentLogin;