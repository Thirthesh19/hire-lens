import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm sticky top-0">
      <div className="flex justify-between items-center h-16 px-4 sm:px-6 max-w-[1280px] mx-auto font-heading tracking-tight">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-2xl font-extrabold text-slate-900">
            HireLens
          </Link>
          <div className="hidden md:flex gap-6 items-center">
            <Link
              to="/"
              className={`transition-colors font-semibold ${
                location.pathname === "/"
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-slate-500 hover:text-primary"
              }`}
            >
              Upload
            </Link>
            <Link
              to="/result"
              className={`transition-colors font-semibold ${
                location.pathname === "/result"
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-slate-500 hover:text-primary"
              }`}
            >
              Result
            </Link>
          </div>
        </div>
        <div>
          <Link
            to="/"
            className="bg-primary-container text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-all text-sm"
          >
            New Analysis
          </Link>
        </div>
      </div>
    </nav>
  );
}
