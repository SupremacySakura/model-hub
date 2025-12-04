import React, { useState } from 'react'
import { Message } from '../../../type/message'
import MarkdownComponent from '../../ui/Markdown'
import { Spin, message, Tooltip } from 'antd'
import { RobotOutlined, WarningOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'

interface IParams {
    messages: Message[]
    isLoading: boolean
}

export default function MessageArea({ messages, isLoading }: IParams) {
    const [copiedId, setCopiedId] = useState<string | number | null>(null)

    const handleCopy = async (content: string, id: string | number) => {
        try {
            await navigator.clipboard.writeText(content)
            setCopiedId(id)
            message.success('复制成功')
            setTimeout(() => {
                setCopiedId(null)
            }, 2000)
        } catch (error) {
            message.error('复制失败')
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-8">
            {messages?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400 gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                        <RobotOutlined className="text-2xl text-gray-400" />
                    </div>
                    <div className="text-base font-medium">开始你的对话吧</div>
                    <p className="text-sm text-gray-400">你可以询问任何问题，或者寻求帮助</p>
                </div>
            ) : (
                messages?.map((msg, index) => msg.content.length !== 0 && (
                    <div
                        key={msg?.id || index}
                        className={`w-full ${msg?.role === 'user' ? 'flex justify-end' : ''}`}
                    >
                        {msg?.role === 'user' ? (
                            // User Message: Right aligned bubble
                            <div className="flex flex-col items-end gap-1 max-w-[80%]">
                                <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed break-words prose-invert ${msg?.isError
                                    ? 'bg-red-500 text-white rounded-tr-none'
                                    : 'bg-blue-600 text-white rounded-tr-none'
                                    }`}>
                                    <MarkdownComponent content={msg?.content} />
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400 pr-1">
                                    <span>{msg?.time}</span>
                                    {msg?.isError && (
                                        <span className="flex items-center gap-1 text-red-500 font-medium">
                                            <WarningOutlined />
                                            发送失败
                                        </span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // AI Message: Full width, no bubble style
                            <div className="w-full pr-4 group">
                                <div className={`text-sm leading-relaxed break-words ${msg?.isError ? 'text-red-800 bg-red-50 p-4 rounded-lg border border-red-100' : 'text-gray-800'
                                    }`}>
                                    <MarkdownComponent content={msg?.content} />
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {msg?.role === 'assistant' && <RobotOutlined className="mr-1" />}
                                    <span>{msg?.time}</span>
                                    {msg?.role === 'assistant' && !msg?.isError && (
                                        <Tooltip title="复制内容">
                                            <button
                                                onClick={() => handleCopy(msg.content, msg.id || index)}
                                                className="flex items-center justify-center w-5 h-5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ml-2 cursor-pointer"
                                            >
                                                {copiedId === (msg.id || index) ? (
                                                    <CheckOutlined className="text-green-500" />
                                                ) : (
                                                    <CopyOutlined />
                                                )}
                                            </button>
                                        </Tooltip>
                                    )}
                                    {msg?.isError && (
                                        <span className="flex items-center gap-1 text-red-500 font-medium">
                                            <WarningOutlined />
                                            生成失败
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))
            )}

            {isLoading && (
                <div className="w-full">
                    <div className="flex items-center gap-2 text-gray-500">
                        <Spin size="small" />
                        <span className="text-sm">思考中...</span>
                    </div>
                </div>
            )}
        </div>
    )
}
