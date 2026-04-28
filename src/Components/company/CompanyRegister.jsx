import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import rest from "../../Rest";
import LocationPicker from "./LocationPicker";

function CompanyRegister() {
  const [nameError,     setNameError]     = useState("");
  const [emailError,    setEmailError]    = useState("");
  const [phoneError,    setPhoneError]    = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [industryError, setIndustryError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [websiteError,  setWebsiteError]  = useState("");
  const [message,       setMessage]       = useState("");
  const [msgType,       setMsgType]       = useState("");
  const [latitude,      setLatitude]      = useState("");
  const [longitude,     setLongitude]     = useState("");
  const [about,         setAbout]         = useState("");
  const [file,          setFile]          = useState(null);

  const navigate = useNavigate();

  const fileSelectedHandler = (e) => setFile(e.target.files[0]);

  const validateName = (e) => {
    const v = e.target.value.trim();
    if (!v)                                setNameError("Company name is required");
    else if (v.length <= 3)                setNameError("Must be at least 4 characters");
    else if (!/^[A-Za-z\s.&-]+$/.test(v)) setNameError("Only letters, spaces, . & - allowed");
    else                                   setNameError("");
  };
  const validateEmail = (e) => {
    const v = e.target.value;
    if (!v)                                          setEmailError("Email is required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) setEmailError("Invalid email format");
    else                                             setEmailError("");
  };
  const validatePhone = (e) => {
    const v = e.target.value.trim();
    if (!v)                           setPhoneError("Phone is required");
    else if (!/^[0-9]{10}$/.test(v))  setPhoneError("Enter a valid 10-digit number");
    else                              setPhoneError("");
  };
  const validatePassword = (e) => {
    if (!e.target.value) setPasswordError("Password is required");
    else                 setPasswordError("");
  };
  const validateIndustry = (e) => {
    if (!e.target.value) setIndustryError("Please select an industry");
    else                 setIndustryError("");
  };
  const validateLocation = (e) => {
    const v = e.target.value.trim();
    if (!v)            setLocationError("Location is required");
    else if (v.length < 3) setLocationError("At least 3 characters");
    else               setLocationError("");
  };
  const validateWebsite = (e) => {
    const v = e.target.value.trim();
    if (!v) { setWebsiteError(""); return; }
    if (!/^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(v))
      setWebsiteError("Enter a valid URL");
    else setWebsiteError("");
  };

  const CompanyRegistration = (e) => {
    e.preventDefault();
    console.log("Submit — lat:", latitude, "lng:", longitude, "file:", file?.name);

    if (!file) {
      setMessage("Please upload a company logo.");
      setMsgType("error");
      return;
    }

    const formdata = new FormData();
    formdata.append("companyName",  document.getElementById("name").value);
    formdata.append("phone",        document.getElementById("phone").value);
    formdata.append("website",      document.getElementById("website").value);
    formdata.append("industryType", document.getElementById("industry").value);
    formdata.append("location",     document.getElementById("companylocation").value);
    formdata.append("email",        document.getElementById("email").value);
    formdata.append("latitude",     latitude);
    formdata.append("longitude",    longitude);
    formdata.append("about",        about);
    formdata.append("logo",         file);
    formdata.append("password",     document.getElementById("password").value);

    axios.post(rest.company, formdata)
      .then((response) => {
        console.log("Register response:", response.data);
        const str = typeof response.data === "string"
          ? response.data.toLowerCase()
          : (response.data?.message || "").toLowerCase();

        if (str.includes("success") || str.includes("register")) {
          setMessage("Company registered successfully! Redirecting to login...");
          setMsgType("success");
          setTimeout(() => navigate("/company-login"), 1500);
        } else if (str.includes("exist")) {
          setMessage("This email or phone is already registered. Please login.");
          setMsgType("error");
        } else {
          setMessage(response.data?.message || response.data || "Registration failed.");
          setMsgType("error");
        }
      })
      .catch((error) => {
        console.error("Register error:", error.response?.data || error.message);
        setMessage(error.response?.data?.message || "Something went wrong. Please try again.");
        setMsgType("error");
      });
  };

  return (
    <div>
      <div className="card w-50 m-auto p-5">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="currentColor" className="bi bi-buildings" viewBox="0 0 16 16">
            <path d="M14.763.075A.5.5 0 0 1 15 .5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V14h-1v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V10a.5.5 0 0 1 .342-.474L6 7.64V4.5a.5.5 0 0 1 .276-.447l8-4a.5.5 0 0 1 .487.022M6 8.694 1 10.36V15h5zM7 15h2v-1.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5V15h2V1.309l-7 3.5z"/>
            <path d="M2 11h1v1H2zm2 0h1v1H4zm-2 2h1v1H2zm2 0h1v1H4zm4-4h1v1H8zm2 0h1v1h-1zm-2 2h1v1H8zm2 0h1v1h-1zm2-2h1v1h-1zm0 2h1v1h-1zM8 7h1v1H8zm2 0h1v1h-1zm2 0h1v1h-1zM8 5h1v1H8zm2 0h1v1h-1zm2 0h1v1h-1zm0-2h1v1h-1z"/>
          </svg>
          <h2>Company Registration</h2>
          <p className="text-secondary fs-p9">Register your company for campus recruitment</p>

          {message && (
            <div className={msgType === "success" ? "alert-success mt-3" : "alert-danger mt-3"}>
              <p className={msgType === "success" ? "text-success" : "text-danger"}>{message}</p>
            </div>
          )}
        </div>

        <form onSubmit={CompanyRegistration}>

          {/* Row 1 — Name + Email */}
          <div className="row">
            <div className="col-6 p-3">
              <div className="form-group">
                <label className="form-control-label">Company Name</label>
                <input className="form-control" type="text" id="name" placeholder="Tech Corp" onKeyUp={validateName} />
                {nameError && <p className="text-danger fs-p8 mt-1">{nameError}</p>}
              </div>
            </div>
            <div className="col-6 p-3">
              <div className="form-group">
                <label className="form-control-label">Email Address</label>
                <input className="form-control" type="email" id="email" placeholder="hr@company.com" onKeyUp={validateEmail} />
                {emailError && <p className="text-danger fs-p8 mt-1">{emailError}</p>}
              </div>
            </div>
          </div>

          {/* Row 2 — Phone + Industry */}
          <div className="row">
            <div className="col-6 p-3">
              <div className="form-group">
                <label className="form-control-label">Phone Number</label>
                <input className="form-control" type="text" id="phone" placeholder="9876543210" onChange={validatePhone} />
                {phoneError && <p className="text-danger fs-p8 mt-1">{phoneError}</p>}
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
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Other">Other</option>
                </select>
                {industryError && <p className="text-danger fs-p8 mt-1">{industryError}</p>}
              </div>
            </div>
          </div>

          {/* Row 3 — Location + Website */}
          <div className="row">
            <div className="col-6 p-3">
              <div className="form-group">
                <label className="form-control-label">City / Location</label>
                <input className="form-control" type="text" id="companylocation" placeholder="Hyderabad" onChange={validateLocation} />
                {locationError && <p className="text-danger fs-p8 mt-1">{locationError}</p>}
              </div>
            </div>
            <div className="col-6 p-3">
              <div className="form-group">
                <label className="form-control-label">Website</label>
                <input className="form-control" type="text" id="website" placeholder="www.company.com" onChange={validateWebsite} />
                {websiteError && <p className="text-danger fs-p8 mt-1">{websiteError}</p>}
              </div>
            </div>
          </div>

          {/* Row 4 — Logo + Password */}
          <div className="row">
            <div className="col-6 p-3">
              <div className="form-group">
                <label className="form-control-label">Company Logo</label>
                <input className="form-control" type="file" id="logo" onChange={fileSelectedHandler} />
              </div>
            </div>
            <div className="col-6 p-3">
              <div className="form-group">
                <label className="form-control-label">Password</label>
                <input className="form-control" type="password" id="password"
                  placeholder="Enter your password" required onKeyUp={validatePassword} />
                {passwordError && <p className="text-danger fs-p8 mt-1">{passwordError}</p>}
              </div>
            </div>
          </div>

          {/* About */}
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

          {/* ── Map Location Picker ── */}
          <div className="col-12 p-3">
            <label className="form-control-label">Company Location on Map</label>
            <p className="fs-p8 text-secondary mb-2">
              Pin your company location — coordinates saved automatically to the database.
            </p>
            <LocationPicker
              lat={latitude}
              lng={longitude}
              onChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
              height={300}
            />
          </div>

          <div className="p-3">
            <input className="btn btn-primary" type="submit" value="Register" />
          </div>
        </form>

        <div className="fs-p7 text-center text-link mt-2">
          <a href="/company-login">Already have an account? Login</a> <br />
          <a href="/roleselection">Back to role Selection</a>
        </div>
      </div>
    </div>
  );
}

export default CompanyRegister;