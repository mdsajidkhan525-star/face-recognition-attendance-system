import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "https://face-recognition-attendance-system-evfu.onrender.com";
const TOTAL_FACE_IMAGES = 20;

axios.defaults.withCredentials = true;

function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [loginRole, setLoginRole] = useState("admin");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [activePage, setActivePage] = useState("dashboard");

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  const [totalStudents, setTotalStudents] = useState(0);
  const [presentStudents, setPresentStudents] = useState(0);
  const [absentStudents, setAbsentStudents] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState(0);

  const [studentDashboard, setStudentDashboard] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [studentAttendance, setStudentAttendance] = useState([]);

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentCourse, setStudentCourse] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentConfirmPassword, setStudentConfirmPassword] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
const [confirmAdminPassword, setConfirmAdminPassword] = useState("");
const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
const [passwordChangeMessage, setPasswordChangeMessage] = useState("");
const [passwordChangeError, setPasswordChangeError] = useState("");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCourse, setEditCourse] = useState("");
  const [editPassword, setEditPassword] = useState("");

  const [studentSearch, setStudentSearch] = useState("");
  const [attendanceSearch, setAttendanceSearch] = useState("");

  const [cameraStarted, setCameraStarted] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState(null);
  const [recognitionLoading, setRecognitionLoading] = useState(false);

  const [showAddTeam, setShowAddTeam] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  const [teamName, setTeamName] = useState("");
  const [teamRole, setTeamRole] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [teamPhoto, setTeamPhoto] = useState("");

  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamRole, setEditTeamRole] = useState("");
  const [editTeamDescription, setEditTeamDescription] = useState("");
  const [editTeamPhoto, setEditTeamPhoto] = useState("");

  const [loadingTeam, setLoadingTeam] = useState(false);
  const [teamSaving, setTeamSaving] = useState(false);

  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const [showFaceRegistration, setShowFaceRegistration] = useState(false);
  const [registrationStudent, setRegistrationStudent] = useState(null);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [registrationCameraStarted, setRegistrationCameraStarted] =
    useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState("");
  const [registrationError, setRegistrationError] = useState("");
  const [registrationCompleted, setRegistrationCompleted] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const authRequestIdRef = useRef(0);
  const registrationVideoRef = useRef(null);
  const registrationStreamRef = useRef(null);

  const stopMainCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraStarted(false);
  };

  const stopRegistrationCamera = () => {
    if (registrationStreamRef.current) {
      registrationStreamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      registrationStreamRef.current = null;
    }

    if (registrationVideoRef.current) {
      registrationVideoRef.current.srcObject = null;
    }

    setRegistrationCameraStarted(false);
  };

  const clearAuthentication = () => {
    stopMainCamera();
    stopRegistrationCamera();

    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("userRole");

    setIsAuthenticated(false);
    setRole(null);
    setCurrentUser(null);
    setActivePage("dashboard");
    setRecognitionResult(null);
  };

  const checkCurrentUser = async () => {
  const requestId = ++authRequestIdRef.current;

  try {
    const response = await axios.get(
      `${API_URL}/current-user/`,
      {
        withCredentials: true,
      }
    );

    if (requestId !== authRequestIdRef.current) {
      return;
    }

    if (response.data.status !== "success") {
      clearAuthentication();
      return;
    }

    const authenticatedRole = response.data.role;
    const responseUser = response.data.user || {};

    if (authenticatedRole === "admin") {
      const adminUser = {
        role: "admin",
        username: responseUser.username || "",
        email: responseUser.email || "",
        is_staff: responseUser.is_staff === true,
      };

      if (!adminUser.is_staff) {
        clearAuthentication();
        return;
      }

      setIsAuthenticated(true);
      setRole("admin");
      setCurrentUser(adminUser);
      setActivePage("dashboard");

      localStorage.setItem("userRole", "admin");
      localStorage.setItem("adminLoggedIn", "true");
      localStorage.setItem(
        "adminUser",
        JSON.stringify(adminUser)
      );

      return;
    }

    if (authenticatedRole === "student") {
      const studentUser = {
        role: "student",
        student_id: responseUser.student_id || "",
        name: responseUser.name || "",
        email: responseUser.email || "",
        course: responseUser.course || "",
      };

      setIsAuthenticated(true);
      setRole("student");
      setCurrentUser(studentUser);
      setActivePage("dashboard");

      localStorage.setItem("userRole", "student");
      localStorage.removeItem("adminLoggedIn");
      localStorage.removeItem("adminUser");

      return;
    }

    clearAuthentication();
  } catch (error) {
    if (requestId !== authRequestIdRef.current) {
      return;
    }

    console.error(
      "Authentication check error:",
      error
    );

    clearAuthentication();
     } finally {
    if (requestId === authRequestIdRef.current) {
      setAuthChecked(true);
    }
  }
};
  useEffect(() => {
    checkCurrentUser();

    return () => {
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }

      if (registrationStreamRef.current) {
        registrationStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  const handleLogin = async (event) => {
  event.preventDefault();

  setLoginError("");

  if (!loginUsername.trim() || !loginPassword) {
    setLoginError(
      loginRole === "admin"
        ? "Username and password are required."
        : "Student ID and password are required."
    );
    return;
  }

 try {
  authRequestIdRef.current += 1;

  setLoginLoading(true);

    const endpoint =
      loginRole === "admin"
        ? `${API_URL}/admin/login/`
        : `${API_URL}/student/login/`;

    const payload =
      loginRole === "admin"
        ? {
            username: loginUsername.trim(),
            password: loginPassword,
          }
        : {
            student_id: loginUsername.trim(),
            password: loginPassword,
          };

    const response = await axios.post(
      endpoint,
      payload,
      {
        withCredentials: true,
      }
    );

    if (response.data.status !== "success") {
      setLoginError(
        response.data.message || "Login failed."
      );
      return;
    }

    const authenticatedRole =
      response.data.role || loginRole;

    let userData = null;

    if (authenticatedRole === "admin") {
      userData = {
        role: "admin",
        username:
          response.data.user?.username ||
          loginUsername.trim(),
        email:
          response.data.user?.email || "",
        is_staff:
          response.data.user?.is_staff ?? true,
      };

      localStorage.setItem(
        "adminLoggedIn",
        "true"
      );

      localStorage.setItem(
        "adminUser",
        JSON.stringify(userData)
      );
    }

    if (authenticatedRole === "student") {
      userData = {
        role: "student",
        student_id:
          response.data.student?.student_id ||
          loginUsername.trim(),
        name:
          response.data.student?.name || "",
        email:
          response.data.student?.email || "",
        course:
          response.data.student?.course || "",
      };

      localStorage.removeItem(
        "adminLoggedIn"
      );

      localStorage.removeItem(
        "adminUser"
      );
    }

    setIsAuthenticated(true);
    setRole(authenticatedRole);
    setCurrentUser(userData);

    localStorage.setItem(
      "userRole",
      authenticatedRole
    );

    setLoginUsername("");
    setLoginPassword("");
    setLoginError("");
    setActivePage("dashboard");

  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    if (error.response) {
      setLoginError(
        error.response.data?.message ||
          "Login failed."
      );
    } else {
      setLoginError(
        "Unable to connect to the server."
      );
    }

  } finally {
    setLoginLoading(false);
  }
};
 
const handleAdminPasswordChange = async (event) => {
  event.preventDefault();

  setPasswordChangeMessage("");
  setPasswordChangeError("");

  if (!newAdminPassword || !confirmAdminPassword) {
    setPasswordChangeError("Please enter both password fields.");
    return;
  }

  if (newAdminPassword.length < 8) {
    setPasswordChangeError(
      "Password must be at least 8 characters long."
    );
    return;
  }

  if (newAdminPassword !== confirmAdminPassword) {
    setPasswordChangeError("Passwords do not match.");
    return;
  }

  try {
    setPasswordChangeLoading(true);

    const response = await axios.post(
      `${API_URL}/admin/change-password/`,
      {
        new_password: newAdminPassword,
      }
    );

    setPasswordChangeMessage(
      response.data.message || "Password changed successfully."
    );

    setNewAdminPassword("");
    setConfirmAdminPassword("");
  } catch (error) {
    setPasswordChangeError(
      error.response?.data?.message ||
        "Unable to change password."
    );
  } finally {
    setPasswordChangeLoading(false);
  }
};

const handleLogout = async () => {
  authRequestIdRef.current += 1;

  try {
    await axios.post(`${API_URL}/logout/`);
  } catch (error) {
    console.error("Logout request error:", error);
  }

  clearAuthentication();
};

  const loadAdminDashboard = async () => {
    try {
      const [
        studentsResponse,
        attendanceResponse,
        statsResponse,
      ] = await Promise.all([
        axios.get(`${API_URL}/students/`),
        axios.get(`${API_URL}/attendance-list/`),
        axios.get(`${API_URL}/dashboard-stats/`),
      ]);

      setStudents(
        studentsResponse.data.students || []
      );

      setAttendance(
        attendanceResponse.data.attendance || []
      );

      setTotalStudents(
        statsResponse.data.total_students || 0
      );

      setPresentStudents(
        statsResponse.data.present_students || 0
      );

      setAbsentStudents(
        statsResponse.data.absent_students || 0
      );

      setAttendanceRate(
        statsResponse.data.attendance_rate || 0
      );
    } catch (error) {
      console.error(
        "Error loading admin dashboard:",
        error
      );

      if (error.response?.status === 401) {
        clearAuthentication();
      }
    }
  };

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);

      const response = await axios.get(
        `${API_URL}/students/`
      );

      setStudents(
        response.data.students || []
      );
    } catch (error) {
      console.error(
        "Error loading students:",
        error
      );
    } finally {
      setLoadingStudents(false);
    }
  };

  const downloadAttendanceCSV = () => {
    if (!attendance || attendance.length === 0) {
      alert("No attendance records available to download.");
      return;
    }

    const headers = [
      "Student ID",
      "Student Name",
      "Similarity",
      "Date",
      "Time",
      "Status",
    ];

    const escapeCSV = (value) => {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = attendance.map((record) => [
      record.student_id || "",
      record.student_name || "",
      record.similarity !== undefined
        ? Number(record.similarity).toFixed(4)
        : "",
      record.date || "",
      record.time || "",
      record.status || "PRESENT",
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `attendance_records_${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const loadAttendance = async () => {
    try {
      setLoadingAttendance(true);

      const response = await axios.get(
        `${API_URL}/attendance-list/`
      );

      setAttendance(
        response.data.attendance || []
      );
    } catch (error) {
      console.error(
        "Error loading attendance:",
        error
      );
    } finally {
      setLoadingAttendance(false);
    }
  };

  const loadTeam = async () => {
    try {
      setLoadingTeam(true);

      const response = await axios.get(
        `${API_URL}/team/`
      );

      setTeamMembers(
        response.data.team || []
      );
    } catch (error) {
      console.error(
        "Error loading team:",
        error
      );
    } finally {
      setLoadingTeam(false);
    }
  };

  const loadStudentData = async () => {
    try {
      const [
        dashboardResponse,
        profileResponse,
        attendanceResponse,
      ] = await Promise.all([
        axios.get(`${API_URL}/student/dashboard/`),
        axios.get(`${API_URL}/student/profile/`),
        axios.get(`${API_URL}/student/attendance/`),
      ]);

      setStudentDashboard(
        dashboardResponse.data
      );

      setStudentProfile(
        profileResponse.data.student ||
          dashboardResponse.data.student ||
          null
      );

      setStudentAttendance(
        attendanceResponse.data.attendance ||
          []
      );
    } catch (error) {
      console.error(
        "Error loading student data:",
        error
      );

      if (error.response?.status === 401) {
        clearAuthentication();
      }
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !authChecked) {
      return;
    }

    if (role === "admin") {
      loadAdminDashboard();
    }

    if (role === "student") {
      loadStudentData();
      loadTeam();
    }
  }, [isAuthenticated, role, authChecked]);

  useEffect(() => {
    if (
      cameraStarted &&
      videoRef.current &&
      streamRef.current
    ) {
      videoRef.current.srcObject =
        streamRef.current;

      videoRef.current
        .play()
        .catch((error) =>
          console.error(
            "Video playback error:",
            error
          )
        );
    }
  }, [cameraStarted]);

  useEffect(() => {
    if (
      registrationCameraStarted &&
      registrationVideoRef.current &&
      registrationStreamRef.current
    ) {
      registrationVideoRef.current.srcObject =
        registrationStreamRef.current;

      registrationVideoRef.current
        .play()
        .catch((error) =>
          console.error(
            "Registration video playback error:",
            error
          )
        );
    }
  }, [registrationCameraStarted]);

  const handleNavigation = async (page) => {
    stopMainCamera();
    setRecognitionResult(null);

    setActivePage(page);

    if (role === "admin") {
      if (page === "students") {
        await loadStudents();
      }

      if (page === "attendance") {
        await loadAttendance();
      }

      if (page === "team") {
        await loadTeam();
      }

      if (page === "dashboard") {
        await loadAdminDashboard();
      }
    }

    if (role === "student") {
      if (
        page === "dashboard" ||
        page === "profile" ||
        page === "attendance"
      ) {
        await loadStudentData();
      }

      if (page === "team") {
        await loadTeam();
      }
    }
  };

  const resetStudentForm = () => {
    setStudentId("");
    setStudentName("");
    setStudentEmail("");
    setStudentCourse("");
    setStudentPassword("");
    setStudentConfirmPassword("");
  };

  const handleAddStudent = async () => {
    if (
      !studentId.trim() ||
      !studentName.trim() ||
      !studentPassword
    ) {
      alert(
        "Student ID, name and password are required."
      );
      return;
    }

    if (studentPassword.length < 8) {
  alert(
    "Student password must contain at least 8 characters."
  );
  return;
}

if (!studentConfirmPassword) {
  alert("Please confirm the student password.");
  return;
}

if (studentPassword !== studentConfirmPassword) {
  alert("Passwords do not match.");
  return;
}

    try {
      const response = await axios.post(
        `${API_URL}/students/`,
        {
          student_id: studentId.trim(),
          name: studentName.trim(),
          email: studentEmail.trim(),
          course: studentCourse.trim(),
          password: studentPassword,
        }
      );

      const createdStudent =
        response.data.student;

      setStudents((prev) => [
        ...prev,
        createdStudent,
      ]);

      resetStudentForm();
      setShowAddStudent(false);

      await loadAdminDashboard();

      setRegistrationStudent(
        createdStudent
      );

      setRegistrationCount(0);
      setRegistrationMessage(
        "Capture 20 clear face images to complete registration."
      );
      setRegistrationError("");
      setRegistrationCompleted(false);
      setShowFaceRegistration(true);
    } catch (error) {
      console.error(
        "Error adding student:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to add student."
      );
    }
  };

  const handleDeleteStudent = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this student?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/students/${id}/delete/`
      );

      setStudents((prev) =>
        prev.filter(
          (student) =>
            student.student_id !== id
        )
      );

      await loadAdminDashboard();

      alert(
        "Student deleted successfully."
      );
    } catch (error) {
      console.error(
        "Error deleting student:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to delete student."
      );
    }
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setEditName(student.name || "");
    setEditEmail(student.email || "");
    setEditCourse(student.course || "");
    setEditPassword("");
  };

  const closeEditModal = () => {
    setEditingStudent(null);
    setEditName("");
    setEditEmail("");
    setEditCourse("");
    setEditPassword("");
  };

  const handleUpdateStudent = async () => {
    if (!editName.trim()) {
      alert("Student name is required.");
      return;
    }

    if (
      editPassword &&
      editPassword.length < 6
    ) {
      alert(
        "Password must contain at least 6 characters."
      );
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL}/students/${editingStudent.student_id}/`,
        {
          name: editName.trim(),
          email: editEmail.trim(),
          course: editCourse.trim(),
          ...(editPassword
            ? { password: editPassword }
            : {}),
        }
      );

      setStudents((prev) =>
        prev.map((student) =>
          student.student_id ===
          editingStudent.student_id
            ? response.data.student
            : student
        )
      );

      closeEditModal();
      await loadAdminDashboard();

      alert(
        "Student updated successfully."
      );
    } catch (error) {
      console.error(
        "Error updating student:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to update student."
      );
    }
  };

  const startMainCamera = async () => {
    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        alert(
          "Camera access is not supported by this browser."
        );
        return;
      }

      stopMainCamera();

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: false,
        });

      streamRef.current = stream;
      setCameraStarted(true);
      setRecognitionResult(null);
    } catch (error) {
      console.error(
        "Camera error:",
        error
      );

      if (
        error.name ===
        "NotAllowedError"
      ) {
        alert(
          "Camera permission was denied. Please allow camera access."
        );
      } else if (
        error.name ===
        "NotFoundError"
      ) {
        alert(
          "No camera was found on this device."
        );
      } else {
        alert(
          "Camera access is not available. Please check your camera."
        );
      }
    }
  };

  const handleFaceRecognition = async () => {
    setActivePage("face");
    setRecognitionResult(null);
    await startMainCamera();
  };

  const handleCaptureFace = () => {
    const video = videoRef.current;

    if (!video || !video.srcObject) {
      alert(
        "Please start the camera first."
      );
      return;
    }

    if (
      !video.videoWidth ||
      !video.videoHeight
    ) {
      alert(
        "Camera is not ready yet."
      );
      return;
    }

    const canvas =
      document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context =
      canvas.getContext("2d");

    if (!context) {
      alert(
        "Failed to prepare image capture."
      );
      return;
    }

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          alert(
            "Failed to capture image."
          );
          return;
        }

        try {
          setRecognitionLoading(true);
          setRecognitionResult(null);

          const formData =
            new FormData();

          formData.append(
            "image",
            blob,
            "face_capture.jpg"
          );

          const response =
            await axios.post(
              `${API_URL}/face-recognition/`,
              formData
            );

          setRecognitionResult(
            response.data
          );

          if (role === "admin") {
            await loadAdminDashboard();
          }

          if (role === "student") {
            await loadStudentData();
          }
        } catch (error) {
          console.error(
            "Recognition error:",
            error
          );

          setRecognitionResult(
            error.response?.data || {
              status: "error",
              message:
                "Server connection failed.",
            }
          );
        } finally {
          setRecognitionLoading(false);
        }
      },
      "image/jpeg",
      0.92
    );
  };

  const startFaceRegistrationCamera =
    async () => {
      try {
        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices.getUserMedia
        ) {
          setRegistrationError(
            "Camera access is not supported by this browser."
          );
          return;
        }

        stopRegistrationCamera();

        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            },
            audio: false,
          });

        registrationStreamRef.current =
          stream;

        setRegistrationCameraStarted(
          true
        );
        setRegistrationError("");
      } catch (error) {
        console.error(
          "Registration camera error:",
          error
        );

        if (
          error.name ===
          "NotAllowedError"
        ) {
          setRegistrationError(
            "Camera permission was denied. Please allow camera access."
          );
        } else if (
          error.name ===
          "NotFoundError"
        ) {
          setRegistrationError(
            "No camera was found on this device."
          );
        } else {
          setRegistrationError(
            "Camera access is not available. Please check your camera."
          );
        }
      }
    };

  const closeFaceRegistration =
    () => {
      if (registrationLoading) {
        return;
      }

      stopRegistrationCamera();

      setShowFaceRegistration(false);
      setRegistrationStudent(null);
      setRegistrationCount(0);
      setRegistrationMessage("");
      setRegistrationError("");
      setRegistrationCompleted(false);
    };

  const handleCaptureRegistrationImage =
    async () => {
      const video =
        registrationVideoRef.current;

      if (!registrationStudent?.student_id) {
        setRegistrationError(
          "Student information is missing."
        );
        return;
      }

      if (!video || !video.srcObject) {
        setRegistrationError(
          "Please start the camera first."
        );
        return;
      }

      if (
        !video.videoWidth ||
        !video.videoHeight
      ) {
        setRegistrationError(
          "Camera is not ready yet."
        );
        return;
      }

      if (
        registrationCount >=
        TOTAL_FACE_IMAGES
      ) {
        return;
      }

      const canvas =
        document.createElement("canvas");

      const maxWidth = 800;

      const scale = Math.min(
        1,
        maxWidth / video.videoWidth
      );

      canvas.width =
        Math.round(
          video.videoWidth * scale
        );

      canvas.height =
        Math.round(
          video.videoHeight * scale
        );

      const context =
        canvas.getContext("2d");

      if (!context) {
        setRegistrationError(
          "Failed to prepare image capture."
        );
        return;
      }

      context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      );

      setRegistrationLoading(true);
      setRegistrationError("");

      const imageNumber =
        registrationCount + 1;

      setRegistrationMessage(
        `Processing image ${imageNumber} of ${TOTAL_FACE_IMAGES}...`
      );

      try {
        const blob =
          await new Promise(
            (resolve) => {
              canvas.toBlob(
                resolve,
                "image/jpeg",
                0.88
              );
            }
          );

        if (!blob) {
          throw new Error(
            "Image capture failed."
          );
        }

        const formData =
          new FormData();

        formData.append(
          "student_id",
          registrationStudent.student_id
        );

        formData.append(
          "image_index",
          String(imageNumber)
        );

        formData.append(
          "image",
          blob,
          `face_${String(
            imageNumber
          ).padStart(2, "0")}.jpg`
        );

        const response =
          await axios.post(
            `${API_URL}/face-register/`,
            formData
          );

        if (
          response.data.status !==
          "success"
        ) {
          throw new Error(
            response.data.message ||
              "Face registration failed."
          );
        }

        setRegistrationCount(
          imageNumber
        );

        if (
          imageNumber ===
          TOTAL_FACE_IMAGES
        ) {
          setRegistrationCompleted(
            true
          );

          setRegistrationMessage(
            "All 20 face images have been registered successfully."
          );

          stopRegistrationCamera();
        } else {
          setRegistrationMessage(
            `Image ${imageNumber} of ${TOTAL_FACE_IMAGES} registered successfully.`
          );
        }
      } catch (error) {
        console.error(
          "Face registration error:",
          error
        );

        setRegistrationError(
          error.response?.data?.message ||
            error.message ||
            "Face registration failed. Please try again."
        );

        setRegistrationMessage(
          `Image ${imageNumber} was not registered.`
        );
      } finally {
        setRegistrationLoading(false);
      }
    };

  const openFaceRegistration = (
    student
  ) => {
    setRegistrationStudent(student);
    setRegistrationCount(0);
    setRegistrationMessage(
      "Capture 20 clear face images to complete registration."
    );
    setRegistrationError("");
    setRegistrationCompleted(false);
    setShowFaceRegistration(true);
  };

  const readImageAsBase64 = (
    file,
    callback
  ) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert(
        "Please select a valid image file."
      );
      return;
    }

    if (
      file.size >
      2 * 1024 * 1024
    ) {
      alert(
        "Please select an image smaller than 2 MB."
      );
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      callback(reader.result);
    };

    reader.onerror = () => {
      alert(
        "Failed to read the selected image."
      );
    };

    reader.readAsDataURL(file);
  };

  const resetTeamForm = () => {
    setTeamName("");
    setTeamRole("");
    setTeamDescription("");
    setTeamPhoto("");
  };

  const closeAddTeamModal = () => {
    resetTeamForm();
    setShowAddTeam(false);
  };

  const handleAddTeamMember =
    async () => {
      if (
        !teamName.trim() ||
        !teamRole.trim()
      ) {
        alert(
          "Name and role are required."
        );
        return;
      }

      try {
        setTeamSaving(true);

        const response =
          await axios.post(
            `${API_URL}/team/`,
            {
              name: teamName.trim(),
              role: teamRole.trim(),
              description:
                teamDescription.trim(),
              photo: teamPhoto,
            }
          );

        await loadTeam();

        resetTeamForm();
        setShowAddTeam(false);

        alert(
          response.data.message ||
            "Team member added successfully."
        );
      } catch (error) {
        console.error(
          "Error adding team member:",
          error
        );

        alert(
          error.response?.data?.message ||
            "Failed to add team member."
        );
      } finally {
        setTeamSaving(false);
      }
    };

  const openEditTeamModal =
    (member) => {
      setEditingTeam(member);

      setEditTeamName(
        member.name || ""
      );

      setEditTeamRole(
        member.role || ""
      );

      setEditTeamDescription(
        member.description || ""
      );

      setEditTeamPhoto(
        member.photo || ""
      );
    };

  const closeEditTeamModal = () => {
    setEditingTeam(null);
    setEditTeamName("");
    setEditTeamRole("");
    setEditTeamDescription("");
    setEditTeamPhoto("");
  };

  const handleUpdateTeamMember =
    async () => {
      if (
        !editTeamName.trim() ||
        !editTeamRole.trim()
      ) {
        alert(
          "Name and role are required."
        );
        return;
      }

      if (!editingTeam?.team_id) {
        alert(
          "Team member ID is missing."
        );
        return;
      }

      try {
        setTeamSaving(true);

        const response =
          await axios.put(
            `${API_URL}/team/${editingTeam.team_id}/`,
            {
              name: editTeamName.trim(),
              role: editTeamRole.trim(),
              description:
                editTeamDescription.trim(),
              photo: editTeamPhoto,
            }
          );

        await loadTeam();

        closeEditTeamModal();

        alert(
          response.data.message ||
            "Team member updated successfully."
        );
      } catch (error) {
        console.error(
          "Error updating team member:",
          error
        );

        alert(
          error.response?.data?.message ||
            "Failed to update team member."
        );
      } finally {
        setTeamSaving(false);
      }
    };

  const handleDeleteTeamMember =
    async (member) => {
      if (!member?.team_id) {
        alert(
          "Team member ID is missing."
        );
        return;
      }

      const confirmed =
        window.confirm(
          `Are you sure you want to delete ${member.name}?`
        );

      if (!confirmed) {
        return;
      }

      try {
        await axios.delete(
          `${API_URL}/team/${member.team_id}/delete/`
        );

        setTeamMembers((prev) =>
          prev.filter(
            (item) =>
              item.team_id !==
              member.team_id
          )
        );

        alert(
          "Team member deleted successfully."
        );
      } catch (error) {
        console.error(
          "Error deleting team member:",
          error
        );

        alert(
          error.response?.data?.message ||
            "Failed to delete team member."
        );
      }
    };

  const filteredStudents =
    students.filter((student) => {
      const search =
        studentSearch.toLowerCase();

      return (
        String(
          student.student_id || ""
        )
          .toLowerCase()
          .includes(search) ||
        String(
          student.name || ""
        )
          .toLowerCase()
          .includes(search) ||
        String(
          student.email || ""
        )
          .toLowerCase()
          .includes(search) ||
        String(
          student.course || ""
        )
          .toLowerCase()
          .includes(search)
      );
    });

  const filteredAttendance =
    attendance.filter((record) => {
      const search =
        attendanceSearch.toLowerCase();

      return (
        String(
          record.student_id || ""
        )
          .toLowerCase()
          .includes(search) ||
        String(
          record.student_name || ""
        )
          .toLowerCase()
          .includes(search) ||
        String(
          record.date || ""
        )
          .toLowerCase()
          .includes(search) ||
        String(
          record.status || ""
        )
          .toLowerCase()
          .includes(search)
      );
    });

  const recognitionDate =
    recognitionResult?.date ||
    recognitionResult?.attendance?.date ||
    "-";

  const recognitionTime =
    recognitionResult?.time ||
    recognitionResult?.attendance?.time ||
    "-";

  const renderAdminDashboard = () => {
    const recentAttendance =
      attendance.slice(0, 5);

    return (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">
              OVERVIEW
            </span>
            <h2>Dashboard</h2>
            <p>
              Monitor students and attendance
              from one place.
            </p>
          </div>

          <button
            className="primary-btn"
            onClick={
              handleFaceRecognition
            }
          >
            Start Recognition
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              S
            </div>

            <div>
              <span>Total Students</span>
              <strong>
                {totalStudents}
              </strong>
              <small>
                Registered students
              </small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              P
            </div>

            <div>
              <span>Present Today</span>
              <strong>
                {presentStudents}
              </strong>
              <small>
                Attendance marked
              </small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">
              A
            </div>

            <div>
              <span>Absent Today</span>
              <strong>
                {absentStudents}
              </strong>
              <small>
                Not marked today
              </small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              %
            </div>

            <div>
              <span>Attendance Rate</span>
              <strong>
                {attendanceRate}%
              </strong>
              <small>
                Today's attendance
              </small>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>
                  Attendance Overview
                </h3>
                <p>
                  Today's attendance summary
                </p>
              </div>
            </div>

            <div className="progress-area">
              <div className="progress-circle">
                <span>
                  {attendanceRate}%
                </span>
              </div>

              <div className="progress-details">
                <div>
                  <span className="legend-dot present-dot"></span>
                  <div>
                    <strong>
                      {presentStudents}
                    </strong>
                    <small>
                      Present
                    </small>
                  </div>
                </div>

                <div>
                  <span className="legend-dot absent-dot"></span>
                  <div>
                    <strong>
                      {absentStudents}
                    </strong>
                    <small>
                      Absent
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="panel quick-actions">
            <div className="panel-header">
              <div>
                <h3>
                  Quick Actions
                </h3>
                <p>
                  Common administration tasks
                </p>
              </div>
            </div>

            <div className="quick-action-grid">
              <button
                onClick={() => {
                  handleNavigation(
                    "students"
                  );
                  setShowAddStudent(true);
                }}
              >
                <span>+</span>
                <div>
                  <strong>
                    Add Student
                  </strong>
                  <small>
                    Register a new student
                  </small>
                </div>
              </button>

              <button
                onClick={() =>
                  handleNavigation(
                    "attendance"
                  )
                }
              >
                <span>R</span>
                <div>
                  <strong>
                    View Attendance
                  </strong>
                  <small>
                    Check attendance records
                  </small>
                </div>
              </button>

              <button
                onClick={
                  handleFaceRecognition
                }
              >
                <span>F</span>
                <div>
                  <strong>
                    Face Recognition
                  </strong>
                  <small>
                    Mark attendance
                  </small>
                </div>
              </button>

              <button
                onClick={() =>
                  handleNavigation(
                    "students"
                  )
                }
              >
                <span>S</span>
                <div>
                  <strong>
                    Manage Students
                  </strong>
                  <small>
                    View student records
                  </small>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>
                Recent Attendance
              </h3>
              <p>
                Latest attendance records
              </p>
            </div>

            <button
              className="text-btn"
              onClick={() =>
                handleNavigation(
                  "attendance"
                )
              }
            >
              View All
            </button>
          </div>

          {recentAttendance.length ===
          0 ? (
            <div className="empty-state">
              <div>R</div>
              <h4>
                No attendance records
              </h4>
              <p>
                Attendance records will
                appear here after
                recognition.
              </p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>
                      Student ID
                    </th>
                    <th>Student</th>
                    <th>
                      Similarity
                    </th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {recentAttendance.map(
                    (
                      record,
                      index
                    ) => (
                      <tr
                        key={index}
                      >
                        <td>
                          <span className="id-badge">
                            {
                              record.student_id
                            }
                          </span>
                        </td>

                        <td>
                          <strong>
                            {
                              record.student_name
                            }
                          </strong>
                        </td>

                        <td>
                          {record.similarity !==
                          undefined
                            ? Number(
                                record.similarity
                              ).toFixed(
                                4
                              )
                            : "-"}
                        </td>

                        <td>
                          {record.date ||
                            "-"}
                        </td>

                        <td>
                          {record.time ||
                            "-"}
                        </td>

                        <td>
                          <span className="status-badge present">
                            {record.status ||
                              "PRESENT"}
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  };

  const renderStudents = () => (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            MANAGEMENT
          </span>
          <h2>Students</h2>
          <p>
            Add, update, search and manage
            student records.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={() =>
            setShowAddStudent(true)
          }
        >
          Add Student
        </button>
      </div>

      <div className="panel">
        <div className="toolbar">
          <div className="search-box">
            <span>Search</span>
            <input
              type="text"
              placeholder="Search by ID, name, email or course..."
              value={studentSearch}
              onChange={(e) =>
                setStudentSearch(
                  e.target.value
                )
              }
            />
          </div>

          <div className="record-count">
            {filteredStudents.length}{" "}
            Students
          </div>
        </div>

        {loadingStudents ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>
              Loading students...
            </p>
          </div>
        ) : filteredStudents.length ===
          0 ? (
          <div className="empty-state">
            <div>S</div>
            <h4>
              No students found
            </h4>
            <p>
              Add a student to start
              managing records.
            </p>

            <button
              className="primary-btn"
              onClick={() =>
                setShowAddStudent(true)
              }
            >
              Add Student
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>
                    Student ID
                  </th>
                  <th>
                    Student Name
                  </th>
                  <th>Email</th>
                  <th>Course</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map(
                  (student) => (
                    <tr
                      key={
                        student.student_id
                      }
                    >
                      <td>
                        <span className="id-badge">
                          {
                            student.student_id
                          }
                        </span>
                      </td>

                      <td>
                        <div className="student-name-cell">
                          <div className="avatar">
                            {student.name
                              ?.charAt(
                                0
                              )
                              .toUpperCase()}
                          </div>

                          <strong>
                            {
                              student.name
                            }
                          </strong>
                        </div>
                      </td>

                      <td>
                        {student.email ||
                          "-"}
                      </td>

                      <td>
                        <span className="course-badge">
                          {student.course ||
                            "-"}
                        </span>
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            className="icon-btn edit"
                            title="Edit Student"
                            onClick={() =>
                              openEditModal(
                                student
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="icon-btn"
                            title="Register Face"
                            onClick={() =>
                              openFaceRegistration(
                                student
                              )
                            }
                          >
                            Face
                          </button>

                          <button
                            className="icon-btn delete"
                            title="Delete Student"
                            onClick={() =>
                              handleDeleteStudent(
                                student.student_id
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );

  const renderAttendance = () => (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            RECORDS
          </span>
          <h2>Attendance</h2>
          <p>
            Review face recognition
            attendance records.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            className="secondary-btn"
            onClick={downloadAttendanceCSV}
            disabled={attendance.length === 0}
            title="Download attendance records as CSV"
          >
            Download CSV
          </button>

          <button
            className="secondary-btn"
            onClick={loadAttendance}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="toolbar">
          <div className="search-box">
            <span>Search</span>
            <input
              type="text"
              placeholder="Search attendance records..."
              value={attendanceSearch}
              onChange={(e) =>
                setAttendanceSearch(
                  e.target.value
                )
              }
            />
          </div>

          <div className="record-count">
            {filteredAttendance.length}{" "}
            Records
          </div>
        </div>

        {loadingAttendance ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>
              Loading attendance...
            </p>
          </div>
        ) : filteredAttendance.length ===
          0 ? (
          <div className="empty-state">
            <div>R</div>
            <h4>
              No attendance records
            </h4>
            <p>
              Attendance records will
              appear after recognition.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>
                    Student ID
                  </th>
                  <th>
                    Student Name
                  </th>
                  <th>
                    Similarity
                  </th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredAttendance.map(
                  (
                    record,
                    index
                  ) => (
                    <tr
                      key={index}
                    >
                      <td>
                        <span className="id-badge">
                          {
                            record.student_id
                          }
                        </span>
                      </td>

                      <td>
                        <strong>
                          {
                            record.student_name
                          }
                        </strong>
                      </td>

                      <td>
                        {record.similarity !==
                        undefined
                          ? Number(
                              record.similarity
                            ).toFixed(
                              4
                            )
                          : "-"}
                      </td>

                      <td>
                        {record.date ||
                          "-"}
                      </td>

                      <td>
                        {record.time ||
                          "-"}
                      </td>

                      <td>
                        <span className="status-badge present">
                          {record.status ||
                            "PRESENT"}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );

  const renderFaceRecognition = () => {
    const isSuccess =
  recognitionResult?.status ===
  "SUCCESS";

    const isAlreadyMarked =
      recognitionResult?.status ===
      "ALREADY_MARKED";

    const isNotRecognized =
      recognitionResult?.status ===
      "NOT_RECOGNIZED";

    return (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">
              AI ATTENDANCE
            </span>

            <h2>
              Face Recognition
            </h2>

            <p>
              Recognize a registered
              student using the live
              camera.
            </p>
          </div>

          <div className="ai-status">
            <span></span>
            AI Recognition Ready
          </div>
        </div>

        <div className="recognition-layout">
          <div className="panel camera-panel">
            <div className="panel-header">
              <div>
                <h3>
                  Live Camera
                </h3>
                <p>
                  Keep your face clearly
                  visible inside the camera
                  frame.
                </p>
              </div>

              <span
                className={
                  cameraStarted
                    ? "camera-status active"
                    : "camera-status"
                }
              >
                <span></span>

                {cameraStarted
                  ? "Camera Active"
                  : "Camera Off"}
              </span>
            </div>

            <div className="camera-container">
              {cameraStarted ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="camera-video"
                />
              ) : (
                <div className="camera-placeholder">
                  <div className="camera-placeholder-icon">
                    Camera
                  </div>

                  <h3>
                    Camera is ready
                  </h3>

                  <p>
                    Start the camera to
                    begin recognition.
                  </p>
                </div>
              )}

              {cameraStarted && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    zIndex: 10,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      width: "210px",
                      height: "280px",
                      transform:
                        "translate(-50%, -50%)",
                      border:
                        "3px solid #ffffff",
                      borderRadius: "50%",
                      boxShadow:
                        "0 0 0 9999px rgba(0,0,0,0.20)",
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      bottom: "18px",
                      transform:
                        "translateX(-50%)",
                      width: "100%",
                      textAlign: "center",
                      color: "#ffffff",
                      fontSize: "14px",
                      fontWeight: "600",
                      textShadow:
                        "0 1px 4px rgba(0,0,0,0.8)",
                    }}
                  >
                    Position your face inside the frame
                  </div>
                </div>
              )}
            </div>

            <div className="camera-actions">
              {!cameraStarted ? (
                <button
                  className="primary-btn large"
                  onClick={
                    startMainCamera
                  }
                >
                  Start Camera
                </button>
              ) : (
                <>
                  <button
                    className="primary-btn large"
                    onClick={
                      handleCaptureFace
                    }
                    disabled={
                      recognitionLoading
                    }
                  >
                    {recognitionLoading
                      ? "Processing..."
                      : "Capture & Recognize"}
                  </button>

                  <button
                    className="secondary-btn large"
                    onClick={
                      stopMainCamera
                    }
                    disabled={
                      recognitionLoading
                    }
                  >
                    Stop Camera
                  </button>
                </>
              )}
            </div>

            <div className="recognition-tips">
              <h4>
                Recognition Tips
              </h4>

              <div className="tip-list">
                <span>✓</span>
                <p>
                  Use good lighting.
                </p>

                <span>✓</span>
                <p>
                  Keep your face centered.
                </p>

                <span>✓</span>
                <p>
                  Look directly at the camera.
                </p>

                <span>✓</span>
                <p>
                  Maintain a suitable distance.
                </p>
              </div>
            </div>
          </div>

          <div className="panel result-panel">
            <div className="panel-header">
              <div>
                <h3>
                  Recognition Result
                </h3>

                <p>
                  Latest recognition
                  information
                </p>
              </div>
            </div>

            {!recognitionResult &&
              !recognitionLoading && (
                <div className="result-empty">
                  <div>AI</div>

                  <h4>
                    Waiting for recognition
                  </h4>

                  <p>
                    Start the camera and
                    capture your face to
                    see the result.
                  </p>
                </div>
              )}

            {recognitionLoading && (
              <div className="result-empty">
                <div className="large-spinner"></div>

                <h4>
                  Processing Face
                </h4>

                <p>
                  Comparing the captured
                  face with registered
                  embeddings.
                </p>
              </div>
            )}

            {recognitionResult &&
              !recognitionLoading && (
                <div
                  className={`recognition-result ${
                    isSuccess
                      ? "result-success"
                      : isAlreadyMarked
                      ? "result-warning"
                      : isNotRecognized
                      ? "result-danger"
                      : "result-error"
                  }`}
                >
                  {isSuccess ||
                  isAlreadyMarked ? (
                    <>
                      <div className="result-icon">
                        {isSuccess
                          ? "✓"
                          : "!"}
                      </div>

                      <div className="result-status-title">
                        {isSuccess
                          ? "Face Recognized"
                          : "Attendance Already Marked"}
                      </div>

                      <div className="result-details">
                        <div>
                          <span>
                            Student ID
                          </span>

                          <strong>
                            {
                              recognitionResult.student_id
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            Student Name
                          </span>

                          <strong>
                            {
                              recognitionResult.student_name
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            Similarity
                          </span>

                          <strong>
                            {recognitionResult.similarity !==
                            undefined
                              ? Number(
                                  recognitionResult.similarity
                                ).toFixed(
                                  4
                                )
                              : "-"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Attendance
                          </span>

                          <strong>
                            {
                              recognitionResult.message
                            }
                          </strong>
                        </div>

                        <div>
                          <span>Date</span>
                          <strong>
                            {
                              recognitionDate
                            }
                          </strong>
                        </div>

                        <div>
                          <span>Time</span>
                          <strong>
                            {
                              recognitionTime
                            }
                          </strong>
                        </div>
                      </div>
                    </>
                  ) : isNotRecognized ? (
                    <>
                      <div className="result-icon">
                        X
                      </div>

                      <div className="result-status-title">
                        Face Not Recognized
                      </div>

                      <p className="result-message">
                        The captured face did not
                        match a registered
                        student.
                      </p>

                      <div className="single-result-value">
                        <span>
                          Similarity
                        </span>

                        <strong>
                          {recognitionResult.similarity !==
                          undefined
                            ? Number(
                                recognitionResult.similarity
                              ).toFixed(
                                4
                              )
                            : "-"}
                        </strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="result-icon">
                        !
                      </div>

                      <div className="result-status-title">
                        Recognition Error
                      </div>

                      <p className="result-message">
                        {
                          recognitionResult.message
                        }
                      </p>
                    </>
                  )}
                </div>
              )}
          </div>
        </div>
      </>
    );
  };

  const renderAdminTeam = () => (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            PROJECT TEAM
          </span>

          <h2>Our Team</h2>

          <p>
            Manage the members of your
            project team.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={() =>
            setShowAddTeam(true)
          }
        >
          Add Team Member
        </button>
      </div>

      {loadingTeam ? (
        <div className="panel">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>
              Loading team members...
            </p>
          </div>
        </div>
      ) : teamMembers.length === 0 ? (
        <div className="panel">
          <div className="empty-state">
            <div>T</div>

            <h4>
              No team members found
            </h4>

            <p>
              Add team members to display
              your project team.
            </p>

            <button
              className="primary-btn"
              onClick={() =>
                setShowAddTeam(true)
              }
            >
              Add Team Member
            </button>
          </div>
        </div>
      ) : (
        <div className="team-grid">
          {teamMembers.map(
            (member) => (
              <div
                className="team-card"
                key={
                  member.team_id
                }
              >
                <div className="team-avatar">
                  {member.photo ? (
                    <img
                      src={
                        member.photo
                      }
                      alt={
                        member.name
                      }
                    />
                  ) : (
                    member.name
                      ?.charAt(
                        0
                      )
                      .toUpperCase() ||
                    "T"
                  )}
                </div>

                <h3>
                  {member.name}
                </h3>

                <span className="team-role">
                  {member.role}
                </span>

                <p>
                  {member.description ||
                    "Project team member"}
                </p>

                <div className="team-card-actions">
                  <button
                    className="icon-btn edit"
                    onClick={() =>
                      openEditTeamModal(
                        member
                      )
                    }
                  >
                    Edit
                  </button>

                  <button
                    className="icon-btn delete"
                    onClick={() =>
                      handleDeleteTeamMember(
                        member
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </>
  );

  const renderStudentDashboard = () => {
    const data =
      studentDashboard || {};

    const student =
      data.student ||
      studentProfile ||
      currentUser?.student ||
      {};

    const present =
      data.present_today ??
      data.present ??
      0;

    const total =
      data.total_days ??
      data.total_attendance ??
      studentAttendance.length;

    const rate =
      data.attendance_rate ??
      data.rate ??
      0;

    return (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">
              STUDENT PORTAL
            </span>

            <h2>
              Welcome,{" "}
              {student.name ||
                currentUser?.name ||
                "Student"}
            </h2>

            <p>
              View your attendance and
              profile information.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
  <div className="ai-status">
    <span></span>
    Student Account
  </div>

  <button
    className="primary-btn"
    onClick={handleFaceRecognition}
  >
    Mark Attendance
  </button>
</div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              P
            </div>

            <div>
              <span>
                Present Today
              </span>

              <strong>
                {present}
              </strong>

              <small>
                Today's attendance
              </small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              T
            </div>

            <div>
              <span>
                Attendance Records
              </span>

              <strong>
                {total}
              </strong>

              <small>
                Total records
              </small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              %
            </div>

            <div>
              <span>
                Attendance Rate
              </span>

              <strong>
                {rate}%
              </strong>

              <small>
                Overall attendance
              </small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">
              ID
            </div>

            <div>
              <span>
                Student ID
              </span>

              <strong>
                {student.student_id ||
                  currentUser?.student_id ||
                  "-"}
              </strong>

              <small>
                Registered account
              </small>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>
                  Student Profile
                </h3>

                <p>
                  Your registered information
                </p>
              </div>
            </div>

            <div className="result-details">
              <div>
                <span>
                  Student ID
                </span>

                <strong>
                  {student.student_id ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>
                  Name
                </span>

                <strong>
                  {student.name ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>
                  Email
                </span>

                <strong>
                  {student.email ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>
                  Course
                </span>

                <strong>
                  {student.course ||
                    "-"}
                </strong>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>
                  Attendance Status
                </h3>

                <p>
                  Current attendance overview
                </p>
              </div>
            </div>

            <div className="progress-area">
              <div className="progress-circle">
                <span>
                  {rate}%
                </span>
              </div>

              <div className="progress-details">
                <div>
                  <span className="legend-dot present-dot"></span>

                  <div>
                    <strong>
                      {present}
                    </strong>

                    <small>
                      Present today
                    </small>
                  </div>
                </div>

                <div>
                  <span className="legend-dot absent-dot"></span>

                  <div>
                    <strong>
                      {total}
                    </strong>

                    <small>
                      Total records
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>
                Recent Attendance
              </h3>

              <p>
                Your latest attendance records
              </p>
            </div>

            <button
              className="text-btn"
              onClick={() =>
                handleNavigation(
                  "attendance"
                )
              }
            >
              View All
            </button>
          </div>

          {studentAttendance.length ===
          0 ? (
            <div className="empty-state">
              <div>R</div>

              <h4>
                No attendance records
              </h4>

              <p>
                Your attendance records
                will appear here.
              </p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Similarity</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {studentAttendance
                    .slice(0, 5)
                    .map(
                      (
                        record,
                        index
                      ) => (
                        <tr
                          key={
                            index
                          }
                        >
                          <td>
                            {
                              record.date
                            }
                          </td>

                          <td>
                            {
                              record.time
                            }
                          </td>

                          <td>
                            {record.similarity !==
                            undefined
                              ? Number(
                                  record.similarity
                                ).toFixed(
                                  4
                                )
                              : "-"}
                          </td>

                          <td>
                            <span className="status-badge present">
                              {record.status ||
                                "PRESENT"}
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  };

  const renderStudentProfile = () => {
    const student =
      studentProfile ||
      studentDashboard?.student ||
      currentUser?.student ||
      {};

    return (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">
              ACCOUNT
            </span>

            <h2>
              My Profile
            </h2>

            <p>
              View your registered student
              information.
            </p>
          </div>
        </div>

        <div className="panel">
          <div className="result-details">
            <div>
              <span>
                Student ID
              </span>

              <strong>
                {student.student_id ||
                  "-"}
              </strong>
            </div>

            <div>
              <span>
                Student Name
              </span>

              <strong>
                {student.name ||
                  "-"}
              </strong>
            </div>

            <div>
              <span>
                Email
              </span>

              <strong>
                {student.email ||
                  "-"}
              </strong>
            </div>

            <div>
              <span>
                Course
              </span>

              <strong>
                {student.course ||
                  "-"}
              </strong>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderStudentAttendance = () => (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            MY RECORDS
          </span>

          <h2>
            My Attendance
          </h2>

          <p>
            View your personal attendance
            records.
          </p>
        </div>

        <button
          className="secondary-btn"
          onClick={loadStudentData}
        >
          Refresh
        </button>
      </div>

      <div className="panel">
        {studentAttendance.length ===
        0 ? (
          <div className="empty-state">
            <div>R</div>

            <h4>
              No attendance records
            </h4>

            <p>
              No attendance records are
              available for your account.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>
                    Student ID
                  </th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>
                    Similarity
                  </th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {studentAttendance.map(
                  (
                    record,
                    index
                  ) => (
                    <tr
                      key={index}
                    >
                      <td>
                        <span className="id-badge">
                          {
                            record.student_id
                          }
                        </span>
                      </td>

                      <td>
                        {
                          record.date
                        }
                      </td>

                      <td>
                        {
                          record.time
                        }
                      </td>

                      <td>
                        {record.similarity !==
                        undefined
                          ? Number(
                              record.similarity
                            ).toFixed(
                              4
                            )
                          : "-"}
                      </td>

                      <td>
                        <span className="status-badge present">
                          {record.status ||
                            "PRESENT"}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );

  const renderStudentTeam = () => (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            PROJECT TEAM
          </span>

          <h2>
            Our Team
          </h2>

          <p>
            Meet the project team members.
          </p>
        </div>
      </div>

      {loadingTeam ? (
        <div className="panel">
          <div className="loading-state">
            <div className="spinner"></div>

            <p>
              Loading team members...
            </p>
          </div>
        </div>
      ) : teamMembers.length ===
        0 ? (
        <div className="panel">
          <div className="empty-state">
            <div>T</div>

            <h4>
              No team members found
            </h4>

            <p>
              Team information is not
              available yet.
            </p>
          </div>
        </div>
      ) : (
        <div className="team-grid">
          {teamMembers.map(
            (member) => (
              <div
                className="team-card"
                key={
                  member.team_id
                }
              >
                <div className="team-avatar">
                  {member.photo ? (
                    <img
                      src={
                        member.photo
                      }
                      alt={
                        member.name
                      }
                    />
                  ) : (
                    member.name
                      ?.charAt(
                        0
                      )
                      .toUpperCase() ||
                    "T"
                  )}
                </div>

                <h3>
                  {member.name}
                </h3>

                <span className="team-role">
                  {member.role}
                </span>

                <p>
                  {member.description ||
                    "Project team member"}
                </p>
              </div>
            )
          )}
        </div>
      )}
    </>
  );

  const renderSettings = () => (
  <>
    <div className="page-heading">
      <div>
        <span className="eyebrow">
          SYSTEM
        </span>

        <h2>
          Settings
        </h2>

        <p>
          Manage your account and system
          configuration.
        </p>
      </div>
    </div>

    <div className="settings-grid">

      <div className="panel settings-card">
        <div className="settings-icon">
          A
        </div>

        <div>
          <h3>
            Account
          </h3>

          <p>
            {currentUser?.username ||
              currentUser?.student_id ||
              "User"}
          </p>

          <span>
            {role === "admin"
              ? "Administrator"
              : "Student Account"}
          </span>
        </div>
      </div>

      <div className="panel settings-card">
        <div className="settings-icon">
          AI
        </div>

        <div>
          <h3>
            Recognition System
          </h3>

          <p>
            FaceNet512
          </p>

          <span>
            Cosine similarity based
            recognition
          </span>
        </div>
      </div>

      <div className="panel settings-card">
        <div className="settings-icon">
          DB
        </div>

        <div>
          <h3>
            Database
          </h3>

          <p>
            MongoDB Atlas
          </p>

          <span>
            Cloud database connection
          </span>
        </div>
      </div>

      <div className="panel settings-card">
        <div className="settings-icon">
          APP
        </div>

        <div>
          <h3>
            Application
          </h3>

          <p>
            Django + React
          </p>

          <span>
            Full-stack attendance system
          </span>
        </div>
      </div>

    </div>

    {role === "admin" && (
      <div
        className="panel"
        style={{
          marginTop: "24px",
          padding: "24px",
        }}
      >
        <div
          style={{
            marginBottom: "20px",
          }}
        >
          <span className="eyebrow">
            SECURITY
          </span>

          <h3
            style={{
              margin:
                "6px 0 6px",
              fontSize: "20px",
            }}
          >
            Change Admin Password
          </h3>

          <p
            style={{
              margin: 0,
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            Update the password for
            your administrator account.
          </p>
        </div>

        <form
          onSubmit={
            handleAdminPasswordChange
          }
        >
          <div
            style={{
              display: "grid",
              gap: "16px",
              maxWidth: "520px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                }}
              >
                New Password
              </label>

              <input
                type="password"
                value={newAdminPassword}
                onChange={(e) =>
                  setNewAdminPassword(
                    e.target.value
                  )
                }
                placeholder="Enter new password"
                autoComplete="new-password"
                style={{
                  width: "100%",
                  padding: "13px 14px",
                  borderRadius: "12px",
                  border:
                    "1px solid #d1d5db",
                  outline: "none",
                  fontSize: "14px",
                  boxSizing:
                    "border-box",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                }}
              >
                Confirm New Password
              </label>

              <input
                type="password"
                value={
                  confirmAdminPassword
                }
                onChange={(e) =>
                  setConfirmAdminPassword(
                    e.target.value
                  )
                }
                placeholder="Confirm new password"
                autoComplete="new-password"
                style={{
                  width: "100%",
                  padding: "13px 14px",
                  borderRadius: "12px",
                  border:
                    "1px solid #d1d5db",
                  outline: "none",
                  fontSize: "14px",
                  boxSizing:
                    "border-box",
                }}
              />
            </div>

            {passwordChangeError && (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "#fef2f2",
                  border:
                    "1px solid #fecaca",
                  color: "#b91c1c",
                  fontSize: "13px",
                }}
              >
                {passwordChangeError}
              </div>
            )}

            {passwordChangeMessage && (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "#f0fdf4",
                  border:
                    "1px solid #bbf7d0",
                  color: "#15803d",
                  fontSize: "13px",
                }}
              >
                {passwordChangeMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={
                passwordChangeLoading
              }
              style={{
                width: "fit-content",
                border: "none",
                borderRadius: "12px",
                padding:
                  "12px 20px",
                background:
                  passwordChangeLoading
                    ? "#93c5fd"
                    : "linear-gradient(135deg,#2563eb,#4f46e5)",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "700",
                cursor:
                  passwordChangeLoading
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {passwordChangeLoading
                ? "Changing Password..."
                : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    )}
  </>
);

  const renderPage = () => {
    if (role === "student") {
      switch (activePage) {
        case "profile":
          return renderStudentProfile();

        case "attendance":
          return renderStudentAttendance();
case "face":
  return renderFaceRecognition();

        case "team":
          return renderStudentTeam();

        case "settings":
          return renderSettings();

        default:
          return renderStudentDashboard();
      }
    }

    switch (activePage) {
      case "students":
        return renderStudents();

      case "attendance":
        return renderAttendance();

      case "face":
        return renderFaceRecognition();

      case "team":
        return renderAdminTeam();

      case "settings":
        return renderSettings();

      default:
        return renderAdminDashboard();
    }
  };

  if (!authChecked) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          color: "#334155",
          fontFamily:
            "Arial, sans-serif",
        }}
      >
        Checking authentication...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="login-page">
        <div className="login-shell">
          <section className="login-visual">
            <div className="login-visual-brand">
              <div className="login-brand-icon">F</div>
              <div>
                <h2>Face Attendance</h2>
                <span>Management System</span>
              </div>
            </div>

            <div className="login-hero-copy">
              <span className="login-kicker">SMART ATTENDANCE</span>
              <h1>
                Smart Attendance
                <br />
                with <span>Face Recognition</span>
              </h1>
              <p>
                A modern and secure system for automated attendance using
                advanced face recognition technology.
              </p>
            </div>

            <div className="login-features">
              <div className="login-feature">
                <div className="login-feature-icon">⌁</div>
                <div>
                  <strong>Fast & Accurate</strong>
                  <span>Recognition in seconds</span>
                </div>
              </div>
              <div className="login-feature">
                <div className="login-feature-icon">◇</div>
                <div>
                  <strong>Secure</strong>
                  <span>Your data is protected</span>
                </div>
              </div>
              <div className="login-feature">
                <div className="login-feature-icon">▥</div>
                <div>
                  <strong>Easy to Use</strong>
                  <span>Simple and user-friendly</span>
                </div>
              </div>
            </div>

            <div className="login-hero-art" aria-hidden="true">
              <img src="/ai-face-hero.png" alt="" />
            </div>

            <div className="login-tagline">
              <span>Smarter Attendance</span>
              <span>for a Better Tomorrow</span>
            </div>
          </section>

          <section className="login-panel">
            <div className="login-card">
              <div className="login-security-badge">
                <span>◈</span>
                <div>
                  <strong>Secure Access</strong>
                  <small>Better Management</small>
                </div>
              </div>

              <div className="login-card-header">
                <div className="login-card-icon">F</div>
                <h1>Face Attendance</h1>
                <p>Management System</p>
              </div>

              <div className="login-role-switch">
                <button
                  type="button"
                  className={loginRole === "admin" ? "active" : ""}
                  onClick={() => {
                    setLoginRole("admin");
                    setLoginError("");
                    setLoginUsername("");
                    setLoginPassword("");
                  }}
                >
                  <span>♙</span> Admin
                </button>
                <button
                  type="button"
                  className={loginRole === "student" ? "active" : ""}
                  onClick={() => {
                    setLoginRole("student");
                    setLoginError("");
                    setLoginUsername("");
                    setLoginPassword("");
                  }}
                >
                  <span>▣</span> Student
                </button>
              </div>

              <div className="login-description">
                <strong>
                  {loginRole === "admin" ? "Administrator Login" : "Student Login"}
                </strong>
                <span>
                  {loginRole === "admin"
                    ? "Sign in to access the administration dashboard."
                    : "Sign in to access your student portal."}
                </span>
              </div>

              <form onSubmit={handleLogin} className="login-form">
                <label>
                  {loginRole === "admin" ? "Username" : "Student ID"}
                  <div className="login-input-wrap">
                    <span>●</span>
                    <input
                      type="text"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder={
                        loginRole === "admin"
                          ? "Enter admin username"
                          : "Enter student ID"
                      }
                      autoComplete="username"
                    />
                  </div>
                </label>

                <label>
                  Password
                  <div className="login-input-wrap">
                    <span>◆</span>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter password"
                      autoComplete="current-password"
                    />
                  </div>
                </label>

                {loginError && (
                  <div className="login-error">{loginError}</div>
                )}

                <div className="login-options">
                  <label className="remember-option">
                    <input type="checkbox" defaultChecked />
                    <span>Remember me</span>
                  </label>
                  <button type="button" className="login-link">
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="login-submit"
                  disabled={loginLoading}
                >
                  <span>{loginLoading ? "Signing in..." : "Sign In"}</span>
                  <span className="login-submit-arrow">→</span>
                </button>
              </form>

              <div className="login-divider"><span>OR</span></div>
              <p className="login-contact">
                Don't have an account? <strong>Contact Admin</strong>
              </p>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside
        className="sidebar"
        style={{
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          boxSizing:
            "border-box",
        }}
      >
        <div className="brand">
          <div className="brand-icon">
            F
          </div>

          <div>
            <h1>
              Face Attendance
            </h1>

            <span>
              Management System
            </span>
          </div>
        </div>

        <div className="admin-profile">
          <div className="admin-avatar">
            {(
              currentUser?.username ||
              currentUser?.name ||
              currentUser?.student_id ||
              "U"
            )
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <strong>
              {currentUser?.username ||
                currentUser?.name ||
                currentUser?.student_id ||
                "User"}
            </strong>

            <span>
              {role === "admin"
                ? "Admin Account"
                : "Student Account"}
            </span>
          </div>

          <span className="online-dot"></span>
        </div>

        <nav
          className="sidebar-nav"
          style={{
            flex: "1",
          }}
        >
          <button
            className={
              activePage ===
              "dashboard"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              handleNavigation(
                "dashboard"
              )
            }
          >
            <span>D</span>
            Dashboard
          </button>

          {role === "admin" && (
            <>
              <button
                className={
                  activePage ===
                  "students"
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() =>
                  handleNavigation(
                    "students"
                  )
                }
              >
                <span>S</span>
                Students
              </button>

              <button
                className={
                  activePage ===
                  "attendance"
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() =>
                  handleNavigation(
                    "attendance"
                  )
                }
              >
                <span>R</span>
                Attendance
              </button>

              <button
                className={
                  activePage ===
                  "face"
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={
                  handleFaceRecognition
                }
              >
                <span>F</span>
                Face Recognition
              </button>
            </>
          )}

          {role === "student" && (
            <>
              <button
                className={
                  activePage ===
                  "profile"
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() =>
                  handleNavigation(
                    "profile"
                  )
                }
              >
                <span>P</span>
                My Profile
              </button>

              <button
                className={
                  activePage ===
                  "attendance"
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() =>
                  handleNavigation(
                    "attendance"
                  )
                }
              >
                <span>R</span>
                My Attendance
              </button>
            </>
          )}
<button
  className={
    activePage === "face"
      ? "nav-item active"
      : "nav-item"
  }
  onClick={handleFaceRecognition}
>
  <span>F</span>
  Mark Attendance
</button>
          <button
            className={
              activePage ===
              "team"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              handleNavigation(
                "team"
              )
            }
          >
            <span>T</span>
            Our Team
          </button>

          <button
            className={
              activePage ===
              "settings"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              handleNavigation(
                "settings"
              )
            }
          >
            <span>Settings</span>
          
          </button>
        </nav>

        <div className="sidebar-footer">
          <button
            className="logout-btn"
            onClick={
              handleLogout
            }
          >
            <span>Logout</span>
        
          </button>

          <small>
            Face Attendance System
            v1.0
          </small>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <h2>
              {activePage ===
              "dashboard"
                ? "Dashboard"
                : activePage ===
                  "students"
                ? "Student Management"
                : activePage ===
                  "attendance"
                ? role ===
                  "student"
                  ? "My Attendance"
                  : "Attendance Records"
                : activePage ===
                  "face"
                ? "Face Recognition"
                : activePage ===
                  "team"
                ? "Our Team"
                : activePage ===
                  "profile"
                ? "My Profile"
                : "Settings"}
            </h2>

            <span>
              Face Recognition
              Attendance System
            </span>
          </div>

          <div className="topbar-right">
            <div className="system-status">
              <span></span>
              System Online
            </div>

            <div className="profile-mini">
              <div className="admin-avatar small">
                {(
                  currentUser?.username ||
                  currentUser?.name ||
                  currentUser?.student_id ||
                  "U"
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {currentUser?.username ||
                    currentUser?.name ||
                    currentUser?.student_id ||
                    "User"}
                </strong>

                <span>
                  {role === "admin"
                    ? "Administrator"
                    : "Student"}
                </span>
              </div>
            </div>
          </div>
        </header>

        <section className="content-area">
          {renderPage()}
        </section>
      </main>

      {showAddStudent && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowAddStudent(
              false
            )
          }
        >
          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">
                  STUDENT MANAGEMENT
                </span>

                <h3>
                  Add New Student
                </h3>
              </div>

              <button
                className="close-btn"
                onClick={() => {
                  resetStudentForm();
                  setShowAddStudent(
                    false
                  );
                }}
              >
                ×
              </button>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>
                  Student ID *
                </label>

                <input
                  type="text"
                  placeholder="Enter student ID"
                  value={
                    studentId
                  }
                  onChange={(e) =>
                    setStudentId(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  Student Name *
                </label>

                <input
                  type="text"
                  placeholder="Enter student name"
                  value={
                    studentName
                  }
                  onChange={(e) =>
                    setStudentName(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  Email
                </label>

                <input
                  type="email"
                  placeholder="Enter email address"
                  value={
                    studentEmail
                  }
                  onChange={(e) =>
                    setStudentEmail(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  Course
                </label>

                <input
                  type="text"
                  placeholder="Enter course"
                  value={
                    studentCourse
                  }
                  onChange={(e) =>
                    setStudentCourse(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="form-group full-width">
                <label>
                  Student Password *
                </label>

                <input
                  type="password"
                  placeholder="Create student password"
                  value={
                    studentPassword
                  }
                  onChange={(e) =>
                    setStudentPassword(
                      e.target.value
                    )
                  }
                />
              </div>
              <div className="form-group full-width">
  <label>
    Confirm Password *
  </label>

  <input
    type="password"
    placeholder="Confirm student password"
    value={studentConfirmPassword}
    onChange={(e) =>
      setStudentConfirmPassword(
        e.target.value
      )
    }
  />
</div>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => {
                  resetStudentForm();
                  setShowAddStudent(
                    false
                  );
                }}
              >
                Cancel
              </button>

              <button
                className="primary-btn"
                onClick={
                  handleAddStudent
                }
              >
                Save Student
              </button>
            </div>
          </div>
        </div>
      )}

      {editingStudent && (
        <div
          className="modal-overlay"
          onClick={
            closeEditModal
          }
        >
          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">
                  STUDENT MANAGEMENT
                </span>

                <h3>
                  Edit Student
                </h3>
              </div>

              <button
                className="close-btn"
                onClick={
                  closeEditModal
                }
              >
                ×
              </button>
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label>
                  Student ID
                </label>

                <input
                  type="text"
                  value={
                    editingStudent.student_id
                  }
                  disabled
                />
              </div>

              <div className="form-group">
                <label>
                  Student Name *
                </label>

                <input
                  type="text"
                  value={
                    editName
                  }
                  onChange={(e) =>
                    setEditName(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  Email
                </label>

                <input
                  type="email"
                  value={
                    editEmail
                  }
                  onChange={(e) =>
                    setEditEmail(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  Course
                </label>

                <input
                  type="text"
                  value={
                    editCourse
                  }
                  onChange={(e) =>
                    setEditCourse(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  New Password
                </label>

                <input
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={
                    editPassword
                  }
                  onChange={(e) =>
                    setEditPassword(
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={
                  closeEditModal
                }
              >
                Cancel
              </button>

              <button
                className="primary-btn"
                onClick={
                  handleUpdateStudent
                }
              >
                Update Student
              </button>
            </div>
          </div>
        </div>
      )}

      {showFaceRegistration && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (
              !registrationLoading
            ) {
              closeFaceRegistration();
            }
          }}
        >
          <div
            className="modal face-registration-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">
                  FACE REGISTRATION
                </span>

                <h3>
                  Register Student Face
                </h3>

                <p
                  style={{
                    margin:
                      "6px 0 0",
                    color:
                      "#6b7280",
                    fontSize:
                      "13px",
                  }}
                >
                  {registrationStudent?.name ||
                    "Student"}
                </p>
              </div>

              <button
                className="close-btn"
                onClick={
                  closeFaceRegistration
                }
                disabled={
                  registrationLoading
                }
              >
                ×
              </button>
            </div>

            <div
              style={{
                marginBottom:
                  "18px",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  marginBottom:
                    "8px",
                }}
              >
                <strong>
                  Face Images
                </strong>

                <span
                  style={{
                    fontWeight:
                      "700",
                    color:
                      "#2563eb",
                  }}
                >
                  {registrationCount}/
                  {
                    TOTAL_FACE_IMAGES
                  }
                </span>
              </div>

              <div
                style={{
                  width:
                    "100%",
                  height:
                    "9px",
                  background:
                    "#e5e7eb",
                  borderRadius:
                    "999px",
                  overflow:
                    "hidden",
                }}
              >
                <div
                  style={{
                    width: `${
                      (registrationCount /
                        TOTAL_FACE_IMAGES) *
                      100
                    }%`,
                    height:
                      "100%",
                    background:
                      "linear-gradient(90deg,#2563eb,#4f46e5)",
                    transition:
                      "width 0.3s ease",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                padding:
                  "12px 14px",
                marginBottom:
                  "16px",
                borderRadius:
                  "12px",
                background:
                  "#f8fafc",
                border:
                  "1px solid #e5e7eb",
                fontSize:
                  "13px",
                color:
                  "#475569",
              }}
            >
              Keep the face centered and
              clearly visible. Capture
              different natural angles
              while maintaining good
              lighting.
            </div>

            <div
              className="camera-container"
              style={{
                position:
                  "relative",
                width:
                  "100%",
                height:
                  "360px",
                marginBottom:
                  "16px",
                overflow:
                  "hidden",
                borderRadius:
                  "14px",
                background:
                  "#000",
              }}
            >
              {registrationCameraStarted ? (
                <video
                  ref={
                    registrationVideoRef
                  }
                  autoPlay
                  playsInline
                  muted
                  className="camera-video"
                  style={{
                    display:
                      "block",
                    width:
                      "100%",
                    height:
                      "100%",
                    objectFit:
                      "cover",
                  }}
                />
              ) : (
                <div
                  className="camera-placeholder"
                  style={{
                    width:
                      "100%",
                    height:
                      "100%",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    flexDirection:
                      "column",
                  }}
                >
                  <div className="camera-placeholder-icon">
                    Camera
                  </div>

                  <h3>
                    Camera is ready
                  </h3>

                  <p>
                    Start the camera to
                    register face images.
                  </p>
                </div>
              )}

              {registrationCameraStarted &&
                !registrationCompleted && (
                  <div
                    style={{
                      position:
                        "absolute",
                      inset: 0,
                      pointerEvents:
                        "none",
                      zIndex: 10,
                    }}
                  >
                    <div
                      style={{
                        position:
                          "absolute",
                        left:
                          "50%",
                        top:
                          "50%",
                        width:
                          "210px",
                        height:
                          "280px",
                        transform:
                          "translate(-50%,-50%)",
                        border:
                          "3px solid #ffffff",
                        borderRadius:
                          "50%",
                        boxShadow:
                          "0 0 0 9999px rgba(0,0,0,0.20)",
                      }}
                    />

                    <div
                      style={{
                        position:
                          "absolute",
                        left:
                          "50%",
                        bottom:
                          "18px",
                        transform:
                          "translateX(-50%)",
                        width:
                          "100%",
                        textAlign:
                          "center",
                        color:
                          "#ffffff",
                        fontSize:
                          "14px",
                        fontWeight:
                          "600",
                      }}
                    >
                      Position your face inside the frame
                    </div>
                  </div>
                )}
            </div>

            {registrationMessage && (
              <div
                style={{
                  marginBottom:
                    "12px",
                  padding:
                    "11px 13px",
                  borderRadius:
                    "10px",
                  background:
                    registrationCompleted
                      ? "#ecfdf5"
                      : "#eff6ff",
                  border:
                    registrationCompleted
                      ? "1px solid #a7f3d0"
                      : "1px solid #bfdbfe",
                  color:
                    registrationCompleted
                      ? "#047857"
                      : "#1d4ed8",
                  fontSize:
                    "13px",
                }}
              >
                {registrationMessage}
              </div>
            )}

            {registrationError && (
              <div
                style={{
                  marginBottom:
                    "12px",
                  padding:
                    "11px 13px",
                  borderRadius:
                    "10px",
                  background:
                    "#fef2f2",
                  border:
                    "1px solid #fecaca",
                  color:
                    "#b91c1c",
                  fontSize:
                    "13px",
                }}
              >
                {registrationError}
              </div>
            )}

            <div
              style={{
                display:
                  "flex",
                gap: "10px",
                flexWrap:
                  "wrap",
              }}
            >
              {!registrationCameraStarted &&
                !registrationCompleted && (
                  <button
                    className="primary-btn large"
                    onClick={
                      startFaceRegistrationCamera
                    }
                  >
                    Start Camera
                  </button>
                )}

              {registrationCameraStarted &&
                !registrationCompleted && (
                  <>
                    <button
                      className="primary-btn large"
                      onClick={
                        handleCaptureRegistrationImage
                      }
                      disabled={
                        registrationLoading
                      }
                    >
                      {registrationLoading
                        ? "Processing..."
                        : `Capture Image ${
                            registrationCount +
                            1
                          }/${TOTAL_FACE_IMAGES}`}
                    </button>

                    <button
                      className="secondary-btn large"
                      onClick={
                        stopRegistrationCamera
                      }
                      disabled={
                        registrationLoading
                      }
                    >
                      Stop Camera
                    </button>
                  </>
                )}

              {registrationCompleted && (
                <button
                  className="primary-btn large"
                  onClick={
                    closeFaceRegistration
                  }
                >
                  Complete Registration
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddTeam && (
        <div
          className="modal-overlay"
          onClick={
            closeAddTeamModal
          }
        >
          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">
                  TEAM MANAGEMENT
                </span>

                <h3>
                  Add Team Member
                </h3>
              </div>

              <button
                className="close-btn"
                onClick={
                  closeAddTeamModal
                }
              >
                ×
              </button>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>
                  Name *
                </label>

                <input
                  type="text"
                  placeholder="Enter team member name"
                  value={
                    teamName
                  }
                  onChange={(e) =>
                    setTeamName(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  Role *
                </label>

                <input
                  type="text"
                  placeholder="Enter project role"
                  value={
                    teamRole
                  }
                  onChange={(e) =>
                    setTeamRole(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="form-group full-width">
                <label>
                  Description
                </label>

                <textarea
                  placeholder="Enter team member description"
                  value={
                    teamDescription
                  }
                  onChange={(e) =>
                    setTeamDescription(
                      e.target.value
                    )
                  }
                  rows="4"
                />
              </div>

              <div className="form-group full-width">
                <label>
                  Photo
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file =
                      e.target.files?.[0];

                    readImageAsBase64(
                      file,
                      setTeamPhoto
                    );
                  }}
                />

                {teamPhoto && (
                  <div className="team-photo-preview">
                    <img
                      src={
                        teamPhoto
                      }
                      alt="Team preview"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={
                  closeAddTeamModal
                }
                disabled={
                  teamSaving
                }
              >
                Cancel
              </button>

              <button
                className="primary-btn"
                onClick={
                  handleAddTeamMember
                }
                disabled={
                  teamSaving
                }
              >
                {teamSaving
                  ? "Saving..."
                  : "Save Team Member"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingTeam && (
        <div
          className="modal-overlay"
          onClick={
            closeEditTeamModal
          }
        >
          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">
                  TEAM MANAGEMENT
                </span>

                <h3>
                  Edit Team Member
                </h3>
              </div>

              <button
                className="close-btn"
                onClick={
                  closeEditTeamModal
                }
              >
                ×
              </button>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>
                  Name *
                </label>

                <input
                  type="text"
                  value={
                    editTeamName
                  }
                  onChange={(e) =>
                    setEditTeamName(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  Role *
                </label>

                <input
                  type="text"
                  value={
                    editTeamRole
                  }
                  onChange={(e) =>
                    setEditTeamRole(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="form-group full-width">
                <label>
                  Description
                </label>

                <textarea
                  value={
                    editTeamDescription
                  }
                  onChange={(e) =>
                    setEditTeamDescription(
                      e.target.value
                    )
                  }
                  rows="4"
                />
              </div>

              <div className="form-group full-width">
                <label>
                  Change Photo
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file =
                      e.target.files?.[0];

                    readImageAsBase64(
                      file,
                      setEditTeamPhoto
                    );
                  }}
                />

                {editTeamPhoto && (
                  <div className="team-photo-preview">
                    <img
                      src={
                        editTeamPhoto
                      }
                      alt="Team preview"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={
                  closeEditTeamModal
                }
                disabled={
                  teamSaving
                }
              >
                Cancel
              </button>

              <button
                className="primary-btn"
                onClick={
                  handleUpdateTeamMember
                }
                disabled={
                  teamSaving
                }
              >
                {teamSaving
                  ? "Updating..."
                  : "Update Team Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;