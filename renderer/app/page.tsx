'use client'

import { Button, Input, Select, Space, Spin, Upload, message as antdMessage } from "antd"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { IModelItem } from "../type/model"
import { IHistoryItem, Message } from "../type/message"

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
  const [isLoding, setIsLoding] = useState<boolean>(false)
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
    setIsLoding(true)

    // 添加助手占位消息
    const assistantMessage: Message = {
      id: Date.now() + 1,
      role: "assistant",
      content: "",
      time: new Date().toLocaleString(),
    }
    setMessages(prev => [...prev, assistantMessage])

    // 记录当前助手消息id
    currentAssistantId.current = assistantMessage.id

    // 通过 IPC 调用大模型接口
    await window.llm.start({
      messages: [userMessage],
      model: selectedModel?.name,
      sessionId,
      apiKey: selectedModel?.apiKey,
      baseURL: selectedModel?.baseURL,
    })
  }

  /**
   * 创建新的聊天会话
   * 
   * 生成新的会话ID，清空当前聊天记录，并将新会话持久化到存储中
   * 
   * @returns {void}
   */
  const handleNewChat = () => {
    const newSessionId = crypto.randomUUID()
    setMessages([])
    setSessionId(newSessionId)
      ; (async () => {
        const data = await window.llm.addHistory(newSessionId)
        console.log(data)
      })()
    fetchHitories()
  }

  /**
   * 拉取全部会话历史列表
   * 
   * 通过IPC调用获取所有会话历史，并更新历史记录状态
   * 
   * @async
   * @returns {Promise<void>}
   */
  const fetchHitories = async () => {
    try {
      const data = await window.llm.getAllHistories()
      if (data.code === 200) {
        setHistories(data.data)
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
    const data = await window.llm.deleteAllHistories()
    setMessages([])
    if (data.code === 200) {
      fetchHitories()
    }
  }

  /**
   * 监听大模型回复
   */
  useEffect(() => {
    window.llm.onChunk((delta: string) => {
      if (!currentAssistantId.current) return
      if (isLoding) {
        setIsLoding(false)
      }
      setMessages(prev =>
        prev.map(msg =>
          msg.id === currentAssistantId.current
            ? { ...msg, content: msg.content + delta }
            : msg
        )
      )
    })

    window.llm.onEnd(() => {
      setIsLoding(false)
      currentAssistantId.current = null
      // 每次完成都刷新历史记录
      fetchHitories()
    })

    window.llm.onError((err: string) => {
      console.error("LLM Error:", err)
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          role: "assistant",
          content: "❌ 模型调用失败：" + err,
          time: new Date().toLocaleString(),
        },
      ])
      currentAssistantId.current = null
      setIsLoding(false)
    })
  }, [])

  // 初始化获取模型列表
  useEffect(() => {
    /**
     * 从主进程获取模型列表
     * 
     * 通过IPC调用获取所有可用的模型列表，并更新模型状态
     * 
     * @async
     * @returns {Promise<void>}
     */
    const fetchModels = async () => {
      try {
        const data = await window.llm.getModels()
        if (data.code === 200) {
          setModels(data.data.models)
        }
      } catch (error) {
        console.error('Error fetching models:', error)
      }
    }
    fetchModels()
    setMessages([])
    fetchHitories()
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
        <div className={`w-64 border-r border-gray-200 bg-white  ${showHistory ? 'w-64' : 'w-0'} duration-300 ease-in overflow-hidden`}>
          <div className="p-2 w-64 border-b border-gray-200">
            <Space>
              <Button onClick={handleNewChat}>新聊天</Button>
              <Button onClick={handleDeleteAllHistories}>清空历史记录</Button>
            </Space>
          </div>
          <div className="p-4 w-64 overflow-y-auto h-[calc(100vh-100px)]">
            <h3 className="text-sm font-medium text-gray-700 mb-3">聊天历史</h3>
            <div className="space-y-2">
              {histories?.length !== 0 && histories?.map((item) => {
                const isActive = sessionId === item.sessionId
                const preview = item?.messages.length >= 2
                  ? item?.messages?.[item.messages.length - 2]?.content
                  : '新聊天'
                const previewTime = item?.messages?.[item.messages.length - 2]?.time

                return (
                  <div
                    key={item.sessionId}
                    className={`p-3 border rounded-lg text-sm transition-colors cursor-pointer shadow-sm ${isActive
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-transparent text-gray-600 hover:bg-gray-50'
                      }`}
                    onClick={() => handleChooseHistory(item.sessionId)}
                  >
                    <div className="font-medium truncate">{preview}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {previewTime || '刚刚创建'}
                    </div>
                  </div>
                )
              })}
              {histories?.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg p-4">
                  <div>还没有历史记录，开启你的新聊天吧</div>
                  <Button size="small" type="primary" onClick={handleNewChat}>
                    立即开始
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* 主聊天区域 */}
        <main className="flex-1 flex flex-col">
          {/* 聊天消息区域 */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" ref={messagesRef}>
            {messages?.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                开始你的对话吧
              </div>
            ) : (
              messages?.map((msg, index) => (
                <div
                  key={msg?.id || index}
                  className={`flex ${msg?.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${msg?.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                  >
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg?.content || '新聊天'}
                    </div>
                    <div
                      className={`text-xs mt-1 ${msg?.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                        }`}
                    >
                      {msg?.time}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoding && <Spin></Spin>}
          </div>

          {/* 输入区域 - 统一背景框 */}
          <div className="border-t border-gray-200 bg-white px-6 py-4">
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
