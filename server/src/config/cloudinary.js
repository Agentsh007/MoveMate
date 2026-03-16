// =============================================
// Cloudinary Configuration — Image Upload Service
// =============================================
// WHY Cloudinary?
// Storing images on your own server is expensive and slow.
// Cloudinary is a CDN (Content Delivery Network) that:
// - Stores images in the cloud
// - Serves them from servers closest to the user
// - Can resize, crop, optimize images on the fly
// - Handles format conversion (WebP for modern browsers)
//
// The upload() function takes a file path (from Multer)
// and returns a Cloudinary URL you store in your database.
// =============================================

import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
