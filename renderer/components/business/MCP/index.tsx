'use client'

import { Empty, message, Spin, Tag } from "antd"
import { useEffect, useState } from "react"
import { IMCPItem } from "../../../type/MCP"
import { getMCPConfig, loadMCPs, updateMCPConfig } from '../../../services'
import SettingLayout from "../../ui/SettingLayout"
export default function MCP() {
    // messageApi
    const [messageApi, contextHolder] = message.useMessage()
    // MCP 配置
    const [config, setConfig] = useState<string>("")
    // 是否加载中
    const [loading, setLoading] = useState<boolean>(false)
    // MCP 列表
    const [mcps, setMcps] = useState<IMCPItem[]>([])
    // 列表是否加载中
    const [isMCPLoading, setIsMCPLoading] = useState<boolean>(false)
    
    /**
     * 获取MCP配置
     * 
     * 通过HTTP调用从主进程获取MCP配置，并更新状态
     * 
     * @async
     * @returns {Promise<void>}
     */
    const handleGetMCPConfig = async () => {
        try {
            setLoading(true)
            const data = await getMCPConfig()
            if (data.code === 200) {
                setConfig(data.data || "{}")
            }
        } catch (error) { }
        setLoading(false)
    }

    /**
     * 保存MCP配置
     * 
     * 通过HTTP调用保存MCP配置，并更新状态和MCP列表
     * 
     * @async
     * @returns {Promise<void>}
     */
    const handleSaveConfig = async (config: string) => {
        try {
            const data = await updateMCPConfig(config)
            if (data.code === 200) {
                messageApi.success("配置已保存")
                handleGetMCPConfig()
                handleLoadMCP()
            } else {
                messageApi.error(data.message || "保存失败")
            }
        } catch (error) {
            messageApi.error("保存失败")
        }
    }

    /**
     * 加载MCP配置列表
     * 
     * 通过HTTP调用从主进程加载MCP配置列表，并更新状态
     * 
     * @async
     * @returns {Promise<void>}
     */
    const handleLoadMCP = async () => {
        setIsMCPLoading(true)
        const data = await loadMCPs()
        if (data.code === 200) {
            setMcps(data.data || [])
        }
        setIsMCPLoading(false)
    }

    useEffect(() => {
        handleGetMCPConfig()
        handleLoadMCP()
    }, [])

    const getMiddleComponent = () => {
        return (
            <>
                <div className="grid gap-4 sm:grid-cols-2 flex-shrink-0">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex items-center justify-between">
                        <div className="text-sm text-gray-500">当前状态</div>
                        <Tag color={config ? "green" : "default"} className="text-base px-3 py-1 rounded-full">
                            {config ? "已配置" : "未配置"}
                        </Tag>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex items-center justify-between">
                        <div className="text-sm text-gray-500">实例数量</div>
                        <div className="text-lg font-semibold text-gray-900">{mcps.length}</div>
                    </div>
                </div>
            </>
        )
    }

    const getMainComponent = () => {
        return (
            <>
                {contextHolder}
                {config ? (
                    <div className="overflow-y-auto p-4 h-full">
                        <ul className="space-y-4">
                            {isMCPLoading && (
                                <li className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 hover:shadow-md transition-shadow">
                                    <div className="flex flex-col items-center justify-center gap-3 py-8">
                                        <Spin size="large" />
                                        <span className="text-sm text-gray-500">正在加载 MCP 实例...</span>
                                    </div>
                                </li>
                            )}
                            {mcps.length > 0 ? (
                                mcps.map((item) => {
                                    if (item.isError) {
                                        return (
                                            <li
                                                key={item.id}
                                                className="rounded-2xl border-2 border-red-200 bg-red-50 shadow-sm p-4"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Tag color="red">错误</Tag>
                                                    <div className="text-sm text-red-600 font-medium">{item.id}</div>
                                                </div>
                                                <div className="mt-2 text-sm text-red-500">
                                                    加载失败，请检查配置
                                                </div>
                                            </li>
                                        )
                                    } else {
                                        return (
                                            <li
                                                key={item.id}
                                                className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                                    <div className="text-base font-semibold text-gray-900">{item.id}</div>
                                                    <Tag color="blue">{item.tools.length + item.prompts.length + (item.resources?.length || 0)} 资源</Tag>
                                                </div>
                                                <div className="space-y-2 text-sm text-gray-600">
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.tools.length ? (
                                                            item.tools.map((tool) => (
                                                                <Tag key={tool.name} color="blue">
                                                                    工具 · {tool.name}
                                                                </Tag>
                                                            ))
                                                        ) : (
                                                            <span className="text-gray-400">暂无工具</span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.prompts.length ? (
                                                            item.prompts.map((prompt) => (
                                                                <Tag key={prompt.name} color="purple">
                                                                    提示词 · {prompt.name}
                                                                </Tag>
                                                            ))
                                                        ) : (
                                                            <span className="text-gray-400">暂无提示词</span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.resources?.length ? (
                                                            item.resources.map((resource) => (
                                                                <Tag key={resource.name} color="green">
                                                                    资源 · {resource.name}
                                                                </Tag>
                                                            ))
                                                        ) : (
                                                            <span className="text-gray-400">暂无资源</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        )
                                    }
                                })
                            ) : (
                                <div className="flex h-48 items-center justify-center">
                                    <Empty description="暂无 MCP 实例" />
                                </div>
                            )}
                        </ul>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <Empty description="暂无配置" />
                    </div>
                )}
            </>
        )
    }

    return (
        <SettingLayout label="MCP 管理" title="配置预览" description="管理你的 MCP 连接与工具列表" isEditButtonShow={true} MainComponent={getMainComponent()} MiddleComponent={getMiddleComponent()} loading={loading} config={config} handleSaveConfig={handleSaveConfig}></SettingLayout>
    )
}
