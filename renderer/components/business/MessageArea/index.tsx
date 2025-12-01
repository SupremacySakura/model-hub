import React from 'react'
import { Message } from '../../../type/message'
import MarkdownComponent from '../../ui/Markdown'
import { Spin } from 'antd'

interface IParams {
    messages: Message[]
    isLoading: boolean
}

export default function MessageArea({ messages, isLoading }: IParams) {
    return (
        <>
            {messages?.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                    开始你的对话吧
                </div>
            ) : (
                messages?.map((msg, index) => msg.content.length !== 0 && (
                    <div
                        key={msg?.id || index}
                        className={`flex ${msg?.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${msg?.role === 'user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white text-gray-800 border border-gray-200'
                                }`}
                        >
                            <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                <MarkdownComponent content={msg?.content}></MarkdownComponent>
                            </div>
                            <div
                                className={`text-xs mt-1 ${msg?.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                                    }`}
                            >
                                {msg?.time}
                            </div>
                        </div>
                    </div>
                ))
            )}
            {isLoading && (
                <div className="flex items-center gap-2 p-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                        <Spin size="small" />
                    </div>
                    <div className="text-sm text-gray-500">思考中...</div>
                </div>)}
        </>
    )
}
