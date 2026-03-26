import { useTheme } from "../context/ThemeProvider";

const ThemeToggle = () => {
  const { toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-3 bg-surface border border-border rounded-xl shadow-xl hover:scale-110 transition"
    >
      🌓
    </button>
  );
};

export default ThemeToggle;