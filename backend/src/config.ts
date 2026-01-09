// config.ts
import { CookieOptions } from 'express'
import ms from 'ms'

// Проверяем наличие обязательных переменных окружения
const getEnvVar = (name: string, defaultValue?: string): string => {
    const value = process.env[name] || defaultValue
    if (!value) {
        throw new Error(`Environment variable ${name} is required`)
    }
    return value
}

export const DB_ADDRESS = getEnvVar('DB_ADDRESS', 'mongodb://localhost:27017/weblarek')

export const ACCESS_TOKEN = {
    secret: getEnvVar('AUTH_ACCESS_TOKEN_SECRET', 'your-access-token-secret-dev-only'),
    expiry: getEnvVar('AUTH_ACCESS_TOKEN_EXPIRY', '15m'),
}

export const REFRESH_TOKEN = {
    secret: getEnvVar('AUTH_REFRESH_TOKEN_SECRET', 'your-refresh-token-secret-dev-only'),
    expiry: getEnvVar('AUTH_REFRESH_TOKEN_EXPIRY', '7d'),
    cookie: {
        name: 'refreshToken',
        options: {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: ms(getEnvVar('AUTH_REFRESH_TOKEN_EXPIRY', '7d')),
            path: '/',
        } as CookieOptions,
    },
}
