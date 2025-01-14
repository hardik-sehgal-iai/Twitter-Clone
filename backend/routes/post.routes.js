import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { commentOnPost, createPost, deletePost, getFollowingPosts, getLikedPosts, getPosts, getUserPosts, likeUnlikePost } from "../controllers/post.controller.js";

const router = express.Router();

router.get('/getPosts',protectRoute,getPosts);
router.get('/getFollowingPosts',protectRoute,getFollowingPosts);
router.get('/likes/:id',protectRoute,getLikedPosts);
router.get('/userPosts/:username',protectRoute,getUserPosts);
router.post('/create',protectRoute,createPost);
router.post('/like/:id',protectRoute,likeUnlikePost);
router.post('/comment/:id',protectRoute,commentOnPost);
router.delete('/delete/:id',protectRoute,deletePost);

export default router; 