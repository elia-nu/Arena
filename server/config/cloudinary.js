import "./env.js";
import { v2 as cloudinary } from "cloudinary";

/**
 * Re-reads environment variables and configures Cloudinary.
 * Supports both CLOUDINARY_URL or individual keys (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).
 */
export const configureCloudinary = () => {
  const rawUrl = process.env.CLOUDINARY_URL?.trim().replace(/^["']+|["']+$/g, "");
  if (rawUrl) {
    try {
      const match = rawUrl.match(
        /^cloudinary:\/\/([^:]+):([^@]+)@([^\r\n]+)$/
      );
      if (match) {
        cloudinary.config({
          api_key: match[1].trim(),
          api_secret: match[2].trim(),
          cloud_name: match[3].trim(),
          secure: true,
        });
        return true;
      }
    } catch (e) {
      console.error("Failed to parse CLOUDINARY_URL:", e);
    }
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim().replace(/^["']+|["']+$/g, "");
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim().replace(/^["']+|["']+$/g, "");
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim().replace(/^["']+|["']+$/g, "");

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    return true;
  }

  return false;
};

/**
 * Checks if Cloudinary credentials are set and configured in environment.
 */
export const isCloudinaryConfigured = () => {
  return configureCloudinary();
};

// Initialize config on load
configureCloudinary();

/**
 * Upload a local file to Cloudinary with automatic resource type detection (image or video).
 *
 * @param {string} filePath - Path on disk to the temporary file
 * @param {object} options - Optional cloudinary upload settings
 * @returns {Promise<object>} Cloudinary upload result
 */
export const uploadFileToCloudinary = (filePath, options = {}) => {
  configureCloudinary();
  return cloudinary.uploader.upload(filePath, {
    folder: "arena",
    resource_type: "auto",
    ...options,
  });
};

/**
 * Upload from a memory buffer into Cloudinary via stream.
 *
 * @param {Buffer} buffer - Buffer to stream
 * @param {object} options - Optional cloudinary upload settings
 * @returns {Promise<object>} Cloudinary upload result
 */
export const uploadBufferToCloudinary = (buffer, options = {}) => {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "arena",
        resource_type: "auto",
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * Delete a resource from Cloudinary by public ID.
 *
 * @param {string} publicId - The Cloudinary public_id
 * @param {'image'|'video'|'raw'} resourceType - Type of resource
 */
export const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    configureCloudinary();
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error("Cloudinary destroy error:", error);
    return null;
  }
};

export default cloudinary;

