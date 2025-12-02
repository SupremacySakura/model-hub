import { getFileTypeByName } from './utils'
import {
  FileOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FileZipOutlined,
} from '@ant-design/icons'

import { Tooltip } from 'antd'

type FilePreviewProps = {
  filename: string
  url: string
}

export default function FilePreview({ filename, url }: FilePreviewProps) {
  const type = getFileTypeByName(filename)

  // ✅ 图片预览
  if (type === 'image') {
    return (
      <div className="w-full max-w-xs border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <img
          src={url}
          alt={filename}
          className="w-full h-auto object-cover"
        />
        <div className="p-2 bg-white">
          <Tooltip title={filename}>
            <p className="text-sm truncate text-gray-700">{filename}</p>
          </Tooltip>
        </div>
      </div>
    )
  }

  // ✅ 视频
  if (type === 'video') {
    return (
      <div className="w-full max-w-xs border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <video
          src={url}
          className="w-full h-auto object-cover"
          controls
        />
        <div className="p-2 bg-white">
          <Tooltip title={filename}>
            <p className="text-sm truncate text-gray-700">{filename}</p>
          </Tooltip>
        </div>
      </div>
    )
  }

  // ✅ 音频
  if (type === 'audio') {
    return (
      <div className="w-full max-w-xs border border-gray-200 rounded-lg p-2 bg-white shadow-sm">
        <audio src={url} controls className="w-full" />
        <Tooltip title={filename}>
          <p className="text-sm mt-1 truncate text-gray-700">{filename}</p>
        </Tooltip>
      </div>
    )
  }

  // ✅ 其他文件类型 - 左边图标右边文件名
  const iconMap: Record<string, React.ReactNode> = {
    pdf: <FilePdfOutlined style={{ fontSize: 20, color: '#E53E3E' }} />,
    word: <FileWordOutlined style={{ fontSize: 20, color: '#3182CE' }} />,
    excel: <FileExcelOutlined style={{ fontSize: 20, color: '#2F855A' }} />,
    ppt: <FilePptOutlined style={{ fontSize: 20, color: '#D69E2E' }} />,
    zip: <FileZipOutlined style={{ fontSize: 20, color: '#718096' }} />,
    other: <FileOutlined style={{ fontSize: 20, color: '#718096' }} />,
  }

  const icon = iconMap[type] || iconMap['other']

  return (
    <div className="w-full max-w-xs flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
      <div className="text-xl">{icon}</div>
      <div className="flex-1 min-w-0">
        <Tooltip title={filename}>
          <p className="text-sm font-medium truncate text-gray-800">{filename}</p>
        </Tooltip>
        <p className="text-xs text-gray-500 capitalize">{type}</p>
      </div>
    </div>
  )
}
