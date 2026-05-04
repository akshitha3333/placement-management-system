import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../Rest");

function CompanyLogin() {
  const [emailError,    setEmailError]    = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [message,       setMessage]       = useState("");
  const [msgType,       setMsgType]       = useState("");
  const [isLoading,     setIsLoading]     = useState(false);
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
  };

 const validatePassword = (e) => {
        const password = e.target.value;
        if (password === "") {
            setPasswordError("Password is required");
        } else {
            setPasswordError("");
        }
    }

  const CompanyLogin = async (e) => {
    e.preventDefault();

    const email    = document.getElementById("Email").value;
    const password = document.getElementById("Password").value;

    setIsLoading(true);
    setMessage("");

    try {
      // Step 1 — Login and get token
      const loginRes = await axios.post(
        rest.login,
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      const success = loginRes.data.success;
      const token   = loginRes.data.data;

      if (!success || !token) {
        setMessage(loginRes.data.message || "Invalid credentials. Please try again.");
        setMsgType("error");
        return;
      }

      // Step 2 — Fetch companies and check this company's verification status
      const companiesRes = await axios.get(rest.companys, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const list = Array.isArray(companiesRes.data?.data)
        ? companiesRes.data.data
        : Array.isArray(companiesRes.data)
        ? companiesRes.data
        : [];

      const myCompany = list.find(
        (c) => (c.email || "").toLowerCase() === email.toLowerCase()
      );

      const status = (myCompany?.status || "").toString().trim().toUpperCase();

      if (status !== "VERIFIED") {
        setMessage("Your account is not yet verified by the admin. Please wait for approval.");
        setMsgType("unverified");
        return;
      }

      // Step 3 — Verified: store token and redirect
      Cookies.set("token", token);
      localStorage.setItem("token", token);
      setMessage("Login successful! Redirecting...");
      setMsgType("success");
      setTimeout(() => navigate("/company-page"), 1500);

    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || "Something went wrong. Please try again.");
      setMsgType("error");
    } finally {
      setIsLoading(false);
    }
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

          {message && msgType === "success" && (
            <div className="alert-success mt-3">
              <p className="text-success">{message}</p>
            </div>
          )}

          {message && msgType === "error" && (
            <div className="alert-danger mt-3">
              <p className="text-danger">{message}</p>
            </div>
          )}

          {message && msgType === "unverified" && (
            <div className="alert-danger mt-3">
              <p className="text-danger">⚠️ {message}</p>
            </div>
          )}
        </div>

        <form onSubmit={CompanyLogin} method="post">
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
            <input
              className="btn btn-primary mt-5"
              type="submit"
              name="Login"
              value={isLoading ? "Logging in..." : "Login"}
              disabled={isLoading}
            />
          </div>
        </form>

        <div className="fs-p7 text-center text-link mt-2">
          <a href="/roleselection">Back to role Selection</a>
        </div>
      </div>
    </div>
  );
}

export default CompanyLogin;