export default function Toolbar({ theme }: { theme: "dark" | "light" }) {
  return (
    <div className={`h-[78px] flex items-center px-4 border-b
      ${theme === "dark" ? "bg-slate-800 text-white" : "bg-white text-gray-800"}
    `}>
      <strong className="header-title">Free Compiler</strong>
    </div>
  );
}
