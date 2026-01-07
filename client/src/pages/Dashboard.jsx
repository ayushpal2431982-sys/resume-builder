import { FilePenLineIcon, PencilIcon, PlusIcon, TrashIcon, UploadCloudIcon, XIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../configs/api";
import toast from "react-hot-toast";

const Dashboard = () => {
  const { token, user, loading: authLoading } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const colors = ["#9333ea", "#d97706", "#dc2626", "#0284c7", "#16a34a"];

  const [allResumes, setAllResumes] = useState([]);
  const [showCreateResume, setShowCreateResume] = useState(false);
  const [showUploadResume, setShowUploadResume] = useState(false);
  const [editResumeId, setEditResumeId] = useState(null);
  const [title, setTitle] = useState("");
  const [resume, setResume] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingResumes, setLoadingResumes] = useState(true);

  /* ================= LOAD RESUMES ================= */
  useEffect(() => {
    const loadAllResumes = async () => {
      // Don't fetch if still checking auth or no user/token
      if (authLoading) {
        return;
      }

      if (!token || !user) {
        console.log('No token or user, redirecting to login');
        setLoadingResumes(false);
        navigate('/login');
        return;
      }

      try {
        console.log('Fetching resumes with token:', token.substring(0, 20) + '...');
        const { data } = await api.get("/api/users/resumes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Resumes loaded:', data.resumes);
        setAllResumes(data.resumes || []);
      } catch (error) {
        console.error('Error loading resumes:', error.response || error);
        if (error.response?.status === 401) {
          toast.error("Session expired. Please login again.");
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          toast.error(error?.response?.data?.message || "Failed to load resumes");
        }
      } finally {
        setLoadingResumes(false);
      }
    };

    loadAllResumes();
  }, [token, user, authLoading, navigate]);

  /* ================= CREATE RESUME ================= */
  const createResume = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      const { data } = await api.post(
        "/api/resumes/create",
        { title },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAllResumes((prev) => [...prev, data.resume]);
      setTitle("");
      setShowCreateResume(false);
      navigate(`/app/builder/${data.resume._id}`);
      toast.success("Resume created successfully");
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

 
/* ================= UPLOAD RESUME ================= */
const uploadResume = async (e) => {
  e.preventDefault();

  if (!title || !resume) {
    toast.error("Please add title and select PDF file");
    return;
  }

  setIsLoading(true);

  try {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("resume", resume);

    console.log("Uploading resume...");

    const { data } = await api.post(
      "/api/ai/upload-resume",
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Upload response:", data);

    // ✅ Fetch the newly created resume with all parsed data
    console.log("Fetching resume data...");
    const { data: resumeData } = await api.get(`/api/resumes/get/${data.resumeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("Resume data received:", resumeData.resume);

    // ✅ Add the new resume to state
    setAllResumes((prev) => [...prev, resumeData.resume]);

    setTitle("");
    setResume(null);
    setShowUploadResume(false);
    toast.success(data.message);
    
    // Navigate to builder
    navigate(`/app/builder/${data.resumeId}`);
    
  } catch (error) {
    toast.error(error?.response?.data?.message || "Upload failed");
    console.error("Upload error:", error);
  } finally {
    setIsLoading(false);
  }
};
 

  /* ================= DELETE RESUME ================= */
  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) return;

    try {
      await api.delete(`/api/resumes/delete/${resumeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllResumes((prev) => prev.filter((r) => r._id !== resumeId));
      toast.success("Resume deleted");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Delete failed");
    }
  };

  /* ================= EDIT TITLE ================= */
  const editTitle = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      await api.put(
        "/api/resumes/update",
        {
          resumeId: editResumeId,
          resumeData: JSON.stringify({ title }),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAllResumes((prev) =>
        prev.map((r) =>
          r._id === editResumeId ? { ...r, title } : r
        )
      );

      setEditResumeId(null);
      setTitle("");
      toast.success("Title updated");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Update failed");
    }
  };

  // Show loading state while fetching resumes
  if (loadingResumes) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your resumes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <p className="text-2xl font-medium mb-6 bg-gradient-to-r from-slate-600 to-slate-700 bg-clip-text text-transparent sm:hidden">
        Welcome, {user?.name}
      </p>

      {/* CREATE / UPLOAD */}
      <div className="flex gap-4">
        <button
          onClick={() => setShowCreateResume(true)}
          className="w-full bg-white sm:max-w-36 h-48 flex flex-col items-center justify-center rounded-lg gap-2 text-slate-600 border border-dashed border-slate-300 group hover:border-purple-500 hover:shadow-lg transition-all"
        >
          <PlusIcon className="size-11 p-2.5 bg-gradient-to-br from-indigo-300 to-indigo-500 text-white rounded-full" />
          <p className="text-sm group-hover:text-indigo-600">
            Create Resume
          </p>
        </button>

        <button
          onClick={() => setShowUploadResume(true)}
          className="w-full bg-white sm:max-w-36 h-48 flex flex-col items-center justify-center rounded-lg gap-2 text-slate-600 border border-dashed border-slate-300 group hover:border-indigo-500 hover:shadow-lg transition-all"
        >
          <UploadCloudIcon className="size-11 p-2.5 bg-gradient-to-br from-purple-300 to-purple-500 text-white rounded-full" />
          <p className="text-sm group-hover:text-purple-600">
            Upload Existing
          </p>
        </button>
      </div>

      <hr className="border-slate-300 my-6 sm:w-[305px]" />

      {/* RESUME CARDS */}
      <div className="grid grid-cols-2 sm:flex flex-wrap gap-4">
        {allResumes.length === 0 ? (
          <p className="text-gray-500 text-sm">No resumes yet. Create your first resume!</p>
        ) : (
          allResumes.map((resumeItem, index) => {
            const baseColor = colors[index % colors.length];

            return (
              <div
                key={resumeItem._id}
                className="relative w-full sm:max-w-36 h-48 flex flex-col items-center justify-center rounded-lg gap-2 border group hover:shadow-lg transition-all cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${baseColor}10, ${baseColor}40)`,
                  borderColor: baseColor + "40",
                }}
                onClick={() => navigate(`/app/builder/${resumeItem._id}`)}
              >
                <FilePenLineIcon
                  className="size-7"
                  style={{ color: baseColor }}
                />
                <p
                  className="text-sm px-2 text-center"
                  style={{ color: baseColor }}
                >
                  {resumeItem.title}
                </p>

                <p
                  className="absolute bottom-1 text-[11px]"
                  style={{ color: baseColor + "90" }}
                >
                  Updated on{" "}
                  {new Date(resumeItem.updatedAt).toLocaleDateString()}
                </p>

                {/* ACTIONS */}
                <div
                  className="absolute top-2 right-2 hidden group-hover:flex gap-1 bg-white/80 backdrop-blur rounded-full p-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <TrashIcon
                    className="size-6 p-1 hover:bg-red-500/20 hover:text-red-600 rounded-lg"
                    onClick={() => handleDeleteResume(resumeItem._id)}
                  />
                  <PencilIcon
                    className="size-6 p-1 hover:bg-blue-500/20 hover:text-blue-600 rounded-lg"
                    onClick={() => {
                      setEditResumeId(resumeItem._id);
                      setTitle(resumeItem.title);
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreateResume && (
        <form
          onSubmit={createResume}
          onClick={() => setShowCreateResume(false)}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg p-6 w-full max-w-sm relative"
          >
            <h2 className="text-xl font-bold mb-4">Create a Resume</h2>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded mb-4"
              placeholder="Resume title"
              required
            />

            <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
              Create
            </button>

            <XIcon
              className="absolute top-4 right-4 cursor-pointer hover:text-red-600"
              onClick={() => setShowCreateResume(false)}
            />
          </div>
        </form>
      )}

      {/* UPLOAD MODAL */}
      {showUploadResume && (
        <form
          onSubmit={uploadResume}
          onClick={() => setShowUploadResume(false)}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg p-6 w-full max-w-sm relative"
          >
            <h2 className="text-xl font-bold mb-4">Upload Resume</h2>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded mb-4"
              placeholder="Resume title"
              required
            />

            <label className="block cursor-pointer mb-4">
              <input
                type="file"
                accept=".pdf"
                hidden
                onChange={(e) => setResume(e.target.files[0])}
              />
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-green-500 hover:bg-green-50 transition-all">
                {resume ? (
                  <div>
                    <p className="font-medium text-green-600">{resume.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Click to change</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600">Click to upload PDF</p>
                    <p className="text-xs text-gray-400 mt-1">PDF files only</p>
                  </div>
                )}
              </div>
            </label>

            <button 
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Uploading..." : "Upload"}
            </button>

            <XIcon
              className="absolute top-4 right-4 cursor-pointer hover:text-red-600"
              onClick={() => setShowUploadResume(false)}
            />
          </div>
        </form>
      )}

      {/* EDIT MODAL */}
      {editResumeId && (
        <form
          onSubmit={editTitle}
          onClick={() => setEditResumeId(null)}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg p-6 w-full max-w-sm relative"
          >
            <h2 className="text-xl font-bold mb-4">Edit Resume Title</h2>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded mb-4"
              required
            />

            <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
              Update
            </button>

            <XIcon
              className="absolute top-4 right-4 cursor-pointer hover:text-red-600"
              onClick={() => setEditResumeId(null)}
            />
          </div>
        </form>
      )}
    </div>
  );
};

export default Dashboard;