import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";


import multer from "multer";
import multerS3 from "multer-s3";
import sharp from "sharp";

import {
  getSignedUrl
} from "@aws-sdk/s3-request-presigner";
import { createHash } from "crypto";
import { NextFunction } from "express";
import { NotFoundError } from "../errors";
import { decodeBase64 } from "bcryptjs";


const computeHash = (buffer: Buffer): string => {
  return createHash("sha256").update(buffer).digest("hex");
};

const s3 = new S3Client();

const bucketName = process.env.AWS_BUCKET_NAME || "motopay-s3-bucket";
const bucketRegion = process.env.AWS_REGION || "eu-north-1";

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

export const singleImageUpload = multer({
  storage: multer.memoryStorage(), // Temporarily store the file in memory,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 * 1024 },
}).single("image");

export const multipleImageUpload = multer({
  storage: multerS3({
    s3,
    bucket: "motopay-s3-bucket",
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, Date.now().toString + "-" + file.originalname);
    },
  }),
  fileFilter,
  limits: { fileSize: 4 * 1024 * 1024, files: 8 },
});

export const uploadToS3 = async (req, res, next) => {
  const bucket = "motopay-s3-bucket";

  if (!req.file) {
    throw new NotFoundError("No file uploaded.");
  }

  // const fileHash = computeHash(req.file.buffer);
  // const key = `${fileHash}-${req.file.originalname}`;
  const key = computeHash(req.file.buffer);

  try {
    // Check if the file already exists in S3
    await s3.send(
      new HeadObjectCommand({
        Bucket: "motopay-s3-bucket",
        Key: key,
      })
    );

    return key;

    // const command = new GetObjectCommand({
    //   Bucket: "motopay-s3-bucket",
    //   Key: key,
    // });

    // console.log(command);

    // const imageUrl = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${key}`

    // on save
    // - encrypt the url and save to db plus key

    // on fetching
    //   - pass the encrypted url (plus key) to the FE)
    // - decrypt the url on the FE

    // const url = await createPresignedUrl({ command });
    // return url;

    // const response = await s3.send(command);
    // const str = await response.Body.transformToString();
    // console.log(str);
    // return res.send(str);
  } catch (err) {
    console.error(err);
    // Network error
    if (err.code === "ENOTFOUND") {
      return res.status(500).json({
        status: "error",
        message: "Network error",
      });
    }

    // Resize image
    const buffer = await sharp(req.file.buffer)
      .resize({
        height: 400,
        width: 400,
        fit: "contain",
      })
      .toBuffer();

    // If the file doesn't exist, upload it to S3
    if (err.$metadata?.httpStatusCode === 404) {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer || req.file.buffer,
        ContentType: req.file.mimetype,
        Metadata: { fieldName: req.file.fieldname },
      });

      await s3.send(command);

      return key;
    } else {
      console.error(err.message);
      return res.status(500).json({
        status: "error",
        message: "Error processing file.",
      });
    }
  }
};

export const getImageUrl = async (
  profilePictureName: string,
  next: NextFunction
) => {
  try {
    const getObjectParams = {
      Bucket: bucketName,
      Key: profilePictureName,
    };

    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3, command, { expiresIn: 60 });

    return url;
  } catch (err) {
    console.error(err);
    next(err);
  }
};
