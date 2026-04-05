import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import { Sun, Moon, Search, FileText, BarChart3, RefreshCw, CheckCircle2, Zap, Download, ShieldCheck, Sparkles } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "VLOOKUP",
    description: "Match and merge data across two spreadsheets instantly — just like Excel's VLOOKUP but smarter with AI-powered column suggestions.",
  },
  {
    icon: FileText,
    title: "Text & Clean",
    description: "Strip non-printable characters, trim whitespace, convert case, and format numbers or dates in bulk across any column.",
  },
  {
    icon: RefreshCw,
    title: "Search & Replace",
    description: "Find and substitute text, perform position-based replacements, and remove leading zeros across entire columns.",
  },
  {
    icon: BarChart3,
    title: "Data Audit",
    description: "Identify duplicates, count value frequencies, and extract unique rows to audit and clean your datasets.",
  },
];

const benefits = [
  { icon: Zap, text: "Unlimited lookups & data operations" },
  { icon: Download, text: "Export results as CSV anytime" },
  { icon: Sparkles, text: "AI-powered column suggestions" },
  { icon: ShieldCheck, text: "Your data stays in your browser — 100% private" },
];

const Landing = () => {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Nav */}
      <nav className="container mx-auto px-4 py-4 max-w-7xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo_3.png" alt="VLookup Cloud" width={40} height={40} className="rounded-xl" />
          <span className="font-bold text-lg text-foreground hidden sm:inline">VLookup Cloud</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-muted-foreground hover:text-foreground">
            Sign In
          </Button>
          <Button size="sm" onClick={() => navigate("/auth")}>
            Create Free Account
          </Button>
          <button
            onClick={toggle}
            className="p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-16 pb-20 max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Sparkles className="h-4 w-4" /> 100% Free — No Credit Card Required
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 leading-tight">
          AI Data Lookup &{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Smart Spreadsheet Assistant
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          AI-powered data lookup tool for fast, accurate spreadsheet searches, VLOOKUP automation, and smart data insights in seconds.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" onClick={() => navigate("/auth")} className="text-base px-8 py-6 shadow-lg">
            Get Started Free
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-base px-8 py-6">
            Sign In
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 pb-20 max-w-6xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-4">
          Powerful Data Tools, Zero Setup
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          Everything you need to look up, clean, transform, and audit your spreadsheet data — right in the browser.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <Card key={f.title} className="p-6 hover:shadow-md transition-shadow border-border/60">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 pb-20 max-w-4xl">
        <Card className="p-8 sm:p-12 bg-primary/5 border-primary/20">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-8">
            Why Create a Free Account?
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {benefits.map((b) => (
              <div key={b.text} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <b.icon className="h-4 w-4 text-accent" />
                </div>
                <span className="text-foreground font-medium">{b.text}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-base px-10 py-6 shadow-lg">
              Create Your Free Account
            </Button>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="pb-8 text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Designed By Frank Bazuaye | Powered By LiveGig Ltd
        </p>
        <a href="/privacy" className="text-xs text-primary hover:underline">
          Privacy Policy
        </a>
      </footer>
    </div>
  );
};

export default Landing;
