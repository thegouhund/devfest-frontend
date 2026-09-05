import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Balasan model dikirim sebagai Markdown. HTML mentah sengaja tidak diaktifkan
 * (tanpa rehype-raw) supaya jawaban model tidak bisa menyuntikkan markup.
 */
export const Markdown: React.FC<{ children: string }> = ({ children }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
      strong: ({ children }) => <strong className="font-bold text-ink-900">{children}</strong>,
      em: ({ children }) => <em className="italic">{children}</em>,
      ul: ({ children }) => <ul className="list-disc pl-4 mb-2 last:mb-0 space-y-0.5">{children}</ul>,
      ol: ({ children }) => (
        <ol className="list-decimal pl-4 mb-2 last:mb-0 space-y-0.5">{children}</ol>
      ),
      h1: ({ children }) => <h4 className="font-bold text-ink-900 mb-1.5">{children}</h4>,
      h2: ({ children }) => <h4 className="font-bold text-ink-900 mb-1.5">{children}</h4>,
      h3: ({ children }) => <h4 className="font-bold text-ink-900 mb-1.5">{children}</h4>,
      code: ({ children }) => (
        <code className="px-1 py-0.5 rounded bg-ink-200/70 font-mono text-[11px]">{children}</code>
      ),
      pre: ({ children }) => (
        <pre className="p-2.5 rounded-lg bg-ink-900 text-ink-50 overflow-x-auto text-[11px] mb-2 last:mb-0">
          {children}
        </pre>
      ),
      a: ({ href, children }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-clay-700 underline underline-offset-2"
        >
          {children}
        </a>
      ),
      blockquote: ({ children }) => (
        <blockquote className="border-l-2 border-ink-300 pl-3 text-ink-500 mb-2 last:mb-0">
          {children}
        </blockquote>
      ),
      // Tabel bisa lebih lebar dari bubble, jadi digulir sendiri.
      table: ({ children }) => (
        <div className="overflow-x-auto mb-2 last:mb-0 -mx-1">
          <table className="w-full border-collapse text-[11px]">{children}</table>
        </div>
      ),
      thead: ({ children }) => <thead className="bg-ink-100">{children}</thead>,
      th: ({ children }) => (
        <th className="border border-ink-200 px-2 py-1.5 text-left font-bold text-ink-700 whitespace-nowrap">
          {children}
        </th>
      ),
      td: ({ children }) => (
        <td className="border border-ink-200 px-2 py-1.5 text-ink-700 align-top">{children}</td>
      ),
      hr: () => <hr className="my-2 border-ink-200" />,
    }}
  >
    {children}
  </ReactMarkdown>
)

export default Markdown
