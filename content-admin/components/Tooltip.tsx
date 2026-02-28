"use client";

import { useState, useRef } from "react";

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(true);
  };

  const hide = () => {
    timeoutRef.current = setTimeout(() => setVisible(false), 100);
  };

  return (
    <span className="relative inline-flex items-center">
      <span
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        tabIndex={0}
        className="cursor-help"
      >
        {children ?? (
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-medium text-zinc-400 hover:bg-zinc-600 hover:text-zinc-300">
            ?
          </span>
        )}
      </span>
      {visible && (
        <span className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-800 px-3 py-2 text-xs text-zinc-300 shadow-lg">
          {content}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-zinc-800" />
        </span>
      )}
    </span>
  );
}

export function InfoTooltip({ content }: { content: string }) {
  return <Tooltip content={content} />;
}
