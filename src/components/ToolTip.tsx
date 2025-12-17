import { useState } from "react";
import InfoIcon from "../svg/InfoIcon";

function InfoTooltip({ text, theme }: { text: string, theme: "dark" | "light" }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative inline-flex items-center">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
                className="text-slate-400"
            >
                <InfoIcon />
            </button>

            {open && (
                <div
                    className={`
                        absolute z-50
                        left-full top-1/2 -translate-y-1/2 ml-2 mt-1
                        whitespace-nowrap rounded px-3 py-1 text-xs shadow-lg
                        before:absolute before:right-full before:top-1/2 before:-translate-y-1/2
                        before:border-4 before:border-transparent 
                        ${theme === "dark"
                            ? "bg-white text-gray-800 border before:border-r-white"
                            : "bg-black text-white before:border-r-black"}
                         `}
                >
                    {text}
                </div>
            )}
        </div>
    );
}

export default InfoTooltip;
