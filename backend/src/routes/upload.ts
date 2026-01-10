import { Router } from 'express'
import { uploadFile } from '../controllers/upload'
import fileMiddleware, { checkMinFileSize } from '../middlewares/file'

const uploadRouter = Router()
uploadRouter.post('/', fileMiddleware.single('file'), checkMinFileSize, uploadFile)

export default uploadRouter
