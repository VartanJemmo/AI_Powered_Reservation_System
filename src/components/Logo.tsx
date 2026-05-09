import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export const Logo = ({ className = "" }: { className?: string }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const home = user?.role === "admin" ? "/admin" : "/";
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname !== home) {
      navigate(home);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  return (
    <a
      href="/"
      onClick={onClick}
      aria-label="Back to top"
      className={`flex items-center gap-2 hover:opacity-80 transition-opacity ${className}`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 2 L14.6 9 L22 9.6 L16.3 14.4 L18.2 22 L12 17.8 L5.8 22 L7.7 14.4 L2 9.6 L9.4 9 Z"
          stroke="hsl(var(--primary))" strokeWidth="1.2" fill="hsl(var(--primary) / 0.12)" />
      </svg>
      <span className="font-display text-xl tracking-wide">Mayrig</span>
    </a>
  );
};
