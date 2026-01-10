import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express, { json, urlencoded, Request, Response } from 'express'
import mongoose from 'mongoose'
import path from 'path'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'

import { DB_ADDRESS } from './config'
import errorHandler from './middlewares/error-handler'
import serveStatic from './middlewares/serverStatic'
import routes from './routes'

// CORS настройки - явно указываем origin
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', 'http://localhost']

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        // Разрешаем запросы без origin (curl, мобильные приложения)
        if (!origin) {
            return callback(null, true)
        }
        
        if (allowedOrigins.includes(origin)) {
            callback(null, origin) // Возвращаем конкретный origin, а не true
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
}

// Rate limiting - строгий лимит
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // 100 запросов на 15 минут
    message: { message: 'Слишком много запросов, попробуйте позже' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
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
app.use(cors(corsOptions))
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
