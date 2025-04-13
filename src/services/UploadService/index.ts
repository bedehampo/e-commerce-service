import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  BlockBlobClient,
} from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
// Use dynamic import instead
// import * as intoStream from "into-stream";
import { NotFoundError, ServiceError } from "../../errors";
import config from "../../config";
// const { v1: uuidv1 } = require("uuid");
require("dotenv").config();

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

interface MulterRequest extends Request {
  file: MulterFile;
}

const getBlobName = (originalName) => {
  const identifier = Math.random().toString().replace(/0\./, ""); // remove "0." from start of string
  return `${identifier}-${originalName}`;
};

export const uploadBlobService = async (file: MulterFile) => {
  console.log(file);
  try {
    const accountName = config.azure.storage_account_name;
    console.log(accountName);

    if (!accountName)
      throw new NotFoundError("Azure Storage accountName not found");
    const accountKey = config.azure.storage_account_key;

    console.log(accountKey);

    if (!accountKey) {
      throw new NotFoundError("Azure Storage Connection string not found");
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(
      accountName,
      accountKey
    );

    // Create the BlobServiceClient object with connection string
    const blobServiceClient = new BlobServiceClient(
      "https://devmotopaymp.blob.core.windows.net",
      sharedKeyCredential
    );

    // Create a unique name for the container
    const containerName = config.azure.storage_container_name;

    // Get a reference to a container
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobName = getBlobName(file.originalname);
    // const blobName = getBlobName(file.originalname),
    //   blobService = new BlockBlobClient(
    //     process.env.AZURE_STORAGE_CONNECTION_STRING,
    //     containerName,
    //     blobName
    //   ),
    //   //@ts-ignore
    //   stream = intoStream(file.buffer),
    //   //@ts-ignore
    //   streamLength = file.buffer.length;
    // blobService
    //   .uploadStream(stream, streamLength)
    //   .then((data) => {
    //     console.log(data);
    //     console.log("successfully uploaded");
    //   })
    //   .catch((err) => {
    //     throw new ServiceError(err);
    //   });
    // // Get a block blob client

    // Create a unique name for the blob
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Display blob name and url
    console.log(
      `\nUploading to Azure storage as blob\n\tname: ${blobName}:\n\tURL: ${blockBlobClient.url}`
    );

    // Upload data to the blob

    const uploadBlobResponse = await blockBlobClient.upload(
      //@ts-ignore
      file.buffer,
      //@ts-ignore
      file.buffer.length,
      {
        blobHTTPHeaders: {
          blobContentType: file.mimetype,
        },
      }
    );

    console.log(
      `Blob was uploaded successfully. requestId: ${uploadBlobResponse.requestId}`
    );
    return blockBlobClient.url;
  } catch (err) {
    console.log(`Error: ${err.message}`);
    throw new ServiceError(err.message);
  }
};

// main()
//   .then(() => console.log("Done"))
//   .catch((ex) => console.log(ex.message));
