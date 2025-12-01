'use client'
import React from 'react'
import { IHistoryItem, Message } from '../../../type/message'
import { Button, Popover, Space } from 'antd'
import { DashOutlined } from '@ant-design/icons'

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
            <div className="p-2">
                <Button
                    danger
                    size='small'
                    onClick={() => handleDeleteSingleHistory(sessionId)}
                    className="w-full"
                >
                    删除
                </Button>
            </div>
        )
    }
    return (
        <div>
            <div className="p-2 w-64 border-b border-gray-200">
                <Space>
                    <Button onClick={handleNewChat}>新聊天</Button>
                    <Button onClick={handleDeleteAllHistories}>清空历史记录</Button>
                </Space>
            </div>
            <div className="p-4 w-64 overflow-y-auto h-[calc(100vh-100px)]">
                <h3 className="text-sm font-medium text-gray-700 mb-3">聊天历史</h3>
                <div className="space-y-2">
                    {histories?.length !== 0 && histories?.map((item) => {
                        const isActive = activeSessionId === item.sessionId
                        const preview = item?.messages?.length >= 2
                            ? item?.messages?.[item.messages.length - 2]?.content
                            : '新聊天'
                        const previewTime = item?.messages?.[item.messages.length - 2]?.time

                        return (
                            <div
                                key={item.sessionId}
                                className={`flex justify-between items-center p-3 rounded-xl transition-all duration-200 cursor-pointer ${isActive
                                    ? 'bg-blue-50 border border-blue-200 text-blue-700 shadow-md'
                                    : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200 hover:shadow-sm'
                                    }`}
                                onClick={() => handleClickItem(item.sessionId)}
                            >
                                <div className="flex-1 min-w-0 pr-2">
                                    <div className="font-medium truncate line-clamp-1">{preview}</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {previewTime || '刚刚创建'}
                                    </div>
                                </div>
                                <Popover
                                    trigger="click"
                                    content={() => content(item.sessionId, item.messages)}
                                    placement="right"
                                >
                                    <Button
                                        size="small"
                                        onClick={(e) => e.stopPropagation()}
                                        type="text"
                                        className="text-gray-400 hover:text-gray-600 p-1 min-w-0"
                                    >
                                        <DashOutlined />
                                    </Button>
                                </Popover>
                            </div>
                        )
                    })}
                    {histories?.length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-2 text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg p-4">
                            <div>还没有历史记录，开启你的新聊天吧</div>
                            <Button size="small" type="primary" onClick={handleNewChat}>
                                立即开始
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>)
}
