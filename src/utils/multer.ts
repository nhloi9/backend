import multer, { type FileFilterCallback } from 'multer'
import { type Request } from 'express'
import { fileValidation } from '../constants'
const storage = multer.memoryStorage()
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (fileValidation.fileTypesAccepted.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('multer'))
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: fileValidation.fileMaxSize
  }
})
