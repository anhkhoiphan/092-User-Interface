import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FiMail,
  FiLock,
  FiUser,
  FiEye,
  FiEyeOff,
  FiLoader,
  FiArrowRight,
  FiMessageCircle,
  FiZap,
  FiBookOpen,
} from "react-icons/fi";
import { login, register, clearError } from "../store/slices/authSlice";

function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function MicrosoftIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 21 21" fill="currentColor">
      <path d="M0 0h10v10H0z" />
      <path d="M11 0h10v10H11z" />
      <path d="M0 11h10v10H0z" />
      <path d="M11 11h10v10H11z" />
    </svg>
  );
}

function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
  });
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    if (isLogin) {
      dispatch(login({ email: form.email, password: form.password }));
    } else {
      dispatch(
        register({
          displayName: form.displayName,
          email: form.email,
          password: form.password,
        }),
      );
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-linear-to-br from-white via-indigo-100 to-blue-200 animate-gradient-shift">
      {/* Floating background shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Large purple blob */}
        <div
          className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full blur-[120px] opacity-40 animate-float-slow"
          style={{
            background:
              "radial-gradient(circle at center, #8b5cf6 0%, transparent 70%)",
          }}
        />
        {/* Blue blob */}
        <div
          className="absolute top-1/3 -right-20 w-[400px] h-[400px] rounded-full blur-[100px] opacity-40 animate-float"
          style={{
            background:
              "radial-gradient(circle at center, #3b82f6 0%, transparent 70%)",
          }}
        />
        {/* Cyan accent blob */}
        <div
          className="absolute bottom-10 left-1/4 w-[300px] h-[300px] rounded-full blur-[90px] opacity-30 animate-float-delayed"
          style={{
            background:
              "radial-gradient(circle at center, #06b6d4 0%, transparent 70%)",
          }}
        />
        {/* Decorative ring */}
        <div
          className="absolute top-1/4 left-1/3 w-64 h-64 border border-indigo-300/30 rounded-full animate-spin-slow"
          style={{ transformOrigin: "center" }}
        />
        <div
          className="absolute bottom-1/4 right-1/3 w-48 h-48 border border-blue-300/30 rounded-full animate-spin-slow"
          style={{ animationDirection: "reverse" }}
        />
      </div>

      {/* Top-left Branding */}
      <div className="absolute top-8 left-8 md:top-12 md:left-12 flex items-center gap-3 z-20">
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
          V
        </div>
        <span className="text-xl font-bold text-slate-800 tracking-tight">
          VinClassroom
        </span>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full h-full flex items-center justify-center px-6 md:px-16 lg:px-24">
        {/* Left Hero Section */}
        <div className="hidden lg:flex flex-col justify-center w-1/2 pr-12 xl:pr-20">
          <h1 className="text-5xl xl:text-6xl font-extrabold text-slate-900 leading-[1.1] mb-6">
            A smarter way to{" "}
            <span className="bg-clip-text text-transparent bg-linear-to-r from-indigo-600 to-blue-500">
              learn, connect,
            </span>{" "}
            and grow
          </h1>
          <p className="text-lg text-slate-600 mb-12 max-w-md leading-relaxed">
            Nền tảng học tập dành cho sinh viên VinUniversity
          </p>

          {/* Floating feature cards */}
          <div className="relative h-56 w-full max-w-md">
            {/* AI Chat card */}
            <div
              className="absolute top-0 left-0 flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/50 shadow-lg backdrop-blur-md bg-white/70 animate-float"
              style={{ animationDuration: "7s" }}
            >
              <div className="w-9 h-9 rounded-full bg-linear-to-br from-indigo-400 to-blue-400 flex items-center justify-center text-white">
                <FiMessageCircle size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Trợ lý AI</p>
                <p className="text-sm font-medium text-slate-800">
                  Đã giải thích bài tập cho bạn
                </p>
              </div>
            </div>

            {/* Course card */}
            <div
              className="absolute top-20 left-36 flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/50 shadow-lg backdrop-blur-md bg-white/70 animate-float-delayed"
              style={{ animationDuration: "8s" }}
            >
              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-cyan-400 to-blue-400 flex items-center justify-center text-white">
                <FiBookOpen size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Khóa học</p>
                <p className="text-sm font-medium text-slate-800">
                  Toán cao cấp - Bài giảng mới
                </p>
              </div>
            </div>

            {/* Hint card */}
            <div
              className="absolute bottom-4 left-10 flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/50 shadow-lg backdrop-blur-md bg-white/70 animate-float-slow"
              style={{ animationDuration: "9s" }}
            >
              <div className="w-9 h-9 rounded-full bg-linear-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white">
                <FiZap size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Gợi ý thông minh</p>
                <p className="text-sm font-medium text-slate-800">
                  Bài tập tuần 3 đang chờ bạn
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Glassmorphism Login Card */}
        <div className="w-full max-w-md lg:w-1/2 lg:max-w-lg">
          <div className="backdrop-blur-xl bg-white/60 border border-white/50 rounded-3xl p-8 md:p-10 transition-all shadow-[0_25px_60px_-12px_rgba(99,102,241,0.25)]">
            {/* Greeting */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                {isLogin ? "Welcome back" : "Create account"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {isLogin
                  ? "Continue your learning journey"
                  : "Start your journey with VinClassroom"}
              </p>
            </div>

            {/* Tabs with animated indicator */}
            <div className="relative flex mb-6 bg-slate-100/80 rounded-xl p-1">
              <div
                className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm transition-all duration-300 ease-out"
                style={{
                  width: "calc(50% - 4px)",
                  left: isLogin ? "4px" : "calc(50%)",
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  dispatch(clearError());
                }}
                className={`relative z-10 flex-1 py-2 text-sm font-semibold rounded-lg transition-colors duration-300 ${
                  isLogin
                    ? "text-indigo-600"
                    : "text-slate-500 hover:text-slate-700"
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
                  !isLogin
                    ? "text-indigo-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Đăng ký
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="group">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">
                    Họ và tên
                  </label>
                  <div className="relative">
                    <FiUser
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500"
                      size={18}
                    />
                    <input
                      name="displayName"
                      type="text"
                      required={!isLogin}
                      value={form.displayName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-slate-800 text-sm outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/50 focus:bg-white placeholder:text-slate-400"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                </div>
              )}

              <div className="group">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">
                  Email
                </label>
                <div className="relative">
                  <FiMail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500"
                    size={18}
                  />
                  <input
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-slate-800 text-sm outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/50 focus:bg-white placeholder:text-slate-400"
                    placeholder="demo@vinclassroom.edu.vn"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <FiLock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500"
                    size={18}
                  />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={form.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-slate-800 text-sm outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/50 focus:bg-white placeholder:text-slate-400"
                    placeholder="••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <FiEyeOff size={18} />
                    ) : (
                      <FiEye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              )}

              {error && (
                <div className="text-sm text-red-500 bg-red-50/80 border border-red-100 p-3 rounded-xl text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full py-2.5 rounded-xl text-white font-semibold text-sm shadow-lg bg-linear-to-r from-indigo-500 to-blue-500 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading && <FiLoader className="animate-spin" size={18} />}
                <span>{isLogin ? "Đăng nhập" : "Tạo tài khoản"}</span>
                {!loading && (
                  <FiArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                )}
              </button>
            </form>

            {/* Social login */}
            <div className="mt-6">
              <div className="relative flex py-2 items-center">
                <div className="grow border-t border-slate-200/80" />
                <span className="shrink-0 mx-4 text-slate-400 text-xs font-medium">
                  Hoặc tiếp tục với
                </span>
                <div className="grow border-t border-slate-200/80" />
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-slate-700 text-sm font-medium hover:bg-white hover:border-slate-300  transition-all"
                >
                  <GoogleIcon className="w-4 h-4" />
                  Google
                </button>
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-slate-700 text-sm font-medium hover:bg-white hover:border-slate-300 transition-all"
                >
                  <MicrosoftIcon className="w-4 h-4" />
                  Microsoft
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="mt-5 text-center">
                <p className="text-xs text-slate-400">
                  Đã có tài khoản?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      dispatch(clearError());
                    }}
                    className="font-medium text-indigo-500 hover:text-indigo-600"
                  >
                    Đăng nhập
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
