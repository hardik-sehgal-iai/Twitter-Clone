import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { followUnFollowUser, getUserProfile, getSuggestedUser, updateUser, changePassword } from "../controllers/user.controller.js";

const router = express.Router();

router.get('/profile/:username',protectRoute , getUserProfile);
router.get('/suggested/',protectRoute , getSuggestedUser);
router.post('/follow/:id',protectRoute , followUnFollowUser);
router.post('/update',protectRoute ,updateUser);
router.post('/changePassword',protectRoute ,changePassword);


export default router;
