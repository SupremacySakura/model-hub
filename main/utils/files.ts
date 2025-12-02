/**
 * 文件管理工具
 * 用于处理不同类型文件的解析、存储和管理
 */

import { lookup } from "mime-types" // 用于获取文件的MIME类型
import fs from 'fs' // 文件系统模块
import path from "path" // 路径处理模块
import sharp from "sharp" // 图像处理库
import { PDFParse } from "pdf-parse" // PDF解析库
import { app } from "electron" // Electron应用实例
import { extractRawText } from 'mammoth' // Word文档解析库
import XLSX from 'xlsx' // Excel文档解析库

/**
 * 文件信息接口
 * 描述文件的基本信息和内容
 */
interface IFileInfo {
    content: string // 文件内容，可能是文本或base64编码
    size: number // 文件大小（字节）
    name: string // 文件名
    filePath: string // 文件路径
}

/**
 * 文件解析策略接口
 * 定义了文件解析的统一方法
 */
export interface FileParserStrategy {
    /**
     * 检查当前策略是否支持指定的文件扩展名
     * @param {string} ext - 文件扩展名（包含点号，如".pdf"）
     * @returns {boolean} 是否支持该文件类型
     */
    supports(ext: string): boolean

    /**
     * 解析文件内容
     * @param {string} filePath - 文件路径
     * @param {Buffer} buffer - 文件内容缓冲区
     * @returns {Promise<string>} 解析后的文件内容
     */
    parse(filePath: string, buffer: Buffer): Promise<string>
}

/**
 * PDF文件解析策略
 * 用于解析PDF文件内容
 */
export class PdfParserStrategy implements FileParserStrategy {
    /**
     * 检查是否支持PDF文件
     * @param {string} ext - 文件扩展名
     * @returns {boolean} 是否支持PDF文件
     */
    supports = (ext: string): boolean => {
        return ['.pdf'].includes(ext)
    }

    /**
     * 解析PDF文件内容
     * @param {string} _ - 文件路径（未使用）
     * @param {Buffer} buffer - PDF文件缓冲区
     * @returns {Promise<string>} 解析后的PDF文本内容
     */
    parse = async (_: string, buffer: Buffer): Promise<string> => {
        const data = new PDFParse({ data: buffer })
        return (await data.getText()).pages.map((item) => item.text).join('')
    }
}

/**
 * Word文件解析策略
 * 用于解析.docx文件内容
 */
export class WordParserStrategy implements FileParserStrategy {
    /**
     * 检查是否支持Word文件
     * @param {string} ext - 文件扩展名
     * @returns {boolean} 是否支持Word文件
     */
    supports = (ext: string): boolean => {
        return ['.docx'].includes(ext)
    }

    /**
     * 解析Word文件内容
     * @param {string} _ - 文件路径（未使用）
     * @param {Buffer} buffer - Word文件缓冲区
     * @returns {Promise<string>} 解析后的Word文本内容
     */
    parse = async (_: string, buffer: Buffer): Promise<string> => {
        const result = await extractRawText({ buffer })
        return result.value
    }
}

/**
 * Excel文件解析策略
 * 用于解析.xls和.xlsx文件内容
 */
export class ExcelParserStrategy implements FileParserStrategy {
    /**
     * 检查是否支持Excel文件
     * @param {string} ext - 文件扩展名
     * @returns {boolean} 是否支持Excel文件
     */
    supports = (ext: string): boolean => {
        return ['.xls', '.xlsx'].includes(ext)
    }

    /**
     * 解析Excel文件内容
     * @param {string} filePath - Excel文件路径
     * @param {Buffer} _ - 文件缓冲区（未使用）
     * @returns {Promise<string>} 解析后的Excel JSON内容
     */
    parse = (filePath: string, _: Buffer): Promise<string> => {
        const workbook = XLSX.readFile(filePath)
        const result: any[] = []
        workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName]
            // 将 sheet 转成 JSON
            const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
            result.push({
                sheetName,
                data,
            })
        })
        return Promise.resolve(JSON.stringify(result))
    }
}

/**
 * 图片文件解析策略
 * 用于解析图片文件，将其转换为base64编码
 */
export class ImageParserStrategy implements FileParserStrategy {
    /**
     * 检查是否支持图片文件
     * @param {string} ext - 文件扩展名
     * @returns {boolean} 是否支持图片文件
     */
    supports = (ext: string): boolean => {
        return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext)
    }

    /**
     * 解析图片文件，压缩并转换为base64编码
     * @param {string} filePath - 图片文件路径
     * @param {Buffer} buffer - 图片文件缓冲区
     * @returns {Promise<string>} 压缩后的base64编码图片
     */
    parse = async (filePath: string, buffer: Buffer): Promise<string> => {
        const compressed = await sharp(buffer)
            .resize({ width: 1024 }) // 调整宽度为1024px
            .jpeg({ quality: 60 }) // 压缩为JPEG，质量60%
            .toBuffer()

        const base64 = compressed.toString('base64')
        const mime = lookup(filePath) || 'application/octet-stream' // 获取MIME类型

        return `data:${mime};base64,${base64}` // 返回data URI格式
    }
}

/**
 * 文本文件解析策略
 * 用于解析文本类文件
 */
export class TextParserStrategy implements FileParserStrategy {
    /**
     * 检查是否支持文本文件
     * @param {string} ext - 文件扩展名
     * @returns {boolean} 是否支持文本文件
     */
    supports = (ext: string): boolean => {
        return ['.txt', '.md', '.csv'].includes(ext)
    }

    /**
     * 解析文本文件内容
     * @param {string} _ - 文件路径（未使用）
     * @param {Buffer} buffer - 文本文件缓冲区
     * @returns {Promise<string>} 解析后的文本内容
     */
    parse = (_: string, buffer: Buffer): Promise<string> => {
        return Promise.resolve(buffer.toString('utf-8')) // 直接转换为UTF-8字符串
    }
}

/**
 * 默认文件解析策略
 * 用于解析所有未被特定策略支持的文件类型
 * 将文件转换为base64编码
 */
export class DefaultParserStrategy implements FileParserStrategy {
    /**
     * 默认支持所有文件类型
     * @param {string} _ - 文件扩展名（未使用）
     * @returns {boolean} 始终返回true
     */
    supports = (_: string): boolean => {
        return true
    }

    /**
     * 将文件转换为base64编码
     * @param {string} filePath - 文件路径
     * @param {Buffer} buffer - 文件缓冲区
     * @returns {Promise<string>} 文件的base64编码
     */
    parse = (filePath: string, buffer: Buffer): Promise<string> => {
        const base64 = buffer.toString('base64')
        const mime = lookup(filePath) || 'application/octet-stream' // 获取MIME类型

        return Promise.resolve(`data:${mime};base64,${base64}`) // 返回data URI格式
    }
}

/**
 * 文件管理器类
 * 用于管理和处理文件的单例类
 * 支持多种文件类型的解析、存储和管理
 */
class FilesManager {
    /**
     * 文件映射表
     * 存储文件名到文件信息的映射
     * @private
     */
    private filesMap: Map<string, IFileInfo> = new Map()  // fileName -> IFileInfo

    /**
     * 单例实例
     * @private
     */
    private static instance: FilesManager

    /**
     * 文件解析策略数组
     * 包含所有支持的文件解析策略
     * @private
     */
    private strategies: FileParserStrategy[] = [
        new PdfParserStrategy(),
        new WordParserStrategy(),
        new ExcelParserStrategy(),
        new ImageParserStrategy(),
        new DefaultParserStrategy()
    ]

    /**
     * 解析单个文件
     * 根据文件扩展名选择合适的解析策略
     * @private
     * @param {string} filePath - 文件路径
     * @returns {Promise<string>} 解析后的文件内容
     * @throws {Error} 当没有找到合适的解析策略时抛出错误
     */
    private async parseFile(filePath: string) {
        const ext = path.extname(filePath).toLowerCase() // 获取文件扩展名
        let buffer = fs.readFileSync(filePath) as Buffer // 读取文件内容到缓冲区
        const strategy = this.strategies.find(s => s.supports(ext)) // 选择合适的解析策略
        if (!strategy) {
            throw new Error(`No strategy found for file type: ${ext}`)
        }

        return await strategy.parse(filePath, buffer) // 使用选定策略解析文件
    }

    /**
     * 获取单例实例
     * @returns {FilesManager} FilesManager的单例实例
     */
    public static getInstance() {
        if (!FilesManager.instance) {
            FilesManager.instance = new FilesManager()
        }
        return FilesManager.instance
    }

    /**
     * 私有构造函数
     * 防止外部直接实例化
     * @private
     */
    private constructor() {
    }

    /**
     * 保存文件到映射表
     * 解析文件并将文件信息存储到filesMap中
     * @param {string[]} files - 文件路径数组
     * @returns {Promise<void>} 无返回值
     */
    public async saveFiles(files: string[]) {
        for (const file of files) {
            let content = ''
            try{
                 content = await this.parseFile(file) // 解析文件内容
            }catch(error){
                content =  `文件${path.basename(file)}解析失败`
            }
            const fileInfo: IFileInfo = {
                content,
                size: fs.statSync(file).size, // 获取文件大小
                name: path.basename(file), // 获取文件名
                filePath: file // 文件路径
            }
            this.filesMap.set(fileInfo.name, fileInfo) // 存储到映射表
        }
    }

    /**
     * 获取文件内容
     * 根据文件名数组从映射表中获取对应文件的内容
     * @param {string[]} files - 文件名数组
     * @returns {string[]} 文件内容数组
     */
    public getFilesContent(files: string[]) {
        return files.map(file => this.filesMap.get(file)?.content || '') // 从映射表中获取文件内容
    }

    /**
     * 删除所有文件
     * 删除临时存储的文件并清空映射表
     * @returns {void} 无返回值
     */
    public deleteAllFile() {
        // 删除临时存储的文件
        this.filesMap.forEach(fileInfo => {
            if (fs.existsSync(fileInfo.filePath)) {
                fs.unlinkSync(fileInfo.filePath) // 删除文件
            }
        })
        // 移除缓存
        this.filesMap.clear() // 清空映射表
    }

    /**
     * 获取文件存储目录
     * 返回Electron应用的用户数据目录下的files目录
     * @returns {string} 文件存储目录路径
     */
    public getFileDir() {
        const userDataPath = app.getPath('userData') // 获取Electron应用的用户数据目录
        const filesDir = path.join(userDataPath, 'files') // 拼接files目录路径
        return filesDir
    }
}

/**
 * 文件管理器单例实例
 * 导出FilesManager的单例实例，供外部使用
 */
export default FilesManager.getInstance()
