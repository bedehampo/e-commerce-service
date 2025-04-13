import multer from "multer"
import { ValidationError } from "../errors"
import { NextFunction } from "express"

 // Use multer for image upload
  const storage = multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, 'public/uploads')
    },
    filename: (req:any, file, callback) => {
      const ext = file.mimetype.split('/')[1]
      const fileName = `${file.originalname}-${file.fieldname}-${Date.now()}.${ext}`
      callback(null, fileName);
    }
  })

  // Validate that file being uploaded is an image
  const multerFilter = (req: any, file: any, callback: any) => {
   if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      callback(null, true);
    } else {
     return new ValidationError('Only images are allowed');
    }
  }

export const upload = multer({
  storage: storage,
  fileFilter: multerFilter,
 })