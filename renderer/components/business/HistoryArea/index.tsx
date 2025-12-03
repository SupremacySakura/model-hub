'use client'
import React from 'react'
import { IHistoryItem, Message } from '../../../type/message'
import { Button, Popover, Space } from 'antd'
import { EllipsisOutlined } from '@ant-design/icons'

interface IParams {
    histories: IHistoryItem[]
    activeSessionId: string
    handleClickItem: (sessionId: string) => void
    handleNewChat: () => void
    handleDeleteAllHistories: () => void
    handleDeleteSingleHistory: (sessionId: string) => void
}
export default function HistoryArea({ histories, activeSessionId, handleClickItem, handleNewChat, handleDeleteAllHistories, handleDeleteSingleHistory }: IParams) {
    const content = (sessionId: string, messages: Message[]) => {
        return (
            <div className="p-1 min-w-[80px]">
                <Button
                    type="text"
                    danger
                    size='small'
                    onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSingleHistory(sessionId)
                    }}
                    className="w-full text-left flex justify-start items-center px-2"
                >
                    删除
                </Button>
            </div>
        )
    }
    return (
        <div className="h-full flex flex-col bg-gray-50/50 overflow-hidden min-w-64">
            {/* 头部操作区 */}
            <div className="p-4 pb-2">
                <Button
                    onClick={handleNewChat}
                    className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border-gray-200 hover:border-blue-400 hover:text-blue-600 shadow-sm hover:shadow transition-all bg-white group"
                >
                    <span className="text-lg group-hover:scale-110 transition-transform">+</span>
                    <span className="font-medium">新对话</span>
                </Button>
            </div>

            {/* 列表区域 */}
            <div className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin">
                <div className="flex items-center justify-between px-2 py-2 mb-1">
                    <h3 className="text-xs font-medium text-gray-500">最近聊天</h3>
                    {histories?.length > 0 && (
                        <Button
                            type="text"
                            size="small"
                            onClick={handleDeleteAllHistories}
                            className="text-xs text-gray-400 hover:text-red-500 h-auto py-0.5 px-2"
                        >
                            清空
                        </Button>
                    )}
                </div>

                <div className="space-y-1">
                    {histories?.length !== 0 && histories?.map((item) => {
                        const isActive = activeSessionId === item.sessionId
                        const preview = item?.messages?.length >= 2
                            ? item?.messages?.[item.messages.length - 2]?.content
                            : '新聊天'

                        // 格式化时间，如果是今天则只显示时间，否则显示日期
                        const timeStr = item?.messages?.[item.messages.length - 2]?.time
                        const displayTime = timeStr ? (() => {
                            try {
                                const date = new Date(timeStr)
                                const today = new Date()
                                const isToday = date.getDate() === today.getDate() &&
                                    date.getMonth() === today.getMonth() &&
                                    date.getFullYear() === today.getFullYear()
                                return isToday ? timeStr.split(' ')[1]?.slice(0, 5) : timeStr.split(' ')[0]
                            } catch (e) {
                                return '刚刚'
                            }
                        })() : '刚刚'

                        return (
                            <div
                                key={item.sessionId}
                                className={`group flex justify-between items-start p-3 rounded-lg transition-all duration-200 cursor-pointer border ${isActive
                                    ? 'bg-blue-50 border-blue-200 shadow-md ring-1 ring-blue-500/10'
                                    : 'border-transparent hover:bg-gray-200/50'
                                    }`}
                                onClick={() => handleClickItem(item.sessionId)}
                            >
                                <div className="flex-1 min-w-0 pr-2">
                                    <div className={`text-sm font-medium truncate leading-tight mb-1 ${isActive ? 'text-blue-700' : 'text-gray-700'
                                        }`}>
                                        {preview}
                                    </div>
                                    <div className="text-[10px] text-gray-400 flex items-center gap-1">
                                        <span>{displayTime}</span>
                                        <span className="mx-1">·</span>
                                        <span>{item.messages.length} 条对话</span>
                                    </div>
                                </div>
                                <Popover
                                    trigger="click"
                                    content={() => content(item.sessionId, item.messages)}
                                    placement="bottomRight"
                                >
                                    <Button
                                        size="small"
                                        onClick={(e) => e.stopPropagation()}
                                        type="text"
                                        className={`min-w-0 w-6 h-6 flex items-center justify-center p-0 text-gray-400 hover:bg-gray-200 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100' : ''
                                            }`}
                                    >
                                        <EllipsisOutlined className="text-base" />
                                    </Button>
                                </Popover>
                            </div>
                        )
                    })}

                    {histories?.length === 0 && (
                        <div className="mt-12 flex flex-col items-center justify-center text-center px-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-xl">
                                💬
                            </div>
                            <p className="text-sm text-gray-500 mb-4">暂无历史记录</p>
                            <Button
                                type="dashed"
                                size="small"
                                onClick={handleNewChat}
                                className="text-xs text-blue-600 border-blue-200 hover:border-blue-400 hover:text-blue-700"
                            >
                                开始新对话
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>)
}
