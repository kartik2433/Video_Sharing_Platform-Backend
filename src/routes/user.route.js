import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser)

// Secured Routes
router.route("/logout").post(verifyJWT ,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/getDetails").get(verifyJWT, getCurrentUser)
router.route("/update-details").post(verifyJWT, updateAccountDetails)

router.route("/update-avatar").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1
    }
  ]),
  verifyJWT,
  updateUserAvatar
)

router.route("/update-cover").post(
  upload.fields([
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  verifyJWT,
  updateUserCoverImage
);
export default router;