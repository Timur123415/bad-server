import { basename, join, resolve } from 'path'
import { existsSync, rename } from 'fs'

function movingFile(imagePath: string, from: string, to: string) {
    // Извлекаем только имя файла, убирая любые пути
    const fileName = basename(imagePath)
    
    // Проверяем, что имя файла не содержит опасных символов
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
        throw new Error('Недопустимое имя файла')
    }
    
    const resolvedFrom = resolve(from)
    const resolvedTo = resolve(to)
    
    const imagePathTemp = join(resolvedFrom, fileName)
    const imagePathPermanent = join(resolvedTo, fileName)
    
    // Проверяем, что пути не выходят за пределы разрешённых директорий
    if (!resolve(imagePathTemp).startsWith(resolvedFrom)) {
        throw new Error('Недопустимый путь источника')
    }
    if (!resolve(imagePathPermanent).startsWith(resolvedTo)) {
        throw new Error('Недопустимый путь назначения')
    }
    
    if (!existsSync(imagePathTemp)) {
        throw new Error('Файл не найден')
    }

    rename(imagePathTemp, imagePathPermanent, (err) => {
        if (err) {
            throw new Error('Ошибка при сохранении файла')
        }
    })
}

export default movingFile;