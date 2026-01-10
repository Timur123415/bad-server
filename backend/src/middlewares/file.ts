import { Request, Express } from 'express'
import multer, { FileFilterCallback } from 'multer'
import { join } from 'path'
import crypto from 'crypto'
import path from 'path'

type DestinationCallback = (error: Error | null, destination: string) => void
type FileNameCallback = (error: Error | null, filename: string) => void

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
export const checkMinFileSize = (req: Request, res: any, next: any) => {
    if (req.file && req.file.size < MIN_FILE_SIZE) {
        return res.status(400).json({ message: 'Файл слишком маленький. Минимальный размер: 2KB' })
    }
    next()
}

export default upload
