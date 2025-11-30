'use client'

import { Spin } from 'antd'

export default function Loading() {
    return (
        <div className="h-screen w-full bg-gray-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Spin size="large" />
                <div className="text-sm text-gray-500">加载中...</div>
            </div>
        </div>
    )
}
