import * as React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelClassName?: string;
  error?: string;
}

export function Input({ label, labelClassName, error, className, id, ...props }: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className={`text-sm font-medium ${labelClassName ?? "text-zinc-200"}`}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          "h-10 rounded-md border border-zinc-700 px-3 text-sm transition-[border-color,box-shadow]",
          "focus:outline-none focus:ring-1",
          error ? "border-red-500" : undefined,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
