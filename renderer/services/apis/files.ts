import { GetProp, UploadFile, UploadProps } from "antd"
import { ApiResponse } from "../../type/api"

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0]
export const uploadFiles = async (files: UploadFile<any>[]): Promise<ApiResponse<{ name: string, url: string }[]>> => {
    const formData = new FormData()
    files.forEach((file) => {
        formData.append('files[]', file as FileType)
    })
    const response = await fetch('http://localhost:11435/api/files/upload', {
        method: 'POST',
        body: formData
    })
    const data = await response.json()
    return data
}