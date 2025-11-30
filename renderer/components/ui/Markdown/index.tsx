'use client'

import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import 'highlight.js/styles/github.css'
import 'katex/dist/katex.min.css'

export default function MarkdownComponent({ content }: { content: string }) {
  return (
    <div className="markdown-content">
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeHighlight, rehypeKatex]}
        components={{
          // 代码块样式
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <div className="relative my-4">
                <pre className="rounded-lg bg-gray-50 border border-gray-200 p-4 overflow-x-auto">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code className="bg-gray-100 text-blue-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            )
          },
          // 段落样式
          p({ children }) {
            return <p className="mb-3 leading-7">{children}</p>
          },
          // 标题样式
          h1({ children }) {
            return <h1 className="text-2xl font-bold mt-6 mb-4 pb-2 border-b border-gray-200">{children}</h1>
          },
          h2({ children }) {
            return <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2>
          },
          h3({ children }) {
            return <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>
          },
          // 列表样式
          ul({ children }) {
            return <ul className="list-disc list-inside mb-3 space-y-1 ml-4">{children}</ul>
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside mb-3 space-y-1 ml-4">{children}</ol>
          },
          li({ children }) {
            return <li className="ml-2">{children}</li>
          },
          // 引用块样式
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-blue-300 pl-4 py-2 my-3 bg-blue-50 italic text-gray-700">
                {children}
              </blockquote>
            )
          },
          // 表格样式
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse border border-gray-300">
                  {children}
                </table>
              </div>
            )
          },
          thead({ children }) {
            return <thead className="bg-gray-100">{children}</thead>
          },
          th({ children }) {
            return <th className="border border-gray-300 px-4 py-2 text-left font-semibold">{children}</th>
          },
          td({ children }) {
            return <td className="border border-gray-300 px-4 py-2">{children}</td>
          },
          // 链接样式
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {children}
              </a>
            )
          },
          // 水平分割线
          hr() {
            return <hr className="my-4 border-gray-300" />
          },
          // 强调文本
          strong({ children }) {
            return <strong className="font-semibold">{children}</strong>
          },
          em({ children }) {
            return <em className="italic">{children}</em>
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  )
}