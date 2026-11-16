import { v2 as cloudinary } from "cloudinary";

/**
 * Re-reads environment variables and configures Cloudinary.
 * Supports both CLOUDINARY_URL or individual keys (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).
 */
export const configureCloudinary = () => {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({
      cloudinary_url: process.env.CLOUDINARY_URL,
    });
    return true;
  }

  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    return true;
  }

  return false;
};

/**
 * Checks if Cloudinary credentials are set in environment.
 */
export const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET)
  );
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

