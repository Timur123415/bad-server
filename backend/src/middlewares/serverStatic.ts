import { NextFunction, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'

export default function serveStatic(baseDir: string) {
    const resolvedBase = path.resolve(baseDir)
    
    return (req: Request, res: Response, next: NextFunction) => {
        // Нормализуем путь и проверяем на path traversal
        const requestedPath = path.normalize(req.path).replace(/^(\.\.[\/\\])+/, '')
        const filePath = path.join(resolvedBase, requestedPath)
        const resolvedPath = path.resolve(filePath)
        
        // Проверяем, что путь не выходит за пределы базовой директории
        if (!resolvedPath.startsWith(resolvedBase)) {
            return res.status(403).send('Forbidden')
        }
        
        fs.access(resolvedPath, fs.constants.F_OK, (err) => {
            if (err) {
                return next()
            }
            return res.sendFile(resolvedPath, (err) => {
                if (err) {
                    next(err)
                }
            })
        })
    }
}
