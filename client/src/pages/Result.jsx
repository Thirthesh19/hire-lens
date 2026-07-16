import { useEffect, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { CheckCircle, XCircle, ChevronRight, Briefcase, Award, TrendingUp, AlertTriangle, Lightbulb, Sparkles } from "lucide-react";

export default function Result() {
  const location = useLocation();
  const [data, setData] = useState(null);

  useEffect(() => {
    // Read from route state passed by Home.jsx
    if (location.state?.data) {
      setData(location.state.data);
    }
  }, [location.state]);

  if (!location.state?.data && !data) {
    return <Navigate to="/" replace />;
  }

  if (!data) return null;

  return (
    <main className="flex-grow pt-8 pb-12 px-4 sm:px-6 max-w-[1280px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <span className="text-xs font-semibold text-primary mb-2 block uppercase tracking-widest">
            Analysis Completed
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold">
            Candidate Report: <span className="text-slate-800">{data.name || "Unknown"}</span>
          </h1>
        </div>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Scores */}
        <div className="col-span-1 md:col-span-4 flex flex-col gap-6">
          {/* Job Match Score */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <h3 className="font-heading text-xl font-bold mb-4">Overall Match Score</h3>
            <div
              className="relative w-40 h-40 rounded-full flex items-center justify-center mb-4 transition-all duration-1000 circular-progress"
              style={{ "--progress": `${data.matchScore || 0}%`, "--tw-gradient-from": "#004ac6", "--tw-gradient-to": "#dbe1ff" }}
            >
              <div className="flex flex-col z-10 bg-white w-[78%] h-[78%] rounded-full items-center justify-center">
                <span className="text-4xl font-extrabold text-primary">{data.matchScore || 0}%</span>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant">
              Comprehensive semantic match including skills, experience, and domain relevance.
            </p>
          </div>

          {/* ATS Compatibility Score */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <h3 className="font-heading text-xl font-bold mb-4">ATS Score</h3>
            <div
              className="relative w-40 h-40 rounded-full flex items-center justify-center mb-4 transition-all duration-1000 circular-progress"
              style={{ "--progress": `${data.atsScore || 0}%`, "--tw-gradient-from": "#8b5cf6", "--tw-gradient-to": "#ede9fe" }}
            >
              <div className="flex flex-col z-10 bg-white w-[78%] h-[78%] rounded-full items-center justify-center">
                <span className="text-4xl font-extrabold text-violet-600">{data.atsScore || 0}</span>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant">
              Measures resume structure, sections, and formatting quality.
            </p>
          </div>
        </div>

        {/* Main Info */}
        <div className="col-span-1 md:col-span-8 flex flex-col gap-6">
          {/* Summary Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-xs font-semibold text-outline mb-2 uppercase">Professional Summary</h3>
            <p className="text-lg leading-relaxed text-slate-700 font-medium">
              {data.summary || "No summary available."}
            </p>
          </div>
          
          {/* Reason Alert */}
          {data.reason && data.domainMatchScore < 100 && (
            <div className="bg-amber-50 p-6 rounded-xl shadow-sm border border-amber-200">
               <h3 className="font-heading text-lg font-bold text-amber-800 mb-2 flex items-center gap-2">
                 <AlertTriangle className="w-5 h-5" /> Domain Analysis
               </h3>
               <p className="text-amber-900 text-sm">{data.reason}</p>
            </div>
          )}

          {/* Details Grid */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-outline mb-1 uppercase">Email</p>
              <p className="text-md font-semibold text-slate-800 break-all">{data.email || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-outline mb-1 uppercase">Phone</p>
              <p className="text-md font-semibold text-slate-800">{data.phone || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-outline mb-1 uppercase">Experience Gap</p>
              <p className="text-md font-semibold text-slate-800">{data.expGap || data.experience || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-outline mb-1 uppercase">Education</p>
              <p className="text-md font-semibold text-slate-800">
                {(data.education && data.education.length > 0) ? data.education.join(", ") : "Not Found"}
              </p>
            </div>
          </div>

          {/* Extracted Lists Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" /> Projects
              </h3>
              <ul className="space-y-3 text-sm text-slate-700">
                {(!data.projects || data.projects.length === 0) ? (
                  <li className="text-slate-400 italic">No projects detected.</li>
                ) : (
                  data.projects.map((proj, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span>{proj}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" /> Certifications
              </h3>
              <ul className="space-y-3 text-sm text-slate-700">
                {(!data.certifications || data.certifications.length === 0) ? (
                  <li className="text-slate-400 italic">No certifications detected.</li>
                ) : (
                  data.certifications.map((cert, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span>{cert}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Skills Row */}
        <div className="col-span-1 md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Matched Skills */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" /> Detected Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {(!data.allSkills || data.allSkills.length === 0) ? (
                <span className="text-sm text-slate-500">None</span>
              ) : (
                data.allSkills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 text-xs font-semibold rounded-full border bg-blue-50 text-blue-700 border-blue-100">
                    {skill}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Missing Skills */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-error" /> Missing from Job Desc.
            </h3>
            <div className="flex flex-wrap gap-2">
              {(!data.missingSkills || data.missingSkills.length === 0) ? (
                <span className="text-sm text-slate-500">None</span>
              ) : (
                data.missingSkills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 text-xs font-semibold rounded-full border bg-red-50 text-red-700 border-red-100">
                    {skill}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="col-span-1 md:col-span-12 bg-indigo-50 p-6 sm:p-8 rounded-xl border border-indigo-100">
          <h3 className="font-heading text-2xl font-bold text-indigo-900 mb-6 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" /> AI Insights & Suggestions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-lg shadow-sm">
              <h4 className="font-bold text-emerald-700 mb-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> Strengths
              </h4>
              <ul className="text-sm text-slate-700 space-y-2 list-disc pl-4">
                {data.strengths?.map((str, i) => (
                  <li key={i}>{str}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm">
              <h4 className="font-bold text-red-700 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Weaknesses
              </h4>
              <ul className="text-sm text-slate-700 space-y-2 list-disc pl-4">
                {data.weaknesses?.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm border-2 border-indigo-100">
              <h4 className="font-bold text-indigo-700 mb-2 flex items-center gap-1">
                <Lightbulb className="w-4 h-4" /> Suggestions
              </h4>
              <ul className="text-sm text-slate-700 space-y-2 list-disc pl-4">
                {data.suggestions?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
