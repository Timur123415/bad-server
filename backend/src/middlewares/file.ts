import { Request, Response, NextFunction, Express } from 'express'
import multer, { FileFilterCallback } from 'multer'
import { join } from 'path'
import crypto from 'crypto'
import path from 'path'
import sharp from 'sharp'
import fs from 'fs'

type DestinationCallback = (error: Error | null, destination: string) => void

const MIN_FILE_SIZE = 2 * 1024 // 2KB
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const storage = multer.diskStorage({
    destination: (
        _req: Request,
        _file: Express.Multer.File,
        cb: DestinationCallback
    ) => {
        cb(
            null,
            join(
                __dirname,
                process.env.UPLOAD_PATH_TEMP
                    ? `../public/${process.env.UPLOAD_PATH_TEMP}`
                    : '../public'
            )
        )
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase()
        const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg']
        
        if (!allowedExtensions.includes(ext)) {
            return cb(new Error('Недопустимое расширение файла'), '')
        }
        
        const uniqueName = `${crypto.randomUUID()}${ext}`
        cb(null, uniqueName)
    },
})

const types = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
]

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    if (!types.includes(file.mimetype)) {
        return cb(null, false)
    }

    return cb(null, true)
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1,
    },
})

// Middleware для проверки минимального размера файла
export const checkMinFileSize = (req: Request, res: Response, next: NextFunction) => {
    if (req.file && req.file.size < MIN_FILE_SIZE) {
        // Удаляем файл
        fs.unlink(req.file.path, () => {})
        return res.status(400).json({ message: 'Файл слишком маленький. Минимальный размер: 2KB' })
    }
    next()
}

// Middleware для очистки метаданных изображения
export const stripImageMetadata = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
        return next()
    }

    const filePath = req.file.path
    const ext = path.extname(filePath).toLowerCase()
    
    // SVG не обрабатываем через sharp
    if (ext === '.svg') {
        return next()
    }

    try {
        const tempPath = `${filePath}.tmp`
        
        // Читаем изображение и удаляем метаданные
        await sharp(filePath)
            .rotate() // Автоматически применяет ориентацию из EXIF
            .toFile(tempPath)
        
        // Заменяем оригинальный файл
        fs.unlinkSync(filePath)
        fs.renameSync(tempPath, filePath)
        
        next()
    } catch (error) {
        // Удаляем файл при ошибке
        fs.unlink(filePath, () => {})
        return res.status(400).json({ message: 'Ошибка обработки изображения' })
    }
}

export default upload
