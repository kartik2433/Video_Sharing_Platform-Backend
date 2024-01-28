import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) return null

        // Upload File On Cloudinary
        const response = cloudinary.uploader.upload(
          localFilePath,
          { resource_type: "auto" },
        );
        // File Has Been Uploaded Successfully
        console.log("File is uploaded on Cloudinary.", response.url);
        return response;
    }catch(error){
        fs.unlinkSync(localFilePath)  // Remove the localy Saved Temporary File as the upload Operation got failed.  
        return null;
    }
}


export {uploadOnCloudinary}