import { Router } from 'express'
import { uploadFile } from '../controllers/upload'
import fileMiddleware, { checkMinFileSize, stripImageMetadata } from '../middlewares/file'

const uploadRouter = Router()
uploadRouter.post('/', fileMiddleware.single('file'), checkMinFileSize, stripImageMetadata, uploadFile)

export default uploadRouter
