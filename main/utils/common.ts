/**
 * 安全地解析 JSON 字符串。
 * @param str - 要解析的字符串。
 * @returns 解析成功则返回 JavaScript 对象/值，失败则返回 null。
 */
export const safeParseJSON = <T = unknown>(str: string | null | undefined): T | null => {
    // 1. 处理 null, undefined, 空字符串
    if (!str) {
        console.warn("⚠️ JSON 输入为空:", str)
        return null
    }

    // 2. 确保输入是字符串
    if (typeof str !== 'string') {
        console.warn("⚠️ 输入非字符串类型:", str)
        return null
    }

    const s = str.trim()

    // 3. (可选) 快速检查 JSON 开头，可以避免对明显非JSON的字符串进行解析
    // 这个检查可以捕获大部分简单错误，但无法保证100%准确（如 '{"a": 1' 这种不完整的JSON）
    if (!(s.startsWith('{') || s.startsWith('['))) {
        console.warn("⚠️ 输入不以 { 或 [ 开头:", s)
        return null
    }

    try {
        // 4. 使用泛型，让调用者可以指定期望的返回类型
        return JSON.parse(s) as T
    } catch (e) {
        console.error("❌ JSON 解析失败:", s, e)
        return null
    }
}
