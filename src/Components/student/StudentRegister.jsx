import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"
import axios from "axios";
const rest = require("../../Rest")

function StudentRegister() {
    const [departments, setDepartments] = useState([]);
    const [nameError, setNameError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [rollError, setRollError] = useState("");
    const [departmentError, setDepartmentError] = useState("");
    const [yearError, setYearError] = useState("");
    const [message, setMessage] = useState("");
    const [msgType, setMsgType] = useState("");

    const navigate = useNavigate();

    const validateName = (e) => {
        const name = e.target.value.trim();
        if (name === "") {
            setNameError("Name is required");
        } else if (name.length <= 3) {
            setNameError("Name must be atleast 3 characters")
        } else if (!/^[A-Za-z\s.&-]+$/.test(name)) {
            setNameError("Only letters, spaces, ., & and - are allowed")
        } else {
            setNameError("");
        }
    }
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
    const validatePhone = (e) => {
        const phone = e.target.value.trim();
        if (phone === "") {
            setPhoneError("Phone number is required");
        }
        else if (!/^[0-9]{10}$/.test(phone)) {
            setPhoneError("Enter a valid 10 digit phone number");
        }
        else {
            setPhoneError("");
        }
    }
    const validateRollNumber = (e) => {
        const roll = e.target.value.trim();
        if (roll === "") {
            setRollError("Roll number is required");
        }
        else if (roll.length < 5) {
            setRollError("Roll number must be at least 5 characters");
        }
        else if (!/^[A-Za-z0-9]+$/.test(roll)) {
            setRollError("Roll number must contain only letters and numbers");
        }
        else {
            setRollError("");
        }
    }
    const validateDepartment = (e) => {
        const department = e.target.value;
        if (department === "") {
            setDepartmentError("Please select a department");
        }
        else {
            setDepartmentError("");
        }
    }
    const validateYear = (e) => {
        const year = e.target.value;
        if (year === "") {
            setYearError("Please select your year");
        }
        else {
            setYearError("");
        }
    }

    const header = {
        headers: {
            "Content-Type": "application/json"
        }
    };

    const studentRegistration = (e) => {
        e.preventDefault();
        let name = document.getElementById("name").value;
        let email = document.getElementById("email").value;
        let phone = document.getElementById("phone").value;
        let password=document.getElementById("password").value;
        let rollNumber = document.getElementById("rollNumber").value;
        let percentage = document.getElementById("percentage").value;
        let departmentId = document.getElementById("departmentId").value;
        let year = document.getElementById("year").value;
        
        let data = {
            "name": name,
            "phone": phone,
            "email": email,
            "password": password,
            "percentage": percentage,
            "rollNumber": rollNumber,
            "year": year,
            "departmentId": departmentId
        }

        if (nameError || emailError || phoneError || rollError || departmentError || yearError) {
            setMessage("Please fix the validation errors before submitting.");
            setMsgType("error");
            return;
        }

        axios.post(rest.student, data, header)
            .then(response => {
                console.log(response.data);
                const msg     = response.data.message || "";
                const success = response.data.success;

                if (success) {
                    setMessage("Registered successfully! Redirecting to login...");
                    setMsgType("success");
                    setTimeout(() => navigate("/student-login"), 1500);
                } else if (msg.toLowerCase().includes("exist")) {
                    setMessage("This email or roll number is already registered. Please login.");
                    setMsgType("error");
                } else {
                    setMessage(msg || "Registration completed.");
                    setMsgType("success");
                    setTimeout(() => navigate("/student-login"), 1500);
                }
            })
            .catch(error => {
                console.log(error);
                setMessage(error.response?.data?.message || "Something went wrong. Please try again.");
                setMsgType("error");
            });
    };

    const fetchDepartments = async () => {
        try {
            const res = await axios.get(rest.departments, header);
            setDepartments(res.data?.data || res.data);
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    return (
        <div className="">
            <div className="card w-50 m-auto p-5">
                <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="currentColor" className="bi bi-mortarboard" viewBox="0 0 16 16">
                        <path d="M8.211 2.047a.5.5 0 0 0-.422 0l-7.5 3.5a.5.5 0 0 0 .025.917l7.5 3a.5.5 0 0 0 .372 0L14 7.14V13a1 1 0 0 0-1 1v2h3v-2a1 1 0 0 0-1-1V6.739l.686-.275a.5.5 0 0 0 .025-.917zM8 8.46 1.758 5.965 8 3.052l6.242 2.913z"/>
                        <path d="M4.176 9.032a.5.5 0 0 0-.656.327l-.5 1.7a.5.5 0 0 0 .294.605l4.5 1.8a.5.5 0 0 0 .372 0l4.5-1.8a.5.5 0 0 0 .294-.605l-.5-1.7a.5.5 0 0 0-.656-.327L8 10.466zm-.068 1.873.22-.748 3.496 1.311a.5.5 0 0 0 .352 0l3.496-1.311.22.748L8 12.46z"/>
                    </svg>
                    <h2>Student Registration</h2>
                    <p className="text-secondary fs-p9">Create your placement account</p>

                    {message && (
                        <div className={msgType === "success" ? "alert-success mt-3" : "alert-danger mt-3"}>
                            <p className={msgType === "success" ? "text-success" : "text-danger"}>
                                {message}
                            </p>
                        </div>
                    )}

                </div>
                <form onSubmit={studentRegistration} method="post">
                    <div className="row">
                        <div className="col-6 p-3">
                            <div className="form-group">
                                <label className="form-control-label">Full Name</label>
                                <input className="form-control" type="text" id="name" placeholder="Enter your Name" onKeyUp={validateName} />
                                {nameError && <p className="text-danger fs-p8 mt-1">{nameError}</p>}
                            </div>
                        </div>
                        <div className="col-6 p-3">
                            <div className="form-group">
                                <label className="form-control-label">Email Address</label>
                                <input className="form-control" type="email" id="email" placeholder="student@college.com" onKeyUp={validateEmail} />
                                {emailError && <p className="text-danger fs-p8 mt-1">{emailError}</p>}
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-6 p-3">
                            <div className="form-group">
                                <label className="form-control-label">Phone Number</label>
                                <input className="form-control" type="text" id="phone" placeholder="Phone Number" onChange={validatePhone} />
                                {phoneError && <p className="text-danger fs-p8 mt-1">{phoneError}</p>}
                            </div>
                        </div>
                        <div className="col-6 p-3">
                            <div className="form-group">
                                <label className="form-control-label">Roll Number</label>
                                <input className="form-control" type="text" id="rollNumber" placeholder="Roll Number" onChange={validateRollNumber} />
                                {rollError && <p className="text-danger fs-p8 mt-1">{rollError}</p>}
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-6 p-3">
                            <div className="form-group">
                                <label className="form-control-label">Department</label>
                                <select className="form-control" id="departmentId" onChange={validateDepartment}>
                                    <option value="">Select Department</option>
                                    {departments.map((dept) => (
                                        <option key={dept.departmentId} value={dept.departmentId}>
                                            {dept.departmentName}
                                        </option>
                                    ))}
                                </select>
                                {departmentError && <p className="text-danger fs-p8 mt-1">{departmentError}</p>}
                            </div>
                        </div>
                        <div className="col-6 p-3">
                            <div className="form-group">
                                <label className="form-control-label">Year</label>
                                <select className="form-control" id="year" onChange={validateYear}>
                                    <option value="">Select Year</option>
                                    <option value="1">1st Year</option>
                                    <option value="2">2nd Year</option>
                                    <option value="3">3rd Year</option>
                                    <option value="4">4th Year</option>
                                </select>
                                {yearError && <p className="text-danger fs-p8 mt-1">{yearError}</p>}
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-6 p-3">
                            <div className="form-group">
                                <label className="form-control-label">Percentage</label>
                                <input className="form-control" type="text" id="percentage" placeholder="e.g. 85" />
                            </div>
                        </div>
                        <div className="col-6 p-3">
                            <div className="form-group">
                                <label className="form-control-label">Password</label>
                                <input className="form-control" type="password" id="password" placeholder="Enter password" />
                            </div>
                        </div>
                    </div>
                    <div className="p-3">
                        <input className="btn btn-primary" type="submit" name="Register" value="Register" />
                    </div>
                </form>
                <div className="fs-p7 text-center text-link mt-2" >
                    <a href="/student-login">Already have an account? Login</a> <br />
                    <a href="/roleselection">Back to role Selection</a>
                </div>
            </div>
        </div>
    )
}

export default StudentRegister;