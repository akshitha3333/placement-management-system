import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
const rest = require("../../Rest")
function CompanyRegister() {
    const [nameError, setNameError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [rollError, setRollError] = useState("");
    const [departmentError, setDepartmentError] = useState("");
    const [yearError, setYearError] = useState("");
    const [fileError, setFileError] = useState("");
    const navigate = useNavigate();

    const validateName = (e) => {
        const name = e.target.value.trim();
        if (name === "") {
            setNameError("Company name is requried");
        } else if (name.length <= 3) {
            setNameError("Company name must ne atleast 3 characters")
        } else if (!/^[A-Za-z\s.&-]+$/.test(name)) {
            setNameError("only letters, spaces, ., & and - are allowed")
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
            setEmailError("valid Email");
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
    const validateFile = (e) => {

        const file = e.target.files[0];

        if (!file) {
            setFileError("Please upload a file");
            return;
        }

        const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

        if (!allowedTypes.includes(file.type)) {
            setFileError("Only PDF or Word files are allowed");
            return;
        }

        const maxSize = 2 * 1024 * 1024; // 2MB

        if (file.size > maxSize) {
            setFileError("File size must be less than 2MB");
            return;
        }

        setFileError("");
    }

    let header = {
        headers: {
            "Content-type": "Application/json"
        }
    }
    const studentRegistration = (e) => {
        e.preventDefault();
        let name = document.getElementById("name").value;

        let data = {
            "name": name,
            "email": email,
            "phone": phone,
            "roll": roll,
            "departments": departments,
            "year": year,
        }
        axios.post(rest.StudentRegister, data, header)
            .then(response => {
                console.log(response.data);
                if (response.data === "Student Registered Successfully") {

                    setMessage(response.data);
                    setMsgType("success");

                    setTimeout(() => {
                        navigate("/student-register");
                    }, 1500);

                } else {

                    setMessage(response.data);
                    setMsgType("erro");
                }
            })
            .catch(error => {
                console.log(error);
                setMessage("Something Went Wrong");
                setMsgType("erro");
            });


    }
    return (
        <div className="">
            <div className="card w-50 m-auto p-5">
                <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="currentColor" class="bi bi-buildings" viewBox="0 0 16 16">
                        <path d="M14.763.075A.5.5 0 0 1 15 .5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V14h-1v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V10a.5.5 0 0 1 .342-.474L6 7.64V4.5a.5.5 0 0 1 .276-.447l8-4a.5.5 0 0 1 .487.022M6 8.694 1 10.36V15h5zM7 15h2v-1.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5V15h2V1.309l-7 3.5z" />
                        <path d="M2 11h1v1H2zm2 0h1v1H4zm-2 2h1v1H2zm2 0h1v1H4zm4-4h1v1H8zm2 0h1v1h-1zm-2 2h1v1H8zm2 0h1v1h-1zm2-2h1v1h-1zm0 2h1v1h-1zM8 7h1v1H8zm2 0h1v1h-1zm2 0h1v1h-1zM8 5h1v1H8zm2 0h1v1h-1zm2 0h1v1h-1zm0-2h1v1h-1z" />
                    </svg>
                    <h2>Student Registration</h2>
                    <p className="sub-text">Create your placement account</p>
                </div>
                <form onSubmit={studentRegistration} method="post">
                    <div className="row">
                        <div className="col-6 p-3">
                            <div className="form-group">
                                <label className="form-control-label">Full Name</label>
                                <input className="form-control" type="text" id="name" placeholder="Enter your Name" onKeyUp={validateName} />
                                <p className="error fs-p8">{nameError}</p>
                            </div>
                        </div>
                        <div className="col-6 p-3">
                            <div className="form-group">
                                <label className="form-control-label">Email Address</label>
                                <input className="form-control" type="email" id="email" placeholder="hr@company.com" onKeyUp={validateEmail} />
                                <p className="error fs-p8">{emailError}</p>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-6 p-3">
                            <div className="form-group">
                                <label className="form-control-label">Phone Number</label>
                                <input className="form-control" type="text" id="phone" placeholder="Phone Number" onChange={validatePhone} />
                                <p className="error fs-p8">{phoneError}</p>
                            </div>
                        </div>
                        <div className="col-6 p-3">
                            <div className="form-group">
                                <label className="form-control-label">Roll Number</label>
                                <input className="form-control" type="text" id="roll" placeholder="Roll Number" onChange={validateRollNumber} />
                                <p className="error fs-p8">{rollError}</p>
                            </div>
                        </div>

                    </div>

                    <div className="row">
                        <div className=" col-6 p-3">
                            <div className="form-group">
                                <label className="form-control-label">Departments</label>
                                <select className="form-control" id="departments" onChange={validateDepartment}>
                                    <option>Select Industry</option>
                                    <option>Computer Science</option>
                                    <option>Data Science</option>
                                    <option>Artificial Intelligence</option>
                                    <option>Information Technology</option>
                                    <option>Electronics</option>
                                    <option>Mechanical</option>
                                    <option>Civil</option>
                                    <option>Mathematics</option>
                                </select>
                                <p className="error fs-p8">{departmentError}</p>
                            </div>
                        </div>
                        <div className=" col-6 p-3">
                            <div className="form-group">
                                <label className="form-control-label">Year</label>
                                <select className="form-control" id="year" onChange={validateYear}>
                                    <option value="">Select Year</option>
                                    <option value="1">1st Year</option>
                                    <option value="2">2nd Year</option>
                                    <option value="3">3rd Year</option>
                                    <option value="4">4th Year</option>
                                </select>
                                <p className="error">{yearError}</p>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className=" col-6 p-3">
                            <div className="form-group">
                                <label className="form-control-label">Upload Resume</label>
                                <input class="form-control" type="file" id="resume" onChange={validateFile} />
                                <p className="error fs-p8">{fileError}</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <input className="btn btn-primary mt-5" type="submit" name="Register" value="Register" />
                    </div>
                </form>
                <div className="fs-p7 text-center link-color mt-2" >
                    <a href="/student-login ">Aleady have an account? Login</a> <br />
                    <a href="/roleselection">Back to role Selection</a>
                </div>
            </div>
        </div>
    )
}

export default StudentRegister; 