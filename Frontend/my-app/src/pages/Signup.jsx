import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion"; 
import Alert from "../components/Alert";
import { registerUser } from "../api/auth.api";
import useAuth from "../utils/useAuth";
import ExamCard from "../assets/ExamCard.png";

function Signup() {
  const [alertMsg, setAlertMsg] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setAlertMsg("");

    try {
      const data = await registerUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      if (!data?.user || !data?.token) {
        throw new Error(data.message || "Signup failed");
      }

      login(data.user, data.token);
      navigate("/dashboard"); // Redirecting to dashboard as per standard flow
    } catch (err) {
      setAlertMsg(err.message || "Signup failed");
    }
  };

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background dark:bg-background relative overflow-hidden p-4 sm:p-6 transition-colors duration-500">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-primary/10 blur-[100px] rounded-full pointer-events-none opacity-50" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-secondary/10 blur-[100px] rounded-full pointer-events-none opacity-50" />

      <Alert msg={alertMsg} shut={() => setAlertMsg("")} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-card flex w-full max-w-[1000px] min-h-0 md:min-h-[650px] overflow-hidden shadow-2xl relative z-10 md:rounded-[2rem] rounded-2xl"
      >
        {/* --- LEFT BRANDING PANE --- */}
        <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-10 bg-primary/5 dark:bg-primary/10 relative border-r border-border/50">
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="w-full max-w-[300px] mb-8"
          >
            <img
              src={ExamCard}
              alt="Quant Pilot Illustration"
              className="w-full h-auto max-h-[300px] object-contain drop-shadow-xl"
            />
          </motion.div>

          <div className="text-center space-y-3 max-w-[85%]">
            <h2 className="text-3xl font-heading font-bold text-foreground tracking-tight">
              Join the Hub
            </h2>
            <p className="text-foreground/50 text-sm leading-relaxed">
              Start your journey toward exam mastery. One account, total access to analytics and mocks.
            </p>
            <div className="flex gap-1.5 justify-center mt-6">
              <div className="w-1 h-1 rounded-full bg-border" />
              <div className="w-6 h-1 rounded-full bg-primary" />
              <div className="w-1 h-1 rounded-full bg-border" />
            </div>
          </div>
        </div>

        {/* --- RIGHT FORM PANE --- */}
        <div className="flex-1 flex flex-col justify-center p-8 sm:p-12 bg-surface/40 dark:bg-surface/20 backdrop-blur-xl">
          
          {/* Logo Area */}
          <div className="flex items-center gap-2.5 mb-8 self-start">
            <div className="bg-primary text-white w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shadow-lg shadow-primary/20">
              |||
            </div>
            <span className="text-lg font-heading font-bold tracking-tighter uppercase">
              Quant <span className="text-foreground/30 font-medium">Pilot</span>
            </span>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl  font-heading font-bold mb-1.5 text-foreground tracking-tight">Create Account</h3>
            {/* <p className="text-foreground/40 text-sm">Join 300k+ students practicing better.</p> */}
          </div>

          <form className="flex flex-col gap-4 w-full" onSubmit={onSubmitHandler}>
            {/* Full Name Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 ml-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={onChangeHandler}
                placeholder="Sarthak Inamdar"
                className="w-full bg-background/50 dark:bg-background/20 border border-border/60 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-foreground/20 text-sm"
                required
              />
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 ml-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={onChangeHandler}
                placeholder="pilot@quant.com"
                className="w-full bg-background/50 dark:bg-background/20 border border-border/60 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-foreground/20 text-sm"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 ml-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={onChangeHandler}
                placeholder="••••••••••••"
                className="w-full bg-background/50 dark:bg-background/20 border border-border/60 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-foreground/20 text-sm"
                required
              />
            </div>

            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit" 
              className="btn-primary py-3 text-sm font-bold shadow-lg shadow-primary/20 mt-2"
            >
              Create Account
            </motion.button>

            <div className="flex items-center gap-3 my-1">
              <div className="h-px flex-1 bg-border/40" />
              <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-foreground/20">OR</span>
              <div className="h-px flex-1 bg-border/40" />
            </div>

            <button 
              type="button" 
              className="flex items-center justify-center gap-2.5 w-full bg-surface/50 dark:bg-surface/10 border border-border/60 py-2.5 rounded-xl font-semibold hover:bg-muted/30 transition-all text-sm text-foreground"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/500px-Google_%22G%22_logo.svg.png"
                alt="Google"
                className="w-4 h-4"
              />
              Sign up with Google
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-foreground/40 font-medium">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Floating Theme Toggle */}

    </div>
  );
}

export default Signup;