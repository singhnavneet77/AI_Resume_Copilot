import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans" 
});

export const metadata = {
  title: "AI Resume Copilot - One Profile. Unlimited Job-Specific Resumes.",
  description: "An AI-powered ATS Resume Optimization Platform. Tailor your resume using local Qdrant RAG semantic search and LLM customization.",
  authors: [{ name: "AI Career Systems" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
      </head>
      <body className={`${inter.className} font-sans antialiased text-slate-100 bg-[#0b0f19]`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
