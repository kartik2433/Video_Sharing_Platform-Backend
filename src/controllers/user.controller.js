import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async(req,res) => {
    const { fullName, email, username, password } = req.body;
    console.log("fullname: ",fullName);
    console.log("email: ",email);

    if( [fullName, email, username, password].some((field) => field === "") ){
        throw new ApiError(400,"All Fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    // console.log(existedUser);

    if (existedUser){
        throw new ApiError(400,"User already exists");
    }

    console.log(req.files);
    const avatarLocalPath = req?.files?.avatar[0]?.path;
  
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required");
    }

   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar){
        throw new ApiError(400,"Avatar is required");
    }

    const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase(),
    });
    // console.log(user);
    
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    console.log(createdUser);
    
    if(!createdUser){
        throw new ApiError(500,"Something Went Wrong While registering User");
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser, "User Registered Successfully")
    )

    // return res.status(200).json({
    //   message: "Register Successfully...!!!",
    // });
})

export {registerUser}
/* 
    Steps of registering user:
    1. Get user details from the request body
    2. Validate user details - not empty
    3. Check if user already exists: usename , email
    4. check for images, check for avatar
    5. upload them to cloudinary, avatar
    6. create user object - create entry in db
    7. remove password and refresh token field from response
    8. check for user creation
    9. return response


    res.status(200).json({
        message: "Register Successfully...!!!"
    })

*/