'use client'
import React, { useState } from 'react'
import type { MenuProps } from 'antd'
import { Button, Menu } from 'antd'
import Models from '../../components/Models'
import Link from 'next/link'

type MenuItem = Required<MenuProps>['items'][number]

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

const menuMap = {
    [MenuKey.General]: {},
    [MenuKey.Agents]: {},
    [MenuKey.Tab]: {},
    [MenuKey.Models]: {
        component: <Models></Models>
    },
    [MenuKey.ToolsMcp]: {},
    [MenuKey.Rules]: {},
    [MenuKey.Indexing]: {},
    [MenuKey.Network]: {},
    [MenuKey.Beta]: {},
    [MenuKey.Docs]: {}
}

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
            <main className='flex-1 overflow-y-auto'>
                <div className='ml-2 mt-2'>
                    <Button>
                        <Link href={'/'}>返回聊天</Link>
                    </Button>
                </div>
                {menuMap[selectedKey]['component']}
            </main>
        </div>
    )
}
