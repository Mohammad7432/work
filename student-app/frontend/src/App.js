import React, { useState } from "react";

export default function App() {
  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    urn: "",
    course: "",
    year: "",
    subject: "",
    experience: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  // Basic validation
  if (!formData.email || !formData.password || (!isLogin && !formData.name)) {
    setMessage("Please fill all required fields!");
    return;
  }

  // Role-based validation
  if (!isLogin) {
    if (formData.role === "student") {
      if (!formData.urn || !formData.course || !formData.year) {
        setMessage("Please fill all student details!");
        return;
      }
    }

    if (formData.role === "teacher") {
      if (!formData.subject || !formData.experience) {
        setMessage("Please fill all teacher details!");
        return;
      }
    }

    if (formData.role === "admin") {
      if (!formData.adminCode) {
        setMessage("Admin code required!");
        return;
      }
    }
  }

  try {
    const url = isLogin
      ? "http://localhost:5000/api/auth/login"
      : "http://localhost:5000/api/auth/signup";

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (res.ok) {
      if (isLogin) {
        setMessage("Login Successful! Welcome 🎉");

        // 🔥 ROLE BASED REDIRECT (HTML pages via backend)
        setTimeout(() => {
          if (data.role === "admin") {
            window.location.href = "http://localhost:5000/home";
          } else if (data.role === "teacher") {
            window.location.href = "http://localhost:5000/dashboard";
          } else {
            window.location.href = "http://localhost:5000/home";
          }
        }, 1000);

      } else {
        setMessage("Account Created Successfully! Please Login.");
      }

      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "student",
        urn: "",
        course: "",
        year: "",
        subject: "",
        experience: "",
        adminCode: "",
      });

    } else {
      setMessage(data.error || "Something went wrong");
    }

  } catch (err) {
    console.error(err);
    setMessage("Server error. Please try again.");
  }

  

};


  return (
    <div style={styles.body}>
      <style>{css}</style>

      <h1 className="main-heading">WELCOME TO 70 HOURS COURSE</h1>

      <div className="card">
        {/* LEFT PANEL */}
        <div className="left-panel">
          <h2>AI & Data Science Program</h2>
          <p>
            Master Artificial Intelligence and Data Science in 70 hours.
            Learn Machine Learning, Python, Deep Learning and Real-world Projects.
            Upgrade your career with industry-ready skills.
          </p>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          <h2 className="form-title">
            {isLogin ? "Student Login" : "Create Your Account"}
          </h2>

          <form onSubmit={handleSubmit}>

            {/* NAME */}
            {!isLogin && (
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
              />
            )}

            {/* ROLE */}
            {!isLogin && (
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            )}

            {/* EMAIL */}
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
            />

            {/* PASSWORD */}
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />

            {/* STUDENT FIELDS */}
            {!isLogin && formData.role === "student" && (
              <>
                <input
                  type="text"
                  name="urn"
                  placeholder="University Roll Number (URN)"
                  value={formData.urn}
                  onChange={handleChange}
                />

                <input
                  type="text"
                  name="course"
                  placeholder="Course (e.g. B.Tech, BCA)"
                  value={formData.course}
                  onChange={handleChange}
                />

                <input
                  type="text"
                  name="year"
                  placeholder="Year (e.g. 1st, 2nd, 3rd)"
                  value={formData.year}
                  onChange={handleChange}
                />
              </>
            )}

            {/* TEACHER FIELDS */}
            {!isLogin && formData.role === "teacher" && (
              <>
                <input
                  type="text"
                  name="subject"
                  placeholder="Subject You Teach"
                  value={formData.subject}
                  onChange={handleChange}
                />

                <input
                  type="text"
                  name="experience"
                  placeholder="Years of Experience"
                  value={formData.experience}
                  onChange={handleChange}
                />
              </>
            )}

            {/* SUBMIT BUTTON */}
            <button type="submit">
              {isLogin ? "Login" : "Create Account"}
            </button>
          </form>

          {/* TOGGLE */}
          <p
            className="toggle"
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage("");
            }}
          >
            {isLogin
              ? "Don't have an account? Sign Up"
              : "Already have an account? Login"}
          </p>

          {/* MESSAGE */}
          {message && <p className="message">{message}</p>}
        </div>
      </div>
    </div>
  );
}

const styles = {
  body: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
};

const css = `
  .main-heading {
    color: white;
    font-size: 48px;
    font-weight: 800;
    margin-bottom: 30px;
    text-align: center;
  }

  .card {
    width: 900px;
    height: 520px;
    background: white;
    border-radius: 20px;
    display: flex;
    overflow: hidden;
    box-shadow: 0 25px 60px rgba(0,0,0,0.3);
  }

  .left-panel {
    width: 50%;
    background: linear-gradient(135deg, #5a67d8, #6b46c1);
    color: white;
    padding: 50px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .left-panel h2 {
    font-size: 30px;
    margin-bottom: 20px;
  }

  .right-panel {
    overflow-y: auto;
    width: 50%;
    padding: 50px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .form-title {
    font-size: 26px;
    margin-bottom: 20px;
  }

  input, select {
    width: 100%;
    padding: 12px;
    margin-bottom: 12px;
    border-radius: 8px;
    border: 1px solid #ddd;
    font-size: 14px;
    transition: 0.3s;
  }

  input:focus, select:focus {
    border-color: #5a67d8;
    box-shadow: 0 0 8px rgba(90,103,216,0.3);
    outline: none;
  }

  button {
    width: 100%;
    padding: 12px;
    background: #5a67d8;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 10px;
  }

  button:hover {
    background: #434190;
  }

  .toggle {
    margin-top: 15px;
    text-align: center;
    font-size: 14px;
    cursor: pointer;
    color: #5a67d8;
    font-weight: 500;
  }

  .message {
    margin-top: 10px;
    text-align: center;
    font-size: 14px;
    color: green;
  }

  @media (max-width: 950px) {
    .card {
      width: 95%;
      height: auto;
      flex-direction: column;
    }

    .left-panel, .right-panel {
      width: 100%;
    }
  }
`;
