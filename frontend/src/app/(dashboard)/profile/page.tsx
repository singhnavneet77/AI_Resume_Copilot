"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Save,
  Plus,
  Trash2,
  BookOpen,
  Briefcase,
  Sliders,
  Code,
  Award,
  User,
  CheckCircle,
} from "lucide-react";

interface Education {
  institute: string;
  degree: string;
  cgpa: string;
  start_date: string;
  end_date: string;
}

interface Skill {
  skill_name: string;
  category: string;
}

interface Project {
  title: string;
  description: string;
  tech_stack: string;
  github_link: string;
}

interface Experience {
  company: string;
  role: string;
  description: string;
  start_date: string;
  end_date: string;
}

interface Achievement {
  content: string;
}

export default function ProfilePage() {
  const { apiFetch, token } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Profile fields state
  const [personal, setPersonal] = useState({
    name: "",
    email: "",
    phone: "",
    github: "",
    linkedin: "",
  });
  const [education, setEducation] = useState<Education[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Category options for skills
  const categories = ["Languages", "Frameworks", "Libraries", "Databases", "Tools", "Cloud Services", "General"];

  useEffect(() => {
    if (!token) return; // Don't fetch if not authenticated yet
    async function loadProfile() {
      try {
        setLoading(true);
        const data = await apiFetch("/profile");
        
        // Populate fields (handling empty fallbacks)
        setEducation(data.education || []);
        setExperience(data.experience || []);
        setSkills(data.skills || []);
        setProjects(data.projects || []);
        setAchievements(data.achievements || []);
        
        // Use active user info as fallback for personal info
        const storedUser = localStorage.getItem("user");
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        
        setPersonal({
          name: parsedUser?.name || "",
          email: parsedUser?.email || "",
          phone: data.phone || "",
          github: data.github || "",
          linkedin: data.linkedin || "",
        });
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [token]); // Re-run whenever the logged-in user/token changes

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    
    // Prepare payload. Notice that FastAPI updates profile by cleaning and re-inserting lists.
    const payload = {
      education,
      skills,
      projects,
      experience,
      achievements
    };

    try {
      await apiFetch("/profile", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save profile", err);
      alert("Error saving profile details.");
    } finally {
      setSaving(false);
    }
  };

  // Helper dynamic operations
  const addEdu = () => setEducation([...education, { institute: "", degree: "", cgpa: "", start_date: "", end_date: "" }]);
  const removeEdu = (index: number) => setEducation(education.filter((_, i) => i !== index));
  const updateEdu = (index: number, field: keyof Education, val: string) => {
    const updated = [...education];
    updated[index][field] = val;
    setEducation(updated);
  };

  const addExp = () => setExperience([...experience, { company: "", role: "", description: "", start_date: "", end_date: "" }]);
  const removeExp = (index: number) => setExperience(experience.filter((_, i) => i !== index));
  const updateExp = (index: number, field: keyof Experience, val: string) => {
    const updated = [...experience];
    updated[index][field] = val;
    setExperience(updated);
  };

  const addSkill = () => setSkills([...skills, { skill_name: "", category: "Languages" }]);
  const removeSkill = (index: number) => setSkills(skills.filter((_, i) => i !== index));
  const updateSkill = (index: number, field: keyof Skill, val: string) => {
    const updated = [...skills];
    updated[index][field] = val;
    setSkills(updated);
  };

  const addProject = () => setProjects([...projects, { title: "", description: "", tech_stack: "", github_link: "" }]);
  const removeProject = (index: number) => setProjects(projects.filter((_, i) => i !== index));
  const updateProject = (index: number, field: keyof Project, val: string) => {
    const updated = [...projects];
    updated[index][field] = val;
    setProjects(updated);
  };

  const addAchievement = () => setAchievements([...achievements, { content: "" }]);
  const removeAchievement = (index: number) => setAchievements(achievements.filter((_, i) => i !== index));
  const updateAchievement = (index: number, val: string) => {
    const updated = [...achievements];
    updated[index].content = val;
    setAchievements(updated);
  };

  const tabs = [
    { id: "personal", name: "Personal Info", icon: User },
    { id: "education", name: "Education", icon: BookOpen },
    { id: "experience", name: "Experience", icon: Briefcase },
    { id: "skills", name: "Skills", icon: Sliders },
    { id: "projects", name: "Projects", icon: Code },
    { id: "achievements", name: "Achievements", icon: Award },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">Fetching Master Career Profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Master Career Profile
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Maintain your master credentials. This acts as the vector source for custom-tailored resumes.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {success && (
            <span className="flex items-center text-xs text-emerald-400 font-semibold space-x-1 animate-fade-in bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20">
              <CheckCircle className="w-4 h-4" />
              <span>Profile Synced Successfully!</span>
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving Details..." : "Save Profile Details"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Tabs & Form Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Tab Selection */}
        <div className="lg:col-span-1 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible border-b lg:border-b-0 lg:border-r border-slate-800/80 pb-4 lg:pb-0 lg:pr-6 gap-1 shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all w-full ${
                  isSelected
                    ? "bg-violet-600/25 text-violet-300 border-l-2 border-violet-500"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? "text-violet-400" : "text-slate-500"}`} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Form panel */}
        <div className="lg:col-span-3 glass-panel p-6 sm:p-8 rounded-2xl">
          {/* PERSONAL INFO TAB */}
          {activeTab === "personal" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-200 mb-2">Personal Credentials</h3>
                <p className="text-xs text-slate-500">Contact details embedded in the top header of tailored resumes.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    type="text"
                    disabled
                    value={personal.name}
                    className="w-full px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-400 focus:outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={personal.email}
                    className="w-full px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-400 focus:outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 019-2834"
                    value={personal.phone}
                    onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/40 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">GitHub Profile URL</label>
                  <input
                    type="text"
                    placeholder="https://github.com/username"
                    value={personal.github}
                    onChange={(e) => setPersonal({ ...personal, github: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/40 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">LinkedIn Profile URL</label>
                  <input
                    type="text"
                    placeholder="https://linkedin.com/in/username"
                    value={personal.linkedin}
                    onChange={(e) => setPersonal({ ...personal, linkedin: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/40 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* EDUCATION TAB */}
          {activeTab === "education" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-200">Education Details</h3>
                  <p className="text-xs text-slate-500">Degree details, institute history, and grade scores.</p>
                </div>
                <button
                  onClick={addEdu}
                  className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Institute</span>
                </button>
              </div>

              {education.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-800/80 rounded-2xl bg-slate-900/10">
                  <p className="text-xs text-slate-500">No education institutes added yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {education.map((edu, index) => (
                    <div key={index} className="p-4 bg-slate-900/20 border border-slate-800/80 rounded-xl relative space-y-4">
                      <button
                        onClick={() => removeEdu(index)}
                        className="absolute top-4 right-4 p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Institute Name</label>
                          <input
                            type="text"
                            required
                            placeholder="Harvard University"
                            value={edu.institute}
                            onChange={(e) => updateEdu(index, "institute", e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Degree / Major</label>
                          <input
                            type="text"
                            required
                            placeholder="Bachelor of Science in Computer Science"
                            value={edu.degree}
                            onChange={(e) => updateEdu(index, "degree", e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">CGPA / Grade Score</label>
                          <input
                            type="text"
                            placeholder="3.8 / 4.0 or 9.2 CGPA"
                            value={edu.cgpa}
                            onChange={(e) => updateEdu(index, "cgpa", e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
                          <input
                            type="text"
                            placeholder="Sept 2018"
                            value={edu.start_date}
                            onChange={(e) => updateEdu(index, "start_date", e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">End Date (or Expected)</label>
                          <input
                            type="text"
                            placeholder="June 2022"
                            value={edu.end_date}
                            onChange={(e) => updateEdu(index, "end_date", e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* EXPERIENCE TAB */}
          {activeTab === "experience" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-200">Work History</h3>
                  <p className="text-xs text-slate-500">Work details, roles, companies, and performance summaries.</p>
                </div>
                <button
                  onClick={addExp}
                  className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Experience</span>
                </button>
              </div>

              {experience.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-800/80 rounded-2xl bg-slate-900/10">
                  <p className="text-xs text-slate-500">No experiences added yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {experience.map((exp, index) => (
                    <div key={index} className="p-4 bg-slate-900/20 border border-slate-800/80 rounded-xl relative space-y-4">
                      <button
                        onClick={() => removeExp(index)}
                        className="absolute top-4 right-4 p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Company Name</label>
                          <input
                            type="text"
                            required
                            placeholder="Google Inc."
                            value={exp.company}
                            onChange={(e) => updateExp(index, "company", e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Role Title</label>
                          <input
                            type="text"
                            required
                            placeholder="Senior Software Engineer"
                            value={exp.role}
                            onChange={(e) => updateExp(index, "role", e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
                          <input
                            type="text"
                            placeholder="Jan 2022"
                            value={exp.start_date}
                            onChange={(e) => updateExp(index, "start_date", e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">End Date (or "Present")</label>
                          <input
                            type="text"
                            placeholder="Present"
                            value={exp.end_date}
                            onChange={(e) => updateExp(index, "end_date", e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description / Contributions (Master Details)</label>
                          <textarea
                            rows={4}
                            required
                            placeholder="• Built clean backend microservices using Python and FastAPI.&#10;• Led optimization of database indexes leading to a 40% query performance gains."
                            value={exp.description}
                            onChange={(e) => updateExp(index, "description", e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">Provide detailed descriptions. The AI RAG engine will match individual sentences, and rewrite them to highlight target JD keywords.</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SKILLS TAB */}
          {activeTab === "skills" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-200">Skillset</h3>
                  <p className="text-xs text-slate-500">Programming languages, tools, databases, and general capabilities.</p>
                </div>
                <button
                  onClick={addSkill}
                  className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Skill</span>
                </button>
              </div>

              {skills.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-800/80 rounded-2xl bg-slate-900/10">
                  <p className="text-xs text-slate-500">No skills registered yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-1">
                  {skills.map((skill, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 bg-slate-900/20 border border-slate-800/80 rounded-xl">
                      <input
                        type="text"
                        required
                        placeholder="Python"
                        value={skill.skill_name}
                        onChange={(e) => updateSkill(index, "skill_name", e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-900/40 border border-slate-800 focus:border-violet-500 rounded-lg text-xs text-white focus:outline-none transition-all"
                      />
                      <select
                        value={skill.category}
                        onChange={(e) => updateSkill(index, "category", e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg p-2 focus:outline-none focus:border-violet-500"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeSkill(index)}
                        className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PROJECTS TAB */}
          {activeTab === "projects" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-200">Projects catalog</h3>
                  <p className="text-xs text-slate-500">Development projects, hackathons, and github achievements.</p>
                </div>
                <button
                  onClick={addProject}
                  className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Project</span>
                </button>
              </div>

              {projects.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-800/80 rounded-2xl bg-slate-900/10">
                  <p className="text-xs text-slate-500">No projects added yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {projects.map((proj, index) => (
                    <div key={index} className="p-4 bg-slate-900/20 border border-slate-800/80 rounded-xl relative space-y-4">
                      <button
                        onClick={() => removeProject(index)}
                        className="absolute top-4 right-4 p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Project Title</label>
                          <input
                            type="text"
                            required
                            placeholder="AI Resume Recommendation Pipeline"
                            value={proj.title}
                            onChange={(e) => updateProject(index, "title", e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tech Stack (comma separated)</label>
                          <input
                            type="text"
                            placeholder="Python, FastAPI, Qdrant, React"
                            value={proj.tech_stack}
                            onChange={(e) => updateProject(index, "tech_stack", e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">GitHub Repository URL</label>
                          <input
                            type="text"
                            placeholder="https://github.com/username/project"
                            value={proj.github_link}
                            onChange={(e) => updateProject(index, "github_link", e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                          <textarea
                            rows={3}
                            required
                            placeholder="Designed and developed a RAG recommendation service using Qdrant vector database..."
                            value={proj.description}
                            onChange={(e) => updateProject(index, "description", e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ACHIEVEMENTS TAB */}
          {activeTab === "achievements" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-200">Honors & Awards</h3>
                  <p className="text-xs text-slate-500">Key career highlights, academic honors, or organizational awards.</p>
                </div>
                <button
                  onClick={addAchievement}
                  className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Highlight</span>
                </button>
              </div>

              {achievements.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-800/80 rounded-2xl bg-slate-900/10">
                  <p className="text-xs text-slate-500">No achievements recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {achievements.map((ach, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <textarea
                        rows={2}
                        required
                        placeholder="Won 1st prize in local AI Hackathon out of 100+ competing engineering candidates."
                        value={ach.content}
                        onChange={(e) => updateAchievement(index, e.target.value)}
                        className="flex-1 px-4 py-3 bg-slate-900/40 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
                      />
                      <button
                        onClick={() => removeAchievement(index)}
                        className="p-3 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-all self-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
