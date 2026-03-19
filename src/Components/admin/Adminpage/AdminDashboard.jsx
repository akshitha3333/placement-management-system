import { useEffect,useState } from "react";
import rest from "../../../Rest";
import axios from "axios";

function AdminDashboard() {

    const [loading, setLoading] = useState(true);
    const [placementByDept, setPlacementByDept] = useState([]);
    const [applicationStatus, setApplicationStatus] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [upcomingInterviews, setUpcomingInterviews] = useState([]);

useEffect(() => {

  Promise.all([
    axios.get(rest.placement),
    axios.get(rest.applicationStatus),
    axios.get(rest.activities),
    axios.get(rest.interviews)
  ])
  .then(([p, a, r, i]) => {

    setPlacementByDept(p.data);
    setApplicationStatus(a.data);
    setRecentActivities(r.data);
    setUpcomingInterviews(i.data);

    setLoading(false);

  })
  .catch(err => console.log(err));

}, []);

if (loading) return <p>Loading...</p>;

    return (

        <div className="p-5">

            {/* Heading */}
            <h2 className="fs-5 bold">Placement Dashboard - Batch 2024</h2>
            <p className="text-secondary fs-p9 mb-4">
                Real-time placement analytics
            </p>

            {/* ================= STATS ================= */}
            <div className="row">

                {[
                    { title: "Total Students", value: 480, sub: "+24 this month" },
                    { title: "Companies", value: 38, sub: "+3 pending approval" },
                    { title: "Students Placed", value: 156, sub: "32.5% rate" },
                    { title: "Active Jobs", value: 27, sub: "5 closing soon" }
                ].map((item, i) => (

                    <div className="col-3 p-2" key={i}>
                        <div className="card p-4 stat-card">
                            <p className="fs-p9 text-secondary">{item.title}</p>
                            <h2 className="bold">{item.value}</h2>
                            <p className="fs-p9 text-success">{item.sub}</p>
                        </div>
                    </div>

                ))}

            </div>

            {/* ================= SIDE BY SIDE ================= */}
            <div className="row mt-5">

                {/* Department Placement */}
                <div className="col-6 p-2">
                    <div className="card p-4 h-100">

                        <h4 className="mb-3">Department-wise Placement</h4>

                        <table className="w-100">
                            <thead>
                                <tr>
                                    <th>Dept</th>
                                    <th>Total</th>
                                    <th>Placed</th>
                                </tr>
                            </thead>

                            <tbody>
                                {placementByDept.map((d, i) => (
                                    <tr key={i}>
                                        <td>{d.name}</td>
                                        <td>{d.total}</td>
                                        <td className="text-success">{d.placed}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                    </div>
                </div>

                {/* Application Status */}
                <div className="col-6 p-2">
                    <div className="card p-4 h-100">

                        <h4 className="mb-3">Application Status</h4>

                        {applicationStatus.map((item, i) => (
                            <div key={i} className="row space-between mb-2 status-item">
                                <span>{item.name}</span>
                                <span className="bold">{item.value}</span>
                            </div>
                        ))}

                    </div>
                </div>

            </div>

            {/* ================= RECENT ================= */}
            <div className="card mt-5 p-4">

                <h4 className="mb-3">Recent Activities</h4>

                {recentActivities.map((a, i) => (
                    <div key={i} className="mb-2 activity-item">
                        <p>{a.text}</p>
                        <small className="text-secondary">{a.time}</small>
                    </div>
                ))}

            </div>

            {/* ================= INTERVIEWS ================= */}
            <div className="card mt-5 p-4">

                <h4 className="mb-3">Upcoming Interviews</h4>

                <table className="w-100">
                    <thead>
                        <tr>
                            <th>Company</th>
                            <th>Date</th>
                            <th>Candidates</th>
                            <th>Dept</th>
                        </tr>
                    </thead>

                    <tbody>
                        {upcomingInterviews.map((i, index) => (
                            <tr key={index}>
                                <td>{i.company}</td>
                                <td>{i.date}</td>
                                <td>{i.candidates}</td>
                                <td>{i.dept}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

            </div>

        </div>
    );
}
export default AdminDashboard;