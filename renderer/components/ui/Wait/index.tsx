export default function Wait() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
        <span className="text-blue-600 text-2xl">⏳</span>
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">开发中</h3>
      <p className="text-gray-500 max-w-md">该功能正在紧张开发中，敬请期待</p>
    </div>
  )
}