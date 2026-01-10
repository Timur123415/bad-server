import { errors } from 'celebrate'
import { doubleCsrf } from 'csrf-csrf'
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
import authRouter from './routes/auth'
import orderRouter from './routes/order'
import auth from './middlewares/auth'

// CSRF защита
const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
    getSecret: () => process.env.CSRF_SECRET || 'super-secret-csrf-key-change-in-production',
    getSessionIdentifier: (req: Request) => {
        return req.ip || req.headers['user-agent'] || 'anonymous'
    },
    cookieName: 'csrf-token',
    cookieOptions: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
    },
    getCsrfTokenFromRequest: (req: Request) => req.headers['x-csrf-token'] as string,
})

// CORS настройки
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
}

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { message: 'Слишком много запросов, попробуйте позже' },
})

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: { message: 'Слишком много попыток входа' },
})

const { PORT = 3000 } = process.env
const app = express()

app.set('trust proxy', 1)

// Middleware
app.use(helmet())
app.use(cors(corsOptions))
app.use(cookieParser())
app.use(json({ limit: '10kb' }))
app.use(urlencoded({ extended: true, limit: '10kb' }))
app.use(serveStatic(path.join(__dirname, 'public')))

// Rate limiting
app.use(limiter)
app.use('/auth/login', authLimiter)
app.use('/auth/register', authLimiter)

// Endpoint для получения CSRF токена
app.get('/csrf-token', (req: Request, res: Response) => {
    const token = generateCsrfToken(req, res)
    res.json({ csrfToken: token })
})

// Routes
app.use('/auth', doubleCsrfProtection, authRouter)
app.use('/order', auth, doubleCsrfProtection, orderRouter)
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
