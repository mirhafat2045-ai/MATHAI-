import React, { useMemo, useState } from 'react';
import katex from 'katex';
import { Copy, Check, Terminal } from 'lucide-react';

interface MathRendererProps {
  content: string;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to safely render KaTeX
  const renderMath = (latex: string, displayMode: boolean): string => {
    try {
      return katex.renderToString(latex.trim(), {
        displayMode,
        throwOnError: false,
        strict: false,
      });
    } catch (e) {
      console.warn('KaTeX render error:', e);
      return `<span class="text-rose-400 font-mono text-xs">[LaTeX: ${latex}]</span>`;
    }
  };

  // Process text into segments: paragraphs, headers, block math, lists, code
  const renderedElements = useMemo(() => {
    if (!content) return null;

    // Normalizing newlines
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    const processInlineMathAndText = (text: string): React.ReactNode[] => {
      // Tokenize for inline math: $...$ or \(...\)
      const parts: React.ReactNode[] = [];
      const regex = /(\$([^\$]+)\$|\\\((.+?)\\\))/g;
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(text)) !== null) {
        const matchStart = match.index;
        const mathContent = match[2] || match[3];

        // Push text preceding the math
        if (matchStart > lastIndex) {
          parts.push(
            formatTextStyles(text.substring(lastIndex, matchStart), `txt-${lastIndex}`)
          );
        }

        // Render inline KaTeX
        const mathHtml = renderMath(mathContent, false);
        parts.push(
          <span
            key={`math-${matchStart}`}
            className="inline-block px-1 align-baseline text-indigo-200"
            dangerouslySetInnerHTML={{ __html: mathHtml }}
          />
        );

        lastIndex = regex.lastIndex;
      }

      if (lastIndex < text.length) {
        parts.push(
          formatTextStyles(text.substring(lastIndex), `txt-${lastIndex}`)
        );
      }

      return parts;
    };

    // Format bold, italics, and backticks within plain text segments
    const formatTextStyles = (text: string, keyPrefix: string): React.ReactNode => {
      // Replace **bold**
      const boldSegments = text.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={keyPrefix}>
          {boldSegments.map((segment, idx) => {
            if (segment.startsWith('**') && segment.endsWith('**')) {
              const boldContent = segment.slice(2, -2);
              return (
                <strong key={`${keyPrefix}-b-${idx}`} className="font-semibold text-white">
                  {boldContent}
                </strong>
              );
            }
            // Check for `inline code`
            const codeSegments = segment.split(/(`[^`]+`)/g);
            return codeSegments.map((codeSeg, cIdx) => {
              if (codeSeg.startsWith('`') && codeSeg.endsWith('`')) {
                return (
                  <code
                    key={`${keyPrefix}-c-${idx}-${cIdx}`}
                    className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-xs border border-slate-700"
                  >
                    {codeSeg.slice(1, -1)}
                  </code>
                );
              }
              return codeSeg;
            });
          })}
        </span>
      );
    };

    while (i < lines.length) {
      const line = lines[i];

      // 1. Check for Block Math: $$ ... $$ across multiple lines or single line
      if (line.trim().startsWith('$$') || line.trim().startsWith('\\[')) {
        let blockLatex = '';
        const isSingleLine = 
          (line.trim().startsWith('$$') && line.trim().endsWith('$$') && line.trim().length > 2) ||
          (line.trim().startsWith('\\[') && line.trim().endsWith('\\]'));

        if (isSingleLine) {
          blockLatex = line.replace(/^\$\$|^\\\[/, '').replace(/\$\$$|\\\]$/, '');
          i++;
        } else {
          // Multiline block
          blockLatex = line.replace(/^\$\$|^\\\[/, '');
          i++;
          while (i < lines.length && !lines[i].includes('$$') && !lines[i].includes('\\]')) {
            blockLatex += '\n' + lines[i];
            i++;
          }
          if (i < lines.length) {
            blockLatex += '\n' + lines[i].replace(/\$\$$|\\\]$/, '');
            i++;
          }
        }

        const mathHtml = renderMath(blockLatex, true);
        elements.push(
          <div
            key={`block-math-${i}`}
            className="my-3 overflow-x-auto py-1 px-3 bg-slate-900/80 rounded-xl border border-indigo-500/20 shadow-inner group relative"
          >
            <div dangerouslySetInnerHTML={{ __html: mathHtml }} />
          </div>
        );
        continue;
      }

      // 2. Code Blocks (``` ... ```)
      if (line.trim().startsWith('```')) {
        const lang = line.trim().replace('```', '') || 'code';
        let codeContent = '';
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeContent += lines[i] + '\n';
          i++;
        }
        if (i < lines.length) i++; // Skip closing ```

        elements.push(
          <div key={`code-${i}`} className="my-3 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 font-mono text-xs">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-slate-400">
              <span className="flex items-center gap-1.5 text-xs">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                {lang}
              </span>
            </div>
            <pre className="p-3 text-slate-200 overflow-x-auto">
              <code>{codeContent}</code>
            </pre>
          </div>
        );
        continue;
      }

      // 3. Headers (###, ##, #)
      if (line.startsWith('### ')) {
        elements.push(
          <h4 key={`h3-${i}`} className="text-base font-bold text-indigo-300 mt-4 mb-1.5 flex items-center gap-2">
            {processInlineMathAndText(line.replace('### ', ''))}
          </h4>
        );
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h3 key={`h2-${i}`} className="text-lg font-bold text-slate-100 mt-5 mb-2 pb-1 border-b border-slate-800/80">
            {processInlineMathAndText(line.replace('## ', ''))}
          </h3>
        );
        i++;
        continue;
      }
      if (line.startsWith('# ')) {
        elements.push(
          <h2 key={`h1-${i}`} className="text-xl font-extrabold text-indigo-400 mt-5 mb-2">
            {processInlineMathAndText(line.replace('# ', ''))}
          </h2>
        );
        i++;
        continue;
      }

      // 4. Bullet Points / Numbered Steps
      if (/^(\*|-|\d+\.)\s/.test(line.trim())) {
        const isNumbered = /^\d+\.\s/.test(line.trim());
        const contentText = line.trim().replace(/^(\*|-|\d+\.)\s+/, '');
        
        elements.push(
          <div key={`li-${i}`} className="flex items-start gap-2.5 my-1.5 ml-1 text-slate-300 leading-relaxed">
            {isNumbered ? (
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center justify-center mt-0.5">
                {line.trim().match(/^(\d+)\./)?.[1] || '•'}
              </span>
            ) : (
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2.5" />
            )}
            <div className="flex-1">
              {processInlineMathAndText(contentText)}
            </div>
          </div>
        );
        i++;
        continue;
      }

      // 5. Empty lines
      if (!line.trim()) {
        elements.push(<div key={`empty-${i}`} className="h-2" />);
        i++;
        continue;
      }

      // 6. Regular Paragraph
      elements.push(
        <p key={`p-${i}`} className="my-1.5 text-slate-200 leading-relaxed">
          {processInlineMathAndText(line)}
        </p>
      );
      i++;
    }

    return elements;
  }, [content]);

  return (
    <div className={`relative group/math ${className}`}>
      <div className="math-content font-sans text-sm md:text-base leading-relaxed">
        {renderedElements}
      </div>

      <button
        onClick={handleCopyRaw}
        title="Copy raw LaTeX & text"
        className="absolute top-2 right-2 opacity-0 group-hover/math:opacity-100 transition-opacity px-2 py-1 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs rounded border border-slate-700 flex items-center gap-1.5 backdrop-blur-sm shadow"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400 text-[11px]">Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-3 h-3 text-slate-400" />
            <span className="text-[11px]">Copy LaTeX</span>
          </>
        )}
      </button>
    </div>
  );
};
