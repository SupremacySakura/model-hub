'use client'

import { Button, Empty, message, Spin, Tag } from "antd"
import { useEffect, useState } from "react"
import JsonConfigEditor from "../JsonConfigEditor"
import { IMCPItem } from "../../type/MCP"
import { getMCPConfig, loadMCPs, updateMCPConfig } from '../../services/index'
export default function MCP() {
    // messageApi
    const [messageApi, contextHolder] = message.useMessage()
    // 是否编辑
    const [isEdit, setIsEdit] = useState<boolean>(false)
    // MCP 配置
    const [config, setConfig] = useState<string>("")
    // 是否加载中
    const [loading, setLoading] = useState<boolean>(false)
    // 是否保存中
    const [saving, setSaving] = useState<boolean>(false)
    // MCP 列表
    const [mcps, setMcps] = useState<IMCPItem[]>([])
    // 列表是否加载中
    const [isMCPLoading, setIsMCPLoading] = useState<boolean>(false)
    /**
     * 获取MCP配置
     * 
     * 通过IPC调用从主进程获取MCP配置，并更新状态
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
     * 通过IPC调用保存MCP配置，并更新状态和MCP列表
     * 
     * @async
     * @returns {Promise<void>}
     */
    const handleSave = async () => {
        try {
            setSaving(true)
            const data = await updateMCPConfig(config)
            if (data.code === 200) {
                messageApi.success("配置已保存")
                setIsEdit(false)
                handleGetMCPConfig()
                handleLoadMCP()
            } else {
                messageApi.error(data.message || "保存失败")
            }
        } catch (error) {
            messageApi.error("保存失败")
        } finally {
            setSaving(false)
        }
    }

    /**
     * 加载MCP配置列表
     * 
     * 通过IPC调用从主进程加载MCP配置列表，并更新状态
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
                            <Button type="primary" loading={saving} onClick={handleSave}>
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
                            <div className="text-xs uppercase tracking-wide text-blue-500">MCP 管理</div>
                            <h2 className="text-2xl font-semibold text-gray-900 mt-1">配置概览</h2>
                            <p className="text-sm text-gray-500">管理你的 MCP 连接与工具列表</p>
                        </div>
                        <Button type="primary" size="large" onClick={() => setIsEdit(true)}>
                            编辑配置
                        </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
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
                    <div className="rounded-2xl border border-dashed border-gray-200 h-60 bg-gray-50 overflow-y-auto">
                        {loading ? (
                            <div className="flex h-48 items-center justify-center">
                                <Spin />
                            </div>
                        ) : config ? (
                            <ul className="space-y-4 p-4">
                                {isMCPLoading && (
                                    <li className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 hover:shadow-md transition-shadow">
                                        <div className="flex flex-col items-center justify-center gap-3 py-8">
                                            <Spin size="large" />
                                            <span className="text-sm text-gray-500">正在加载 MCP 实例...</span>
                                        </div>
                                    </li>
                                )}
                                {mcps.length > 0 ? (
                                    mcps.map((item) => (
                                        <li
                                            key={item.id}
                                            className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                                <div className="text-base font-semibold text-gray-900">{item.id}</div>
                                                <Tag color="blue">{item.tools.length + item.prompts.length} 资源</Tag>
                                            </div>
                                            <div className="space-y-2 text-sm text-gray-600">
                                                <div className="flex flex-wrap gap-2">
                                                    {item.tools.length ? (
                                                        item.tools.map((tool) => (
                                                            <Tag key={tool.name} color="green">
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
                                            </div>
                                        </li>
                                    ))
                                ) : (
                                    <div className="flex h-48 items-center justify-center">
                                        <Empty description="暂无 MCP 实例" />
                                    </div>
                                )}
                            </ul>
                        ) : (
                            <div className="flex h-48 items-center justify-center">
                                <Empty description="暂无配置" />
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    )
}
