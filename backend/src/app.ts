import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express, { json, urlencoded, Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import path from 'path'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'

import { DB_ADDRESS } from './config'
import errorHandler from './middlewares/error-handler'
import serveStatic from './middlewares/serverStatic'
import routes from './routes'

// CORS настройки
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', 'http://localhost']

// Rate limiting
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 50,
    message: { message: 'Слишком много запросов, попробуйте позже' },
    standardHeaders: true,
    legacyHeaders: false,
})

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { message: 'Слишком много попыток входа' },
})

const { PORT = 3000 } = process.env
const app = express()

app.set('trust proxy', 1)

// Middleware
app.use(helmet())

// Ручной CORS middleware для гарантированной установки заголовков
app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin
    
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin)
        res.setHeader('Access-Control-Allow-Credentials', 'true')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-csrf-token')
    }
    
    // Preflight request
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204)
    }
    
    next()
})

app.use(cookieParser())
app.use(limiter)
app.use(json({ limit: '10kb' }))
app.use(urlencoded({ extended: true, limit: '10kb' }))
app.use(serveStatic(path.join(__dirname, 'public')))

// Auth rate limiting
app.use('/auth/login', authLimiter)
app.use('/auth/register', authLimiter)

// Routes
app.use(routes)

// Error handling
app.use(errors())
app.use(errorHandler)

const bootstrap = async () => {
    try {
        await mongoose.connect(DB_ADDRESS)
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}

bootstrap()
