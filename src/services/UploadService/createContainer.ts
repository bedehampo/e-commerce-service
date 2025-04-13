import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";

const { v1: uuidv1 } = require("uuid");
require("dotenv").config();

export const createContainer = async (file: any) => {
  try {
    console.log("Azure Blob storage v12 - JavaScript quickstart sample");
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    console.log(accountName);

    if (!accountName) throw Error("Azure Storage accountName not found");
    const accountKey = process.env.AZURE_STORAGE_CONNECTION_STRING;

    console.log(accountKey);

    if (!accountKey) {
      throw Error("Azure Storage Connection string not found");
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
    const containerName = "images" + uuidv1();

    console.log("\nCreating container...");
    console.log("\t", containerName);

    // Get a reference to a container
    const containerClient = blobServiceClient.getContainerClient(containerName);
    // Create the container
    const createContainerResponse = await containerClient.create();
    console.log(
      `Container was created successfully.\n\trequestId:${createContainerResponse.requestId}\n\tURL: ${containerClient.url}`
    );
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
};
