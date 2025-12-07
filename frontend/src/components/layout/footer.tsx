import Link from "next/link";
import { Sparkles, Github, Twitter, MessageCircle, Mail } from "lucide-react";

const footerLinks = {
  Product: [
    { name: "Marketplace", href: "/marketplace" },
    { name: "Launchpad", href: "/launchpad" },
    { name: "Governance", href: "/governance" },
    { name: "Documentation", href: "/docs" },
  ],
  Company: [
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Careers", href: "/careers" },
    { name: "Contact", href: "/contact" },
  ],
  Legal: [
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
    { name: "Cookies", href: "/cookies" },
  ],
};

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.08] bg-background">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-qubic/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="container relative mx-auto px-4 py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-qubic to-emerald-500 flex items-center justify-center shadow-lg shadow-qubic/20 group-hover:shadow-qubic/40 transition-shadow">
                <Sparkles className="h-5 w-5 text-black" />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
              </div>
              <span className="text-xl font-bold">
                <span className="text-white">Veri</span>
                <span className="text-gradient">Assets</span>
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-sm text-muted-foreground leading-relaxed">
              AI-Verified Real-World Asset Marketplace & Launchpad. Tokenize, verify, 
              and trade RWAs on the Qubic network with community governance.
            </p>
            <div className="mt-6 flex gap-3">
              {[
                { icon: Github, href: "https://github.com", label: "GitHub" },
                { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
                { icon: MessageCircle, href: "https://discord.com", label: "Discord" },
                { icon: Mail, href: "mailto:hello@veriassets.com", label: "Email" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-white mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-qubic transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} VeriAssets. Built for Qubic Hackathon 2025.
          </p>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Powered by</span>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <span className="font-semibold text-qubic">Qubic</span>
              <span className="text-muted-foreground">×</span>
              <span className="font-semibold text-veri">Nostromo</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
