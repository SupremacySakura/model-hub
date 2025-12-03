'use client'

import { Button, Input, message, Empty } from 'antd'
import React, { useEffect, useState } from 'react'
import { IRule } from '../../../type/rules'
import { addRule, deleteRule, loadRules } from '../../../services/apis/rules'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import SettingLayout from '../../ui/SettingLayout'

export default function Rules() {
    // messageApi
    const [messageApi, contextHolder] = message.useMessage()
    // 规则列表
    const [rules, setRules] = useState<IRule[]>([])
    // 新规则内容
    const [newRule, setNewRule] = useState('')
    // 加载状态
    const [loading, setLoading] = useState(false)
    // 保存状态
    const [saving, setSaving] = useState(false)

    /**
     * 加载规则列表
     * 
     * 从服务器获取规则列表，并更新状态
     * 
     * @async
     * @returns {Promise<void>}
     */
    const handleLoadRules = async () => {
        try {
            setLoading(true)
            const data = await loadRules()
            if (data.code === 200) {
                setRules(data.data || [])
            }
        } catch (error) {
            messageApi.error('加载规则失败')
        } finally {
            setLoading(false)
        }
    }

    /**
     * 添加新规则
     * 
     * 将新规则保存到服务器，并更新列表
     * 
     * @async
     * @param {string} ruleContent - 新规则内容
     * @returns {Promise<void>}
     */
    const handleAddRule = async (ruleContent: string) => {
        if (!ruleContent.trim()) {
            messageApi.warning('请输入规则内容')
            return
        }
        try {
            setSaving(true)
            const data = await addRule({
                id: new Date().toString(),
                content: ruleContent
            })
            if (data.code === 200) {
                messageApi.success('新增规则成功')
                setNewRule('')
                handleLoadRules()
            }
        } catch (error) {
            messageApi.error('新增规则失败')
        } finally {
            setSaving(false)
        }
    }

    /**
     * 删除规则
     * 
     * 从服务器删除指定规则，并更新列表
     * 
     * @async
     * @param {string} ruleId - 规则ID
     * @returns {Promise<void>}
     */
    const handleDeleteRule = async (ruleId: string) => {
        try {
            const data = await deleteRule(ruleId)
            if (data.code === 200) {
                messageApi.success('删除规则成功')
                handleLoadRules()
            } else {
                messageApi.error('删除规则失败')
            }
        } catch (error) {
            messageApi.error('删除规则失败')
        }
    }

    // 初始化加载规则
    useEffect(() => {
        handleLoadRules()
    }, [])

    const getMiddleComponent = () => {
        return (
            <>
                {/* Add Rule Input */}
                <div className="flex gap-3 flex-shrink-0">
                    <Input
                        value={newRule}
                        onChange={(e) => setNewRule(e.target.value)}
                        placeholder="输入新的规则内容，例如：'请使用中文回答'..."
                        className="flex-1"
                        size="large"
                        onPressEnter={() => handleAddRule(newRule)}
                        disabled={saving}
                    />
                    <Button
                        type="primary"
                        size="large"
                        icon={<PlusOutlined />}
                        onClick={() => handleAddRule(newRule)}
                        loading={saving}
                        className="bg-blue-500 hover:bg-blue-600"
                    >
                        添加规则
                    </Button>
                </div>

                {/* Stats */}
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex items-center justify-between text-sm text-gray-500 flex-shrink-0">
                    <span>共 {rules.length} 条规则</span>
                </div>
            </>
        )
    }

    const getMainComponent = () => {
        return (
            <>
                {contextHolder}
                {rules.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Empty description="暂无规则，请添加" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    </div>
                ) : (
                    <div className="overflow-y-auto p-4 h-full">
                        <ul className="space-y-3">
                            {rules.map((rule) => (
                                <li
                                    key={rule.id}
                                    className="group flex items-start gap-3 p-4 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                    <div className="flex-1 pt-1">
                                        <div className="text-gray-700 leading-relaxed text-base break-all">{rule.content}</div>
                                    </div>
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleDeleteRule(rule.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        删除
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </>
        )
    }
    
    return (
        <SettingLayout label="规则管理" title="大模型回复规则" description="设置全局的系统提示词规则，将应用于所有对话" isEditButtonShow={false} MainComponent={getMainComponent()} MiddleComponent={getMiddleComponent()} loading={loading}></SettingLayout>
    )
}
