'use client'

import React, { useState } from 'react'
import type { MenuProps } from 'antd'
import { Button, Menu } from 'antd'
import Models from '../../components/business/Models'
import Link from 'next/link'
import MCP from '../../components/business/MCP'

type MenuItem = Required<MenuProps>['items'][number]

/**
 * 设置页面菜单键枚举
 * 
 * 定义设置页面左侧菜单的所有选项键
 */
enum MenuKey {
    General = 'General',
    Agents = 'Agents',
    Tab = 'Tab',
    Models = 'Models',
    ToolsMcp = 'Tools & MCP',
    Rules = 'Rules and Commands',
    Indexing = 'Indexing & Docs',
    Network = 'Network',
    Beta = 'Beta',
    Docs = 'Docs',
}

/**
 * 菜单映射对象
 * 
 * 定义每个菜单项对应的组件和配置
 */
const menuMap = {
    [MenuKey.General]: {},
    [MenuKey.Agents]: {},
    [MenuKey.Tab]: {},
    [MenuKey.Models]: {
        component: <Models></Models>
    },
    [MenuKey.ToolsMcp]: {
        component: <MCP></MCP>
    },
    [MenuKey.Rules]: {},
    [MenuKey.Indexing]: {},
    [MenuKey.Network]: {},
    [MenuKey.Beta]: {},
    [MenuKey.Docs]: {}
}

/**
 * 菜单配置项数组
 * 
 * 定义左侧菜单的结构和分组
 */
const items: MenuItem[] = [
    {
        key: 'sub1',
        type: 'group',
        children: [
            { key: MenuKey.General, label: 'General' },
            { key: MenuKey.Agents, label: 'Agents' },
            { key: MenuKey.Tab, label: 'Tab' },
            { key: MenuKey.Models, label: 'Models' }
        ],
    },
    {
        type: 'divider',
    },
    {
        key: 'sub2',
        type: 'group',
        children: [
            { key: MenuKey.ToolsMcp, label: 'Tools & MCP' },
        ],
    },
    {
        type: 'divider',
    },
    {
        key: 'sub3',
        type: 'group',
        children: [
            { key: MenuKey.Rules, label: 'Rules and Commands' },
            { key: MenuKey.Indexing, label: 'Indexing & Docs' },
            { key: MenuKey.Network, label: 'Network' },
            { key: MenuKey.Beta, label: 'Beta' },
        ],
    },
    {
        type: 'divider',
    },
    {
        key: 'sub 4',
        type: 'group',
        children: [
            { key: MenuKey.Docs, label: 'Docs' },
        ],
    },
]

export default function Page() {
    const [selectedKey, setSelectedKey] = useState<MenuKey>(MenuKey.General)

    /**
     * 处理菜单选择事件
     * 
     * 当用户选择左侧菜单时，更新选中的菜单项
     * 
     * @param {Object} param - 菜单选择事件参数
     * @param {string} param.key - 选中的菜单键
     * @returns {void}
     */
    const handleSelect: MenuProps['onSelect'] = ({ key }) => {
        setSelectedKey(key as MenuKey)
    }

    return (
        <div className='flex'>
            <Menu
                style={{ width: 256 }}
                defaultSelectedKeys={[MenuKey.General]}
                defaultOpenKeys={['sub1']}
                mode="inline"
                items={items}
                onSelect={handleSelect}
            />
            <main className='flex-1 overflow-hidden h-screen'>
                <div className='ml-2 mt-2 mb-2'>
                    <Button>
                        <Link href={'/'}>返回聊天</Link>
                    </Button>
                </div>
                <div className='h-[calc(100vh-40px)] overflow-hidden'>
                    {menuMap[selectedKey]['component']}
                </div>
            </main>
        </div>
    )
}
