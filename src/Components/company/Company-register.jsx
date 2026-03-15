import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
const rest = require("../../Rest")

function CompanyRegister() {
    const[nameError, setNameError]=useState("");
    const [emailError, setEmailError] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [industryError, setIndustryError] =useState("")
    const [locationError, setLocationError] = useState("");
    const [websiteError, setWebsiteError] = useState("");
    const navigate = useNavigate();


    const validateName=(e)=>{
        const name = e.target.value.trim();
        if(name === ""){
            setNameError("Company name is requried");
        }else if (name.length<=3){
            setNameError("Company name must ne atleast 3 characters")
        }else if (!/^[A-Za-z\s.&-]+$/.test(name)){
            setNameError("only letters, spaces, ., & and - are allowed")
        }else{
            setNameError("");
        }
    }  
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
    const validatePhone = (e) => {
        const phone = e.target.value.trim();
        if(phone === ""){
            setPhoneError("Phone number is required");
        }
        else if(!/^[0-9]{10}$/.test(phone)){
            setPhoneError("Enter a valid 10 digit phone number");
        }
        else{
            setPhoneError("");
        }
    }
    const validateIndustry=(e)=>{
        const industry=e.target.value;
        if(industry === ""){
            setIndustryError("Please select an industry")
        }else{
            setIndustryError("")
        }
    }
        const validateLocation = (e) => {

        const location = e.target.value.trim();

        if(location === ""){
            setLocationError("Location is required");
        }
        else if(location.length < 3){
            setLocationError("Location must be at least 3 characters");
        }
        else{
            setLocationError("");
        }

    }
        const validateWebsite = (e) => {

        const website = e.target.value.trim();

        const pattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;

        if(website === ""){
            setWebsiteError("");
        }
        else if(!pattern.test(website)){
            setWebsiteError("Enter a valid website URL");
        }
        else{
            setWebsiteError("");
        }

    }
     let header = {
        headers: {
            "Content-type": "Application/json"
        }
    }
    const CompanyRegistration = (e) => {
        e.preventDefault();
        let name = document.getElementById("name").value;

        let data = {
            "name": name,
            "email": email,
            "phone": phone,
            "industry":industry,
            "location": location,
            "website": website,
        }
        axios.post(rest.CompanyRegistration, data, header)
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
                     <h2>Company Registration</h2>
                     <p className="sub-text">Register your company for campus recruitment</p>
                </div>
               <form onSubmit={CompanyRegistration} method="post">
                <div className="row">
                    <div className="col-6 p-3">
                        <div className="form-group">
                        <label className="form-control-label">Company Name</label>
                        <input className="form-control"type="text"  id="name" placeholder="Tech Corp" onKeyUp={validateName} />
                        <p className="error fs-p8">{nameError}</p>
                    </div>
                    </div>
                    <div className="col-6 p-3">
                        <div className="form-group">
                            <label className="form-control-label">Email Address</label>
                            <input className="form-control" type="email" id="email"  placeholder="hr@company.com" onKeyUp={validateEmail}/>
                            <p className="error fs-p8">{emailError}</p>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-6 p-3">
                        <div className="form-group">
                            <label className="form-control-label">Phone Number</label>
                            <input className="form-control" type="text" id="phone"  placeholder="+91 9876543210" onChange={validatePhone} />
                            <p className="error fs-p8">{phoneError}</p>
                        </div>
                    </div>
                    <div className=" col-6 p-3">
                        <div className="form-group">
                        <label className="form-control-label">Industry</label>
                        <select className="form-control" id="industry" onChange={validateIndustry}>
                            <option>Select Industry</option>
                            <option>IT</option>
                            <option>Finance</option>
                            <option>Marketing</option>
                        </select>
                        <p className="error fs-p8">{industryError}</p>
                    </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-6 p-3">
                         <div className="form-group">
                           <label className="form-control-label">Location</label>
                            <input  className="form-control"type="text" id="location" placeholder="Bangalore, India" onChange={validateLocation}/>
                            <p className="error fs-p8">{locationError}</p>
                        </div>

                    </div>
                    <div className="col-6 p-3">
                         <div className="form-group">
                        <label className="form-control-label">Website</label>
                        <input className="form-control" type="text" id="website" placeholder="www.company.com" onChange={validateWebsite}/>
                        <p className="error fs-p8">{websiteError}</p>
                    </div>
                    </div>
                   
                </div>
                <div>
                    <input className="btn btn-primary mt-5" type="submit" name="Register" value="Register" />
                </div>
               </form>
                
                <div className="fs-p7 text-center link-color mt-2" >
                    <a   href="/company-login">Aleady have an account? Login</a> <br />
                    <a   href="/roleselection">Back to role Selection</a>
                </div>
            </div>
        </div>
    )
}
export default CompanyRegister; 