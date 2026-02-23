"use client";

import { useEffect, useRef, useState } from "react";
import Prism from "prismjs";

if (typeof window !== "undefined") {
  try {
    require("prismjs/components/prism-markup");
    require("prismjs/components/prism-javascript");
    require("prismjs/components/prism-jsx");
    require("prismjs/components/prism-tsx");
    require("prismjs/components/prism-typescript");
    require("prismjs/components/prism-json");
    require("prismjs/components/prism-bash");
    require("prismjs/components/prism-css");
  } catch (e) {}
}
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  code: string;
  language?: string;
  showCopyButton?: boolean;
  onCopy?: () => void;
  className?: string;
}

export function CodeBlock({
  code,
  language = "markup",
  showCopyButton = true,
  onCopy,
  className = "",
}: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (codeRef.current && typeof window !== "undefined") {
      const timer = setTimeout(() => {
        try {
          Prism.highlightElement(codeRef.current!);
        } catch (error) {}
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [code, language]);

  const handleCopy = async () => {
    if (code) {
      try {
        await navigator.clipboard.writeText(code);
        onCopy?.();
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        setCopied(true);
        copyTimeoutRef.current = setTimeout(() => {
          setCopied(false);
          copyTimeoutRef.current = null;
        }, 2000);
      } catch (err) {}
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-neutral min-w-0 max-w-full ${className}`}
    >
      <pre
        ref={preRef}
        className="text-xs p-4 md:p-5 pr-12 min-w-0 max-w-full"
        style={{
          margin: 0,
          background: "transparent",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          overflowWrap: "break-word",
        }}
      >
        <code
          ref={codeRef}
          className={`language-${language}`}
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            overflowWrap: "break-word",
          }}
        >
          {code}
        </code>
      </pre>
      {showCopyButton && (
        <div className="absolute right-2 top-2 z-50">
          <Button
            variant="ghost"
            size="sm"
            className="btn-square cursor-pointer"
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy to clipboard"}
          >
            {copied ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-5 text-green-600"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-5 opacity-80 transition-opacity duration-200 hover:opacity-100"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
                />
              </svg>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
