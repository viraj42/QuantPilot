import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Alert from "../components/Alert";
import { loginUser } from "../api/auth.api";
import useAuth from "../utils/useAuth";
import ExamCard from "../assets/ExamCard.png";

function Login() {
const [alertMsg, setAlertMsg] = useState("");
const [formData, setFormData] = useState({ email: "", password: "" });
const navigate = useNavigate();
const { login } = useAuth();

const onSubmitHandler = async (e) => {
e.preventDefault();
setAlertMsg("");
try {
const data = await loginUser({
email: formData.email.trim(),
password: formData.password,
});
if (!data?.user || !data?.token) throw new Error(data.message || "Invalid Credentials");
login(data.user, data.token);
navigate("/dashboard");
} catch (err) {
setAlertMsg(err.message || "Login failed");
}
};

const onChangeHandler = (e) => {
const { name, value } = e.target;
setFormData((prev) => ({ ...prev, [name]: value }));
};

return ( <div className="min-h-screen w-full flex items-center justify-center bg-background dark:bg-background relative overflow-hidden p-4 sm:p-6 transition-colors duration-500">
  {/* Dynamic Background Glows */}
  <div className="absolute top-[-5%] left-[-5%] w-[28%] h-[28%] bg-primary/10 blur-[95px] rounded-full pointer-events-none opacity-50" />
  <div className="absolute bottom-[-5%] right-[-5%] w-[28%] h-[28%] bg-secondary/10 blur-[95px] rounded-full pointer-events-none opacity-50" />

  <Alert msg={alertMsg} shut={() => setAlertMsg("")} />

  <motion.div 
    initial={{ opacity: 0, scale: 0.985 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.48, ease: "easeOut" }}
    className="glass-card flex w-full max-w-[1000px] min-h-0 md:min-h-[650px] overflow-hidden shadow-2xl relative z-10 md:rounded-[1.9rem] rounded-xl"
  >
    {/* --- LEFT BRANDING PANE --- */}
    <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-9 bg-primary/5 dark:bg-primary/10 relative border-r border-border/50">
      <motion.div 
        initial={{ y: 9, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.22, duration: 0.58 }}
        className="w-full max-w-[300px] mb-7"
      >
        <img
          src={ExamCard}
          alt="Quant Pilot Illustration"
          className="w-full h-auto max-h-[300px] object-contain drop-shadow-xl"
        />
      </motion.div>

      <div className="text-center space-y-3 max-w-[85%]">
        <h2 className="text-3xl font-heading font-bold text-foreground tracking-tight">
          Quant Pilot
        </h2>
        <p className="text-foreground/50 text-sm leading-relaxed">
          Master your examinations with the precision of a pilot. Real-time analytics, mock engines, and tailored practice.
        </p>
        <div className="flex gap-1.5 justify-center mt-5">
          <div className="w-6 h-1 rounded-full bg-primary" />
          <div className="w-1 h-1 rounded-full bg-border" />
          <div className="w-1 h-1 rounded-full bg-border" />
        </div>
      </div>
    </div>

    {/* --- RIGHT FORM PANE --- */}
    <div className="flex-1 flex flex-col justify-center p-8 sm:p-11 bg-surface/40 dark:bg-surface/20 backdrop-blur-xl">
      
      {/* Logo Area */}
      <div className="flex items-center gap-2.5 mb-7 self-start">
        <div className="bg-primary text-primary-foreground w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shadow-lg shadow-primary/20">
          |||
        </div>
        <span className="text-lg font-heading font-bold tracking-tight">
          QUANT <span className="text-foreground/30 font-medium">PILOT</span>
        </span>
      </div>

      <div className="mb-7">
        <h3 className="text-2xl font-heading font-bold mb-1.5 text-foreground">Welcome Back</h3>
        <p className="text-foreground/40 text-sm">Enter your credentials to access your dashboard</p>
      </div>

      <form className="flex flex-col gap-[15px] w-full" onSubmit={onSubmitHandler}>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/40 ml-1">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onChangeHandler}
            placeholder="pilot@quant.com"
            className="w-full bg-background/50 dark:bg-background/20 border border-border/60 rounded-xl px-4 py-[11px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-foreground/20 text-sm"
            required
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center ml-1">
            <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/40">
              Password
            </label>
          </div>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={onChangeHandler}
            placeholder="••••••••••••"
            className="w-full bg-background/50 dark:bg-background/20 border border-border/60 rounded-xl px-4 py-[11px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-foreground/20 text-sm"
            required
          />
        </div>

        <motion.button 
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          type="submit" 
          className="btn-primary py-[11px] text-sm font-bold shadow-lg shadow-primary/20 mt-2"
        >
          Sign in to Account
        </motion.button>

        <div className="flex items-center gap-3 my-1">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-foreground/20">OR</span>
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
          Google Account
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-foreground/40 font-medium">
        New to Quant Pilot?{" "}
        <Link to="/signup" className="text-primary font-bold hover:underline">
          Create a free account
        </Link>
      </p>
    </div>
  </motion.div>
</div>


);
}

export default Login;
