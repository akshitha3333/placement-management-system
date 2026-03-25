import { useState, useEffect } from "react";
import axios from "axios";
import rest from "../../../Rest";


function AdminDepartments() {
  const [deptName, setDeptName] = useState("");
  const [departments, setDepartments] = useState([]);
  const [error, setError]=useState("");
  const[count,setCount] =useState(0);

let header = {
        headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
        }
    }

   

const handleSubmit = (e) => {
  e.preventDefault();
  if (!deptName.trim()) return;
  setError("");
  const data = {
    departmentName: deptName
  };
  axios.post(rest.departments, data, header)
  .then((response) => {
      setDepartments((prev) => [...prev, response.data]); 
      setDeptName("")
      setCount(count+1)
    console.log(response.data);
  }).catch((error) => {
  if (error.response?.status === 409) {
    setError(`"${deptName}" already exists. Please use a different name.`);
  } else {
    setError("Something went wrong. Please try again.");
  }
  console.error("Error adding department:", error);
});
}
useEffect(()=>{
  getdepartments()
},[count]);
const getdepartments=()=>{
 axios.get(rest.departments,header)
  .then((response) => {
    console.log(response.data);
    let result = response.data
    if(result.success){
      setDepartments(result.data)
    }
  }).catch((error)=>{
    console.log(error);
  })
}


  return (

  <div className="p-4">

    {/* CARD */}
    <div className="card p-4 mb-4 w-50 m-auto text-center">
      <h2 className="fs-4 mb-3">🏢 Add Department</h2>

      <form>
        <div className="row items-center">

          <div className="col-12 p-1">
            <label className="form-control-label text-center">Department Name</label>
            <input
              type="text"
              className="form-control text-center"
              placeholder="Computer Science"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              required
            />
          </div>
            {error && (                          
              <div className="col-12 p-1">
                <p className="text-danger">{error}</p>
              </div>
             )}

          <div className="col-12 p-1 mt-2">
           <button 
              type="button" 
              className="btn btn-primary"
              onClick={handleSubmit}>
                Add Department
          </button>
          </div>

        </div>
      </form>
    </div>

    {/* LIST */}
    <div className="card p-4 w-80 m-auto">
      <h3 className="fs-4 mb-3 text-center">📋 Departments List</h3>

      {departments.length === 0 ? (
        <p className="text-gray-300 text-center">No departments added yet</p>
      ) : (
        <table className="w-100">
          <thead>
            <tr>
              <th className="text-center"></th>
            </tr>
          </thead>

          <tbody>
            {departments.map((dept, index) => (
              <tr key={dept.id || index}>
                <td className="text-center">{dept.departmentName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>

         {/* <div>
          {departments}
         </div> */}
  </div>

  );
}

export default AdminDepartments;