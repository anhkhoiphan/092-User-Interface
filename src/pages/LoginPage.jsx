import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FiMail,
  FiLock,
  FiUser,
  FiAtSign,
  FiEye,
  FiEyeOff,
  FiLoader,
  FiArrowRight,
  FiMessageCircle,
  FiZap,
  FiBookOpen,
  FiActivity,
  FiBarChart2,
  FiCheckCircle,
} from "react-icons/fi";
import { login, register, clearError } from "../store/slices/authSlice";

function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    username: "",
    email: "",
    password: "",
  });
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [usernameError, setUsernameError] = useState("");

  const validateUsername = (value) => {
    if (!value) return "";
    if (value.length < 3) return "Username phải có ít nhất 3 ký tự";
    if (value.length > 30) return "Username tối đa 30 ký tự";
    if (!/^[a-z0-9_-]+$/.test(value)) return "Username chỉ chứa a-z, 0-9, _, -";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "username") {
      const lowerValue = value.toLowerCase();
      setForm({ ...form, [name]: lowerValue });
      if (usernameError) setUsernameError("");
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    if (isLogin) {
      dispatch(login({ email: form.email, password: form.password }));
    } else {
      const usernameValidation = validateUsername(form.username);
      if (usernameValidation) {
        setUsernameError(usernameValidation);
        return;
      }
      const payload = {
        displayName: form.displayName,
        email: form.email,
        password: form.password,
      };
      const trimmedUsername = form.username.trim();
      if (trimmedUsername) payload.username = trimmedUsername;
      dispatch(register(payload));
    }
  };

  return (
    <div className="login-scroll relative h-screen overflow-y-auto bg-linear-to-br from-white via-indigo-100 to-blue-200 text-slate-900 animate-gradient-shift">
      <section className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-20 -left-20 w-[520px] h-[520px] rounded-full blur-[120px] opacity-40 animate-float-slow"
            style={{ background: "radial-gradient(circle at center, #8b5cf6 0%, transparent 70%)" }}
          />
          <div
            className="absolute top-1/3 -right-20 w-[420px] h-[420px] rounded-full blur-[100px] opacity-40 animate-float"
            style={{ background: "radial-gradient(circle at center, #3b82f6 0%, transparent 70%)" }}
          />
          <div
            className="absolute bottom-10 left-1/4 w-[320px] h-[320px] rounded-full blur-[90px] opacity-30 animate-float-delayed"
            style={{ background: "radial-gradient(circle at center, #10b981 0%, transparent 70%)" }}
          />
          <div className="absolute top-1/4 left-1/3 w-64 h-64 border border-indigo-300/30 rounded-full animate-spin-slow" />
          <div
            className="absolute bottom-1/4 right-1/3 w-48 h-48 border border-blue-300/30 rounded-full animate-spin-slow"
            style={{ animationDirection: "reverse" }}
          />
        </div>

        <div className="absolute top-8 left-8 md:top-12 md:left-12 flex items-center gap-3 z-20">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
            V
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800 tracking-tight">VinClassroom</div>
            <div className="text-xs font-semibold text-slate-500">AI TA Copilot</div>
          </div>
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-28 md:px-16 lg:px-24">
          <div className="hidden lg:flex flex-col justify-center w-1/2 pr-12 xl:pr-20">
            <h1 className="text-5xl xl:text-6xl font-extrabold text-slate-900 leading-[1.08] mb-6">
              Catch silent learners{" "}
              <span className="bg-clip-text text-transparent bg-linear-to-r from-indigo-600 to-blue-500">
                before they leave.
              </span>
            </h1>
            <p className="text-lg text-slate-600 mb-12 max-w-md leading-relaxed">
              Gom attendance, quiz, recap và chat activity thành một queue can thiệp sớm cho TA.
            </p>

            <div className="relative h-56 w-full max-w-md">
              <div
                className="absolute top-0 left-0 flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/50 shadow-lg backdrop-blur-md bg-white/70 animate-float"
                style={{ animationDuration: "7s" }}
              >
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-indigo-400 to-blue-400 flex items-center justify-center text-white">
                  <FiMessageCircle size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Risk reason</p>
                  <p className="text-sm font-medium text-slate-800">Quiz giảm + vắng học</p>
                </div>
              </div>

              <div
                className="absolute top-20 left-36 flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/50 shadow-lg backdrop-blur-md bg-white/70 animate-float-delayed"
                style={{ animationDuration: "8s" }}
              >
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-cyan-400 to-blue-400 flex items-center justify-center text-white">
                  <FiBookOpen size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Recap & quiz</p>
                  <p className="text-sm font-medium text-slate-800">Signals in one timeline</p>
                </div>
              </div>

              <div
                className="absolute bottom-4 left-10 flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/50 shadow-lg backdrop-blur-md bg-white/70 animate-float-slow"
                style={{ animationDuration: "9s" }}
              >
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-emerald-400 to-indigo-400 flex items-center justify-center text-white">
                  <FiZap size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Suggested action</p>
                  <p className="text-sm font-medium text-slate-800">Follow up trong 24h</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md lg:w-1/2 lg:max-w-lg">
            <div className="backdrop-blur-xl bg-white/62 border border-white/55 rounded-3xl p-8 md:p-10 transition-all shadow-[0_25px_60px_-12px_rgba(99,102,241,0.25)]">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  {isLogin ? "Welcome back" : "Create account"}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {isLogin ? "Continue to your TA workspace" : "Start your VinClassroom workspace"}
                </p>
              </div>

              <div className="relative flex mb-6 bg-slate-100/80 rounded-xl p-1">
                <div
                  className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm transition-all duration-300 ease-out"
                  style={{ width: "calc(50% - 4px)", left: isLogin ? "4px" : "calc(50%)" }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    dispatch(clearError());
                  }}
                  className={`relative z-10 flex-1 py-2 text-sm font-semibold rounded-lg transition-colors duration-300 ${
                    isLogin ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    dispatch(clearError());
                  }}
                  className={`relative z-10 flex-1 py-2 text-sm font-semibold rounded-lg transition-colors duration-300 ${
                    !isLogin ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Đăng ký
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <>
                    <div className="group">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Họ và tên</label>
                      <div className="relative">
                        <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500" size={18} />
                        <input name="displayName" type="text" required={!isLogin} value={form.displayName} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-slate-800 text-sm outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/50 focus:bg-white placeholder:text-slate-400" placeholder="Nguyễn Văn A" />
                      </div>
                    </div>
                    <div className="group">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Username</label>
                      <div className="relative">
                        <FiAtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500" size={18} />
                        <input name="username" type="text" value={form.username} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-slate-800 text-sm outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/50 focus:bg-white placeholder:text-slate-400" placeholder="nguyenvana (tùy chọn)" />
                      </div>
                      {usernameError && <p className="text-xs text-red-500 mt-1 ml-1">{usernameError}</p>}
                    </div>
                  </>
                )}

                <div className="group">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Email</label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500" size={18} />
                    <input name="email" type="email" required value={form.email} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-slate-800 text-sm outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/50 focus:bg-white placeholder:text-slate-400" placeholder="demo@vinclassroom.edu.vn" />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Mật khẩu</label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500" size={18} />
                    <input name="password" type={showPassword ? "text" : "password"} required minLength={6} value={form.password} onChange={handleChange} className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-slate-800 text-sm outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/50 focus:bg-white placeholder:text-slate-400" placeholder="••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>

                {isLogin && (
                  <div className="flex justify-end">
                    <button type="button" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">Quên mật khẩu?</button>
                  </div>
                )}

                {error && <div className="text-sm text-red-500 bg-red-50/80 border border-red-100 p-3 rounded-xl text-center">{error}</div>}

                <button type="submit" disabled={loading} className="group relative w-full py-2.5 rounded-xl text-white font-semibold text-sm shadow-lg bg-linear-to-r from-indigo-500 to-blue-500 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100">
                  {loading && <FiLoader className="animate-spin" size={18} />}
                  <span>{isLogin ? "Đăng nhập" : "Tạo tài khoản"}</span>
                  {!loading && <FiArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />}
                </button>
              </form>

              {!isLogin && (
                <div className="mt-5 text-center">
                  <p className="text-xs text-slate-400">
                    Đã có tài khoản?{" "}
                    <button type="button" onClick={() => { setIsLogin(true); dispatch(clearError()); }} className="font-medium text-indigo-500 hover:text-indigo-600">
                      Đăng nhập
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-white/88 backdrop-blur border-t border-white/70">
        <div className="flex min-h-screen w-full flex-col justify-center px-6 py-20 md:px-16 lg:px-24">
          <div className="mb-10 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">How it works</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">A focused workflow for TA retention.</h2>
          </div>
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="grid gap-4">
              {[
                ["Signals", "Attendance, quiz, recap, deadline và chat activity.", FiActivity],
                ["Risk", "Silence + decline, không cảnh báo chỉ vì học viên im lặng.", FiBarChart2],
                ["Intervention", "TA duyệt follow-up và ghi lại outcome sau can thiệp.", FiCheckCircle],
              ].map(([title, desc, Icon]) => (
              <div key={title} className="login-reveal-item rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                    <Icon size={18} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
                </div>
              ))}
            </div>
            <SectionIllustration variant="workflow" />
          </div>
        </div>
      </section>

      <section className="relative bg-linear-to-br from-indigo-50 via-white to-blue-50 text-slate-950">
        <div className="grid min-h-screen w-full items-center gap-10 px-6 py-20 md:grid-cols-[0.9fr_1.1fr] md:px-16 lg:px-24">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">The problem</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight">Silent learners are easy to miss.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Khi lớp có 50+ học viên, TA thường nhìn thấy rủi ro quá muộn: vắng học,
              quiz giảm, không đọc recap, hoặc chậm deadline.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <SectionIllustration variant="radar" compact />
            </div>
            {[
              ["5-7 days", "Too late to notice risk manually"],
              ["50+ learners", "Hard to scan across channels"],
              ["Many signals", "Attendance, quiz, recap, chat"],
              ["One TA queue", "Ranked by what needs action"],
            ].map(([value, label]) => (
              <div key={value} className="login-reveal-item rounded-2xl border border-indigo-100 bg-white/78 p-5 shadow-sm backdrop-blur">
                <div className="text-2xl font-extrabold text-indigo-700">{value}</div>
                <div className="mt-2 text-sm text-slate-600">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-[#f8f9fb]">
        <div className="flex min-h-screen w-full flex-col justify-center px-6 py-20 md:px-16 lg:px-24">
          <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Pilot design</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">Measure intervention speed before selling outcomes.</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
                The product is designed for a 4-8 week pilot where a center compares baseline,
                follow-up speed, retention proxy, and intervention outcomes.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionIllustration variant="timeline" compact />
              {[
                ["Baseline", "Month-1 churn / week-4 retention"],
                ["Target", "50% faster time-to-intervention"],
                ["Outcome", "Reply, recap read, quiz attempt, return to class"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-0">
                  <span className="text-sm font-bold text-slate-900">{label}</span>
                  <span className="text-right text-sm text-slate-500">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-white">
        <div className="flex min-h-screen w-full flex-col justify-center px-6 py-20 md:px-16 lg:px-24">
          <div className="rounded-[28px] bg-linear-to-br from-indigo-600 to-blue-600 p-8 text-white shadow-[0_28px_80px_-36px_rgba(79,70,229,0.7)] md:p-10">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-100">Design partner ready</p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight">Run the workflow on 2-3 real classes.</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-indigo-50">
                  Keep raw data, compare baseline, and decide whether faster TA intervention creates measurable value.
                </p>
              </div>
              <div className="min-w-[220px]">
                <SectionIllustration variant="cta" compact />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative border-t border-slate-200 bg-white">
        <div className="flex w-full flex-col gap-3 px-6 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between md:px-16 lg:px-24">
          <div className="font-semibold">VinClassroom AI TA Copilot</div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <span>Early-warning dashboard</span>
            <span>TA-controlled intervention</span>
            <span>Retention pilot workflow</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionIllustration({ variant, compact = false }) {
  const height = compact ? "h-44" : "h-[360px]";

  if (variant === "workflow") {
    return (
      <div className={`relative overflow-hidden rounded-[28px] border border-indigo-100 bg-linear-to-br from-indigo-50 via-white to-blue-50 p-6 shadow-sm ${height}`}>
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-indigo-300/30 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-emerald-300/25 blur-3xl" />
        <svg className="relative h-full w-full" viewBox="0 0 560 320" role="img" aria-label="Workflow illustration">
          <path d="M92 160H462" stroke="#c7d2fe" strokeWidth="4" strokeDasharray="10 12" />
          {[
            [96, 160, "#6366f1", "Signals"],
            [280, 160, "#3b82f6", "Risk"],
            [464, 160, "#10b981", "Action"],
          ].map(([x, y, color, label]) => (
            <g key={label}>
              <circle cx={x} cy={y} r="54" fill={color} opacity="0.14" />
              <circle cx={x} cy={y} r="34" fill={color} />
              <rect x={x - 48} y={y + 58} width="96" height="28" rx="14" fill="#ffffff" />
              <text x={x} y={y + 77} textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e293b">{label}</text>
            </g>
          ))}
          <rect x="150" y="38" width="260" height="54" rx="18" fill="#ffffff" stroke="#dbeafe" />
          <text x="280" y="70" textAnchor="middle" fontSize="14" fontWeight="800" fill="#3730a3">TA reviews before sending</text>
          <rect x="174" y="236" width="212" height="42" rx="16" fill="#eef2ff" />
          <text x="280" y="262" textAnchor="middle" fontSize="13" fontWeight="700" fill="#4f46e5">Outcome loop</text>
        </svg>
      </div>
    );
  }

  if (variant === "radar") {
    return (
      <div className={`relative overflow-hidden rounded-2xl border border-indigo-100 bg-white/80 p-4 shadow-sm ${height}`}>
        <svg className="h-full w-full" viewBox="0 0 520 210" role="img" aria-label="Risk radar illustration">
          <circle cx="150" cy="104" r="74" fill="none" stroke="#dbeafe" strokeWidth="2" />
          <circle cx="150" cy="104" r="48" fill="none" stroke="#c7d2fe" strokeWidth="2" />
          <circle cx="150" cy="104" r="20" fill="#6366f1" opacity="0.18" />
          <path d="M150 104L212 62" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
          <circle cx="212" cy="62" r="9" fill="#ef4444" />
          <circle cx="93" cy="136" r="7" fill="#f59e0b" />
          <circle cx="172" cy="159" r="7" fill="#10b981" />
          <rect x="278" y="42" width="180" height="30" rx="12" fill="#fee2e2" />
          <rect x="278" y="90" width="148" height="30" rx="12" fill="#fef3c7" />
          <rect x="278" y="138" width="170" height="30" rx="12" fill="#dcfce7" />
          <text x="296" y="62" fontSize="12" fontWeight="800" fill="#991b1b">absence + score drop</text>
          <text x="296" y="110" fontSize="12" fontWeight="800" fill="#92400e">deadline drift</text>
          <text x="296" y="158" fontSize="12" fontWeight="800" fill="#047857">quiet but healthy</text>
        </svg>
      </div>
    );
  }

  if (variant === "timeline") {
    return (
      <div className={`mb-4 overflow-hidden rounded-2xl bg-linear-to-br from-indigo-50 to-blue-50 p-4 ${height}`}>
        <svg className="h-full w-full" viewBox="0 0 520 190" role="img" aria-label="Pilot timeline illustration">
          <path d="M64 98H456" stroke="#c7d2fe" strokeWidth="5" strokeLinecap="round" />
          {[
            [72, "Baseline"],
            [200, "Alert"],
            [328, "Follow-up"],
            [456, "Outcome"],
          ].map(([x, label], index) => (
            <g key={label}>
              <circle cx={x} cy="98" r="22" fill={index === 3 ? "#10b981" : "#6366f1"} />
              <text x={x} y="104" textAnchor="middle" fontSize="14" fontWeight="900" fill="#fff">{index + 1}</text>
              <text x={x} y="144" textAnchor="middle" fontSize="12" fontWeight="800" fill="#334155">{label}</text>
            </g>
          ))}
        </svg>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-2xl bg-white/15 p-4 backdrop-blur ${height}`}>
      <svg className="h-full w-full" viewBox="0 0 260 170" role="img" aria-label="Pilot card illustration">
        <rect x="18" y="22" width="224" height="126" rx="24" fill="#ffffff" opacity="0.18" />
        <rect x="42" y="48" width="176" height="18" rx="9" fill="#ffffff" opacity="0.72" />
        <rect x="42" y="82" width="118" height="14" rx="7" fill="#ffffff" opacity="0.45" />
        <rect x="42" y="112" width="152" height="14" rx="7" fill="#ffffff" opacity="0.45" />
        <circle cx="204" cy="112" r="22" fill="#69f6b8" />
        <path d="M193 112l8 8 16-22" fill="none" stroke="#064e3b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="mt-3 text-center text-sm font-bold text-white">4-8 week pilot</div>
    </div>
  );
}

export default LoginPage;
