import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import rest from "../../Rest";

function CompanyRegister() {
    const[nameError, setNameError]=useState("");
    const [emailError, setEmailError] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [passwordError,setPasswordError]=useState("");
    const [industryError, setIndustryError] =useState("");
    const [locationError, setLocationError] = useState("");
    const [websiteError, setWebsiteError] = useState("");
    const [message, setMessage] = useState("");
    const [msgType, setMsgType] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [about, setAbout] = useState("");
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [state, setState] = useState({});


     
    const fileSelectedHandler = (event) => {
      setFile(event.target.files[0]);
    };
    const validateName=(e)=>{
        const name = e.target.value.trim();
        if(name === ""){
            setNameError("Company name is required");
        }else if (name.length<=3){
            setNameError("Company name must be atleast 3 characters")
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
            setEmailError("");
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
     const validatePassword = (e) => {

    const password = e.target.value;

    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if(password === ""){
        setPasswordError("Password is required");
    }
    else{
        setPasswordError("");
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

        const companylocation = e.target.value.trim();

        if(companylocation === ""){
            setLocationError("Location is required");
        }
        else if(companylocation.length < 3){
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
    //  const header = {
    //     headers: {
    //         "Content-type": "multipart/form-data"
    //     }
    // };
    const CompanyRegistration = (e) => {
    e.preventDefault();
    console.log(file);
    
    if (!file) {
    setMessage("Please upload company logo");
    setMsgType("error");
    return;
  } 
    let name = document.getElementById("name").value;
    let email = document.getElementById("email").value;
    let phone = document.getElementById("phone").value;
    let industry = document.getElementById("industry").value;
    let location = document.getElementById("companylocation").value;
    let website = document.getElementById("website").value;
    let password  = document.getElementById("password").value;
    const formdata = new FormData();
    formdata.append("companyName", name);
    formdata.append("phone", phone);
    formdata.append("website", website);
    formdata.append("industryType", industry);
    formdata.append("location", location);
    formdata.append("email", email);
    formdata.append("latitude", latitude);
    formdata.append("longitude", longitude);
    formdata.append("about", about);
    formdata.append("logo", file);
    formdata.append("password", password);
    console.log(state.selectedFile);
    console.log(rest.company);

    axios.post(rest.company, formdata)
        .then(response => {
            if (response.data === "Company Registered Successfully") {
                setMessage(response.data);
                setMsgType("success");

                setTimeout(() => {
                    navigate("/company-login");
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
};
    
   return (
  <div className="">
    <div className="card w-50 m-auto p-5">
      <div className="text-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="currentColor" className="bi bi-buildings" viewBox="0 0 16 16">
          <path d="M14.763.075A.5.5 0 0 1 15 .5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V14h-1v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V10a.5.5 0 0 1 .342-.474L6 7.64V4.5a.5.5 0 0 1 .276-.447l8-4a.5.5 0 0 1 .487.022M6 8.694 1 10.36V15h5zM7 15h2v-1.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5V15h2V1.309l-7 3.5z"/>
          <path d="M2 11h1v1H2zm2 0h1v1H4zm-2 2h1v1H2zm2 0h1v1H4zm4-4h1v1H8zm2 0h1v1h-1zm-2 2h1v1H8zm2 0h1v1h-1zm2-2h1v1h-1zm0 2h1v1h-1zM8 7h1v1H8zm2 0h1v1h-1zm2 0h1v1h-1zM8 5h1v1H8zm2 0h1v1h-1zm2 0h1v1h-1zm0-2h1v1h-1z"/>
        </svg>
        <h2>Company Registration</h2>
        <p className="text-secoundary fs-p9">Register your company for campus recruitment</p>
        {message && <p className={msgType === "success" ? "text-succ0000000000000000ess" : "text-danger"}>{message}</p>}
      </div>

      <form onSubmit={CompanyRegistration} method="post">

        <div className="row">
          <div className="col-6 p-3">
            <div className="form-group">
              <label className="form-control-label">Company Name</label>
              <input className="form-control" type="text" id="name" placeholder="Tech Corp" onKeyUp={validateName} />
              <p className="text-danger fs-p8">{nameError}</p>
            </div>
          </div>
          <div className="col-6 p-3">
            <div className="form-group">
              <label className="form-control-label">Email Address</label>
              <input className="form-control" type="email" id="email" placeholder="hr@company.com" onKeyUp={validateEmail} />
              <p className="text-danger fs-p8">{emailError}</p>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-6 p-3">
            <div className="form-group">
              <label className="form-control-label">Phone Number</label>
              <input className="form-control" type="text" id="phone" placeholder="phone number" onChange={validatePhone} />
              <p className="text-danger fs-p8">{phoneError}</p>
            </div>
          </div>
          <div className="col-6 p-3">
            <div className="form-group">
              <label className="form-control-label">Industry Type</label>
              <select className="form-control" id="industry" onChange={validateIndustry}>
                <option value="">Select Industry</option>
                <option value="IT">IT</option>
                <option value="Finance">Finance</option>
                <option value="Marketing">Marketing</option>
              </select>
              <p className="text-danger fs-p8">{industryError}</p>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-6 p-3">
            <div className="form-group">
              <label className="form-control-label">Location</label>
              <input className="form-control" type="text" id="companylocation" placeholder="Location" onChange={validateLocation} />
              <p className="text-danger fs-p8">{locationError}</p>
            </div>
          </div>
          <div className="col-6 p-3">
            <div className="form-group">
              <label className="form-control-label">Website</label>
              <input className="form-control" type="text" id="website" placeholder="www.company.com" onChange={validateWebsite} />
              <p className="text-danger fs-p8">{websiteError}</p>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-6 p-3">
            <div className="form-group">
              <label className="form-control-label">Latitude</label>
              <input className="form-control" type="text" id="latitude" placeholder="12.9716" onChange={(e) => setLatitude(e.target.value)} />
            </div>
          </div>
          <div className="col-6 p-3">
            <div className="form-group">
              <label className="form-control-label">Longitude</label>
              <input className="form-control" type="text" id="longitude" placeholder="77.5946" onChange={(e) => setLongitude(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12 p-3">
            <div className="form-group">
              <label className="form-control-label">Company Logo URL</label>
              <input className="form-control" type="file" id="logo" onChange={fileSelectedHandler} />
            </div>
          </div>
          <div className="col-6 p-3">
            <div className="form-group">
                    <label className="form-control-label" htmlFor="Password">Password</label>
                    <input  className="form-control" type="password" name="password" id="password" placeholder="Enter your Password" required onKeyUp={validatePassword}/>
                    <p className="text-danger">{passwordError}</p>
                </div>
          </div>
          
        </div>
        
        <div className="row">
          <div className="col-12 p-3">
            <div className="form-group">
              <label className="form-control-label">About</label>
              <textarea
                className="form-control"
                id="about"
                placeholder="Brief description about your company..."
                rows="3"
                onChange={(e) => setAbout(e.target.value)}
                style={{ resize: "vertical" }}
              />
            </div>
          </div>
        </div>

        <div className="p-3">
          <input className="btn btn-primary" type="submit" value="Register"  />
        </div>

      </form>

      <div className="fs-p7 text-center text-link mt-2">
        <a href="/company-login">Already have an account? Login</a> <br />
        <a href="/roleselection">Back to role Selection</a>
      </div>

    </div>
  </div>
   )

}
export default CompanyRegister; 