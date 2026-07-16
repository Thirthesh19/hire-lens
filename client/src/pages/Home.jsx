import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CloudUpload, Info, BarChart2 } from "lucide-react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      alert("Please upload a resume first!");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jobDesc", jobDesc);

      const res = await fetch("/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Server error");
      }

      const data = await res.json();
      // Use React Router state instead of localStorage
      navigate("/result", { state: { data } });
    } catch (err) {
      console.error(err);
      alert("Something went wrong! Check backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-grow pt-16 pb-16 px-4 sm:px-6 max-w-[1280px] mx-auto w-full">
      <div className="grid grid-cols-12 gap-6 items-center">
        <div className="col-span-12 text-center mb-6 sm:mb-10">
          <span className="text-xs font-semibold text-primary tracking-widest uppercase mb-3 block">
            AI-Powered Recruitment Intelligence
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-on-surface mb-4 max-w-3xl mx-auto font-heading">
            Analyze Your Resume with AI Precision
          </h1>
          <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl mx-auto">
            Leverage advanced neural analysis to identify skills gaps, quantify impact, and align your profile with corporate expectations in seconds.
          </p>
        </div>

        <div className="col-span-12 max-w-4xl mx-auto w-full">
          <div className="bg-white rounded-xl shadow-sm border border-outline-variant p-4 sm:p-6 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Step 1: Upload */}
              <div className="space-y-6">
                <label className="text-xs font-semibold text-on-surface-variant block uppercase tracking-wider">
                  Step 1: Upload Profile
                </label>
                <label className="border-2 border-dashed border-outline-variant rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-blue-50 transition-colors cursor-pointer group h-64">
                  <CloudUpload className="w-12 h-12 text-primary mb-4" />
                  <p className="text-xl font-semibold text-on-surface text-center mb-2 font-heading">
                    Drag & Drop Resume
                  </p>
                  <p className="text-sm text-on-surface-variant text-center mb-6">
                    Supports PDF, DOCX, and high-res Images
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <span className="bg-white border border-outline-variant text-on-surface px-4 py-2 rounded-lg font-medium shadow-sm group-hover:border-primary transition-colors">
                    Browse Files
                  </span>
                  {file && (
                    <p className="text-sm mt-4 text-emerald-600 font-medium">
                      Selected: {file.name}
                    </p>
                  )}
                </label>
                <div className="flex items-start gap-2 p-3 bg-primary-fixed text-blue-900 rounded-lg">
                  <Info className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">Your data is encrypted and used only for analysis.</p>
                </div>
              </div>

              {/* Step 2: Job Desc */}
              <div className="space-y-6">
                <label className="text-xs font-semibold text-on-surface-variant block uppercase tracking-wider">
                  Step 2: Contextualize
                </label>
                <div className="flex flex-col h-full">
                  <textarea
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    className="flex-grow w-full min-h-[220px] p-4 rounded-xl border border-outline-variant focus:ring-2 focus:ring-primary-container focus:border-primary transition-all text-on-surface placeholder:text-slate-400"
                    placeholder="Paste Job Description Here"
                  ></textarea>
                  <div className="mt-8 flex flex-col gap-4">
                    <button
                      onClick={handleAnalyze}
                      disabled={loading}
                      className="w-full bg-primary-container text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        "Analyzing..."
                      ) : (
                        <>
                          <BarChart2 className="w-6 h-6" />
                          Analyze Resume
                        </>
                      )}
                    </button>
                    <p className="text-sm text-on-surface-variant text-center">
                      Average processing time: 4.2 seconds
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
