function AppLoadingScreen() {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-linear-to-br from-white via-indigo-100 to-blue-200">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );
}

export default AppLoadingScreen;
