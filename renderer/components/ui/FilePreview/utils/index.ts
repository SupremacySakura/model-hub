export function getFileTypeByName(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || ''

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext))
    return 'image'
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext))
    return 'video'
  if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext))
    return 'audio'
  if (['pdf'].includes(ext))
    return 'pdf'
  if (['doc', 'docx'].includes(ext))
    return 'word'
  if (['xls', 'xlsx', 'csv'].includes(ext))
    return 'excel'
  if (['ppt', 'pptx'].includes(ext))
    return 'ppt'
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext))
    return 'zip'

  return 'other'
}
