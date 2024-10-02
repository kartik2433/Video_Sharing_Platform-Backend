import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async(userId)=>{
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // console.log(user.refreshToken)               

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave : false });

        // const userData = await User.findById(userId);  // To check if refreshToken is saved in db or not
        // console.log(userData.refreshToken)             

        return  {accessToken,refreshToken}; 
    }catch(error){
        throw new ApiError("An error occured while generating tokens")
    }
} 

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
    // console.log(req.files);
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

const loginUser = asyncHandler(async(req,res) => {
    const {username,email,password} = req.body;
    
    if(!username && !email){
        throw new ApiError(400, "Username or Email is Required..!!")
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,'User Does Not Exist')
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(400, "Invalid Credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    const loggedInUser = await  User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200, {
          user: loggedInUser,accessToken,refreshToken
        },
        "User Logged In Successfully."
        )
      );

})

const logoutUser = asyncHandler(async(req,res) => {
    User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: {
          refreshToken,
        },
      },
      {
        new: true,
      }
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(
        new ApiResponse(200, {}, "User logged Out")
      ) 
})

const refreshAccessToken = asyncHandler(async(req,res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  console.log(incomingRefreshToken)
  
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh Token Not Received.")
  }
  
  const decodeToken = jwt.verify(incomingRefreshToken,  process.env.REFRESH_TOKEN_SECRET);
  console.log(decodeToken)
  const user = await User.findById(decodeToken?._id);

  if(!user){
    throw new ApiError(404, "User Not Found...!!!")
  }

  if(incomingRefreshToken !== user.refreshToken){
    throw new ApiError(404, "Refresh Token Expired")
  }

  const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
  
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, {
        accessToken, refreshToken
      })
    )

})

const changeCurrentPassword = asyncHandler(async(req,res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = user.isPasswordCorrect(currentPassword)
  if( !isPasswordCorrect ){
    throw new ApiError(400, "Given Password is not correct.")
  }
  user.password = newPassword;
  await user.save({validateBeforeSave: false}); // To bypass the validation of password

  return res.status(200).json(new ApiResponse(200,"Password has been changed successfully"));
})

const getCurrentUser = asyncHandler(async(req,res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "User Fetched Successfully."));
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullName,email} = req.body
    console.log(req.body)
    if( !(fullName || email) ){ 
      throw new ApiError(400,"Fields Required...!!")
    }
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          fullName: fullName || req.user?.fullName,
          email: email || req.user?.email,
        },
      },
      {
        new: true,
      }
    ).select("-password");
    
    return res.status(200).json(new ApiResponse(200, user, "User Profile Changed Successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res) => {
    const avatarLocalPath = req?.files?.avatar[0]?.path

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const user = await User.findByIdAndUpdate(req.user?._id, 
      {
        $set : {
          avatar: avatar.url
        }
      },
      {
        new:true,
      }
    )
    return res.status(200).json(new ApiResponse(200, user, "Avatar Changed Successfully"))
})

const updateUserCoverImage = asyncHandler(async(req,res) => {
    const coverImageLocalPath = req?.files?.coverImage[0]?.path

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    const user = await User.findByIdAndUpdate(req.user?._id,
      {
        $set: {
          coverImage: coverImage.url
        }
      },
      {
        new: true,
      }
    )

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Cover Image Changed Successfully"));
})

export { 
  registerUser, 
  loginUser, 
  logoutUser, 
  refreshAccessToken, 
  changeCurrentPassword, 
  getCurrentUser, 
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage
};

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
