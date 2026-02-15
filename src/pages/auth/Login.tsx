import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(email, password);

    if (success) {
      toast({
        title: "Welcome back",
        description: "You have successfully logged in.",
      });
      navigate("/");
    } else {
      toast({
        title: "Authentication failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Creative background elements */}
      <div className="absolute inset-0">
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Geometric shapes */}
        <div className="absolute top-20 right-20 w-32 h-32 border border-primary/10 rotate-45 rounded-lg" />
        <div className="absolute bottom-32 left-16 w-24 h-24 border border-primary/10 rotate-12 rounded-full" />
        <div className="absolute top-1/2 left-10 w-16 h-16 bg-primary/5 rotate-45 rounded" />
      </div>

      {/* Main content with creative layout */}
      <div className="relative z-10 w-full max-w-[380px] px-6">
        <div className="relative">
          {/* Accent line */}
          <div className="absolute -left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/50 to-transparent rounded-full" />
          
          <div className="space-y-8 pl-6">
            {/* Logo section with creative positioning */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-primary rounded-full" />
                <div>
                  <img 
                    src="https://res.cloudinary.com/giftguy/image/upload/v1765262899/glitbase_jlcbgl.png" 
                    alt="Glitbase" 
                    className="w-32 h-auto" 
                  />
                </div>
              </div>
              <div className="space-y-1 pl-4">
                <h1 className="text-4xl font-bold text-foreground tracking-tight">
                  Welcome back
                </h1>
                <p className="text-muted-foreground text-sm">
                  Sign in to your admin dashboard
                </p>
              </div>
            </div>

            {/* Form with creative styling */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email Address
                </Label>
                <div className="relative group">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="h-12 pl-4 border-2 transition-all group-focus-within:border-primary/50"
                  />
                  <div className="absolute inset-0 -z-10 bg-primary/5 rounded-md blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Password
                </Label>
                <div className="relative group">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-12 pl-4 pr-12 border-2 transition-all group-focus-within:border-primary/50"
                  />
                  <div className="absolute inset-0 -z-10 bg-primary/5 rounded-md blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted/50"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold relative overflow-hidden group" 
                  disabled={isLoading}
                >
                  <span className="relative z-10">{isLoading ? "Signing in..." : "Sign in"}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
