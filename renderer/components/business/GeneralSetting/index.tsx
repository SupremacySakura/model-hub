'use client'

import React, { useEffect, useState } from 'react'
import { ISettingConfig } from '../../../../main/utils/setting'
import { message } from 'antd'
import SettingLayout from '../../ui/SettingLayout'

export default function GeneralSetting() {
    // messageApi
    const [messageApi, contextHolder] = message.useMessage()
    // 配置JSON字符串
    const [config, setConfig] = useState<string>('')
    // 解析后的配置对象
    const [settingConfig, setSettingConfig] = useState<ISettingConfig>()
    // 是否加载中
    const [loading, setLoading] = useState<boolean>(false)

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
    const handleSaveConfig = async (config: string) => {
        try {
            await window.setting.saveConfig(config)
            const parsedConfig = await window.setting.loadConfig()
            setConfig(config)
            setSettingConfig(parsedConfig)
            messageApi.success('配置已保存')
        } catch (error) {
            messageApi.error('保存配置失败')
        }
    }

    // 初始化获取配置
    useEffect(() => {
        handleGetConfig()
    }, [])

    const getMainComponent = () => {
        return (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 flex-1 overflow-hidden flex flex-col">
                {contextHolder}
                <div className="overflow-y-auto p-6 h-full">
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
            </div>
        )
    }
    return (
        <SettingLayout label='通用设置' title='配置概览' description='管理应用的通用配置' MainComponent={getMainComponent()} isEditButtonShow={true} loading={loading} config={config} handleSaveConfig={handleSaveConfig}></SettingLayout>
    )
}
