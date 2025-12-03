'use client'

import { Button, Spin } from 'antd'
import React, { useEffect, useState } from 'react'
import JsonConfigEditor from '../JsonConfigEditor'

interface IParams {
    label: string  // 标签
    title: string  // 标题
    description: string  // 描述
    MiddleComponent?: React.ReactElement  // 中间部分组件
    MainComponent: React.ReactElement  // 核心组件
    isEditButtonShow?: boolean  // 是否展示编辑配置按钮
    config?: string  // json配置
    handleSaveConfig?: (config: string) => Promise<void>  // 保存json配置
    loading: boolean  // 核心组件是否加载中
}

export default function SettingLayout(params: IParams) {
    // 是否保存中
    const [saving, setSaving] = useState<boolean>(false)
    // 配置JSON字符串
    const [config, setConfig] = useState<string>(params.config || '')
    // 是否编辑模式
    const [isEdit, setIsEdit] = useState<boolean>(false)
    // 结构所有传参
    const { label, title, description, MainComponent, isEditButtonShow = true, handleSaveConfig, loading, MiddleComponent } = params

    // 保存配置方法
    const _handleSaveConfig = async () => {
        setSaving(true)
        await handleSaveConfig?.(config)
        setIsEdit(false)
        setSaving(false)
    }

    // 监听config变化，更新状态
    useEffect(() => {
        setConfig(params.config || '')
    }, [params.config])

    return (
        <div className="h-full bg-gray-50 p-6 overflow-hidden flex flex-col">
            {isEdit ? (
                <section className="mx-auto w-full max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-lg p-6 flex flex-col gap-5 h-full">
                    <div className="flex flex-wrap items-start justify-between gap-4 flex-shrink-0">
                        <div>
                            <div className="text-xs uppercase tracking-wide text-blue-500">编辑模式</div>
                            <h3 className="text-xl font-semibold text-gray-900 mt-1">JSON 配置</h3>
                            <p className="text-sm text-gray-500">仅在确认内容正确后再保存</p>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => setIsEdit(false)}>取消</Button>
                            <Button type="primary" loading={saving} onClick={_handleSaveConfig}>
                                保存配置
                            </Button>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-100 overflow-hidden bg-gray-900/95 flex-1 min-h-0">
                        <JsonConfigEditor value={config} onChange={setConfig} />
                    </div>
                </section>
            ) : (
                <section className="mx-auto w-full max-w-5xl bg-white rounded-2xl border border-gray-200 shadow-lg p-6 flex flex-col gap-6 h-full">
                    <div className="flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
                        <div>
                            <div className="text-xs uppercase tracking-wide text-blue-500">{label}</div>
                            <h2 className="text-2xl font-semibold text-gray-900 mt-1">{title}</h2>
                            <p className="text-sm text-gray-500">{description}</p>
                        </div>
                        {isEditButtonShow && (<Button type="primary" size="large" onClick={() => setIsEdit(true)}>
                            编辑配置
                        </Button>)}
                    </div>

                    {MiddleComponent}

                    {loading ? (
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 flex-1 flex items-center justify-center">
                            <Spin />
                        </div>
                    ) : (
                        <>
                            {MainComponent}
                        </>
                    )}
                </section>
            )}
        </div>
    )
}
