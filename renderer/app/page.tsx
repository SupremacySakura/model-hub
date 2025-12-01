'use client'

import { Button, Input, Select, Space, Upload, message as antdMessage } from "antd"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { IModelItem } from "../type/model"
import { IHistoryItem, Message } from "../type/message"
import { loadModels, getAllHistory, getSingleHistory, addHistory, deleteSingleHistory, deleteAllHistory, callLLM } from "../services"
import MessageArea from "../components/business/MessageArea"
import HistoryArea from "../components/business/HistoryArea"

export default function Home() {
  // 存储当前聊天记录
  const [messages, setMessages] = useState<Message[]>([])
  // 输入框内容
  const [message, setMessage] = useState<string>("")
  // 是否显示历史记录侧边栏
  const [showHistory, setShowHistory] = useState<boolean>(false)
  // 模型列表
  const [models, setModels] = useState<IModelItem[]>([])
  // 选中的模型
  const [selectedModel, setSelectedModel] = useState<IModelItem>(models[0])
  // 加载状态
  const [isLoading, setIsLoading] = useState<boolean>(false)
  // 当前ai回复id
  const currentAssistantId = useRef<number | null>(null)
  // 弹窗
  const [messageApi, contextHolder] = antdMessage.useMessage()
  // 历史记录
  const [histories, setHistories] = useState<IHistoryItem[]>()
  // 当前会话id
  const [sessionId, setSessionId] = useState<string>(crypto.randomUUID())
  // 聊天框dom
  const messagesRef = useRef<HTMLDivElement>(null)

  /**
   * 处理模型选择变更
   * 
   * 根据选择的模型ID更新当前选中的模型
   * 
   * @param {string} value - 选中的模型ID
   * @returns {void}
   */
  const handleChangeModel = (value: string) => {
    const model = models.find((model) => model.id === value) || models[0]
    setSelectedModel(model)
  }

  /**
   * 与大模型进行流式聊天
   * 
   * 通过IPC调用大模型接口，处理流式响应，并更新聊天界面
   * 
   * @async
   * @param {string} message - 用户输入的消息内容
   * @returns {Promise<void>}
   */
  const handleChatWithModel = async (message: string) => {
    // 输入校验
    if (!message.trim()) {
      messageApi.warning('请输入消息内容')
      return
    }
    // 模型校验
    if (!selectedModel || !selectedModel.id) {
      messageApi.warning('请选择模型')
      return
    }
    // 添加用户消息
    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: message,
      time: new Date().toLocaleString(),
    }

    setMessages(prev => [...prev, userMessage])
    setMessage("")
    setIsLoading(true)

    const id = Date.now() + 1
    const assistantMessage = {
      id,
      role: "assistant",
      content: "",
      time: new Date().toLocaleString(),
    }
    // 添加助手占位消息
    setMessages(prev => [...prev, assistantMessage])

    // 记录当前助手消息id
    currentAssistantId.current = id

    // 通过 IPC 调用大模型接口
    await callLLM({
      messages: [userMessage], model: selectedModel?.name, sessionId, apiKey: selectedModel?.apiKey, baseURL: selectedModel?.baseURL,
    }, (data: string) => {
      setIsLoading(false)
      setMessages(prev => prev.map((item) => item.id === id ? {
        ...item,
        content: item.content + data
      } : item))
    })
    // 获取最新历史记录
    handleGetSingleHistory(sessionId)
  }

  /**
   * 创建新的聊天会话
   * 
   * 生成新的会话ID，清空当前聊天记录，并将新会话持久化到存储中
   * 
   * @returns {void}
   */
  const handleNewChat = async () => {
    const newSessionId = crypto.randomUUID()
    setMessages([])
    setSessionId(newSessionId)
    const data = await addHistory(newSessionId)
    if (data.code === 200) {
      messageApi.success("新会话已创建")
    }
    handleGetSingleHistory(newSessionId)
  }

  /**
   * 拉取全部会话历史列表
   * 
   * 通过IPC调用获取所有会话历史，并更新历史记录状态
   * 
   * @async
   * @returns {Promise<void>}
   */
  const handleGetAllHistory = async (isInit?: boolean) => {
    try {
      const data = await getAllHistory()
      if (data.code === 200) {
        setHistories(data.data)
        if (isInit && data.data.length !== 0) {
          setSessionId(data.data[0].sessionId)
          setMessages(data.data[0].messages)
        }
      }
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * 拉取指定会话历史记录
   * 
   * 通过IPC调用获取指定会话的历史记录，并更新历史记录状态
   * 
   * @async
   * @param {string} sessionId - 要拉取历史记录的会话ID
   * @returns {Promise<void>}
   */
  const handleGetSingleHistory = async (sessionId: string) => {
    try {
      const data = await getSingleHistory(sessionId)
      if (data.code === 200) {
        setMessages(data.data.messages)
        // 如果历史记录里面已经有了这个会话，就更新它的消息
        setHistories(prev => prev.map((item) => item.sessionId === sessionId ? {
          ...item,
          messages: data.data.messages
        } : item))
        // 如果历史记录没有这个会话，就添加它
        if (!histories.find((item) => item.sessionId === sessionId)) {
          setHistories(prev => [{
            sessionId,
            messages: data.data.messages,
            createdTime: new Date().toLocaleString(),
          }, ...prev])
        }
      }
    } catch (error) {
      console.error(error)
    }
  }
  /**
   * 切换到指定的历史会话
   * 
   * 根据会话ID切换到对应的历史聊天记录
   * 
   * @param {string} sessionId - 要切换的会话ID
   * @returns {void}
   */
  const handleChooseHistory = (sessionId: string) => {
    setSessionId(sessionId)
    setMessages(histories.find((item) => item.sessionId === sessionId).messages)
  }

  /**
   * 清空所有会话历史记录
   * 
   * 通过IPC调用删除所有会话历史，并重新获取历史记录列表
   * 
   * @async
   * @returns {Promise<void>}
   */
  const handleDeleteAllHistories = async () => {
    const data = await deleteAllHistory()
    setMessages([])
    if (data.code === 200) {
      handleGetAllHistory()
      messageApi.success("所有会话历史已清空")
    }
  }

  /**
   * 删除指定会话历史记录
   * 
   * 通过IPC调用删除指定会话历史，并重新获取历史记录列表
   * 
   * @async
   * @param {string} sessionId - 要删除的会话ID
   * @returns {Promise<void>}
   */
  const handleDeleteSingleHistory = async (sessionId: string) => {
    const data = await deleteSingleHistory(sessionId)
    if (data.code === 200) {
      messageApi.success("会话历史已清空")
      handleGetAllHistory()
    }
  }

  /**
   * 加载模型列表
   * 
   * 通过HTTP调用获取可用模型列表，并更新模型状态
   * 
   * @async
   * @returns {Promise<void>}
   */
  const handleLoadModels = async () => {
    try {
      const data = await loadModels()
      if (data.code === 200) {
        setModels(data.data)
        setSelectedModel(data.data[0])
      }
    } catch (error) {
      console.error('Error fetching models:', error)
    }
  }

  // 初始化获取模型列表
  useEffect(() => {
    handleLoadModels()
    setMessages([])
    handleGetAllHistory(true)
  }, [])

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {contextHolder}
      {/* 顶部工具栏 */}
      <section className="w-full h-14 flex items-center px-4 border-b border-gray-200 bg-white">
        <Space>
          <Button
            type={showHistory ? "primary" : "default"}
            onClick={() => setShowHistory(!showHistory)}
            className="border-gray-300"
          >
            历史
          </Button>
          <Button><Link href={'/setting'}>设置</Link></Button>
        </Space>
      </section>

      {/* 主内容区域 */}
      <section className="w-full flex flex-1 overflow-hidden">
        {/* 历史记录侧边栏 - 占据文档流 */}
        <div className={`border-r border-gray-200 bg-white  ${showHistory ? 'w-64' : 'w-0'} duration-300 ease-in overflow-hidden shrink-0`}>
          <HistoryArea histories={histories} activeSessionId={sessionId} handleClickItem={handleChooseHistory} handleNewChat={handleNewChat} handleDeleteAllHistories={handleDeleteAllHistories} handleDeleteSingleHistory={handleDeleteSingleHistory}></HistoryArea>
        </div>
        {/* 主聊天区域 */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* 聊天消息区域 */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-2 space-y-4" ref={messagesRef}>
            <MessageArea messages={messages} isLoading={isLoading}></MessageArea>
          </div>
          {/* 输入区域 - 统一背景框 */}
          <div className="border-t border-gray-200 bg-white px-4 py-2">
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 space-y-3">
              <Input.TextArea
                placeholder="输入消息..."
                autoSize={{ minRows: 1, maxRows: 4 }}
                className="border-gray-300"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Upload>
                    <Button type="text" size="small" className="text-gray-600">
                      上传
                    </Button>
                  </Upload>
                  <Select
                    placeholder="选择模型"
                    size="small"
                    className="w-32"
                    onChange={handleChangeModel}
                    value={selectedModel?.id}
                    options={
                      models.map((item) => ({ value: item.id, label: item.name }))
                    }
                  />
                </div>
                <Button type="primary" className="bg-blue-500 hover:bg-blue-600" onClick={() => handleChatWithModel(message)}>
                  发送
                </Button>
              </div>
            </div>
          </div>
        </main>
      </section>
    </div>
  )
}
