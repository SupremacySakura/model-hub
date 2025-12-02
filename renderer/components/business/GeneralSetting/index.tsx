'use client'
import React, { useEffect, useState } from 'react'
import { ISettingConfig } from '../../../../main/utils/setting'
import { Button, message, Spin } from 'antd'
import JsonConfigEditor from '../../ui/JsonConfigEditor'

export default function GeneralSetting() {
    // messageApi
    const [messageApi, contextHolder] = message.useMessage()
    // 配置JSON字符串
    const [config, setConfig] = useState<string>('')
    // 解析后的配置对象
    const [settingConfig, setSettingConfig] = useState<ISettingConfig>()
    // 是否编辑模式
    const [isEdit, setIsEdit] = useState<boolean>(false)
    // 是否加载中
    const [loading, setLoading] = useState<boolean>(false)
    // 是否保存中
    const [saving, setSaving] = useState<boolean>(false)

    /**
     * 获取配置
     * 
     * 从主进程获取配置，并更新状态
     * 
     * @async
     * @returns {Promise<void>}
     */
    const handleGetConfig = async () => {
        try {
            setLoading(true)
            const configData = await window.setting.getConfig()
            setConfig(configData || '{}')
            const parsedConfig = await window.setting.loadConfig()
            setSettingConfig(parsedConfig)
        } catch (error) {
            messageApi.error('获取配置失败')
        } finally {
            setLoading(false)
        }
    }

    /**
     * 保存配置
     * 
     * 保存配置到主进程，并更新状态
     * 
     * @async
     * @returns {Promise<void>}
     */
    const handleSaveConfig = async () => {
        try {
            setSaving(true)
            await window.setting.saveConfig(config)
            const parsedConfig = await window.setting.loadConfig()
            setSettingConfig(parsedConfig)
            setIsEdit(false)
            messageApi.success('配置已保存')
        } catch (error) {
            messageApi.error('保存配置失败')
        } finally {
            setSaving(false)
        }
    }

    // 初始化获取配置
    useEffect(() => {
        handleGetConfig()
    }, [])

    return (
        <div className="h-full bg-gray-50 p-6 overflow-hidden">
            {contextHolder}
            {isEdit ? (
                <section className="mx-auto max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <div className="text-xs uppercase tracking-wide text-blue-500">编辑模式</div>
                            <h3 className="text-xl font-semibold text-gray-900 mt-1">JSON 配置</h3>
                            <p className="text-sm text-gray-500">仅在确认内容正确后再保存</p>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => setIsEdit(false)}>取消</Button>
                            <Button type="primary" loading={saving} onClick={handleSaveConfig}>
                                保存配置
                            </Button>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-100 overflow-hidden bg-gray-900/95">
                        <JsonConfigEditor value={config} onChange={setConfig} />
                    </div>
                </section>
            ) : (
                <section className="mx-auto max-w-5xl bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div className="text-xs uppercase tracking-wide text-blue-500">通用设置</div>
                            <h2 className="text-2xl font-semibold text-gray-900 mt-1">配置概览</h2>
                            <p className="text-sm text-gray-500">管理应用的通用配置</p>
                        </div>
                        <Button type="primary" size="large" onClick={() => setIsEdit(true)}>
                            编辑配置
                        </Button>
                    </div>

                    {loading ? (
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 flex items-center justify-center">
                            <Spin />
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="space-y-1">
                                    <div className="text-sm text-gray-500">上下文长度</div>
                                    <div className="text-lg font-semibold text-gray-900">
                                        {settingConfig?.LLM_CONTEXT_LENGTH || 20}
                                    </div>
                                </div>
                                {/* 可以根据需要添加更多配置项 */}
                            </div>

                            {config && (
                                <div className="mt-6 text-sm text-gray-500">
                                    <div className="font-medium mb-2">完整配置</div>
                                    <div className="rounded-lg border border-gray-200 bg-white p-4 overflow-x-auto">
                                        <pre className="text-xs whitespace-pre-wrap">{config}</pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            )}
        </div>
    )
}
