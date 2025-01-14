import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import { v2 as cloudinary } from "cloudinary";
import User from "../models/user.model.js";

export const createPost = async (req, res) => {
  try {
    let { text } = req.body;
    let { image } = req.body;
    const userId = req.user._id.toString();
    if (!userId) {
      return res.status(401).json({ message: "User not found" });
    }
    if (!text && !image) {
      return res
        .status(400)
        .json({ message: "Please provide either text or image" });
    }
    if (image) {
      const uploadedResponse = await cloudinary.uploader.upload(image);
      image = uploadedResponse.secure_url;
    }
    const newPost = new Post({
      user: userId,
      text: text,
      image: image,
    });
    await newPost.save();
    res
      .status(201)
      .json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    console.error("error in createPost in post.controller.js ", error);
    res.status(500).json({ message: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    // post.user is the ID of the user who created the post (retrieved from the database).
    // req.user._id is the ID of the currently logged-in user (retrieved from the JWT token).
    if (post.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this post" });
    }
    if (post.image) {
      const imageId = post.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imageId);
    }
    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("error in deletePost in post.controller.js ", error);
    res.status(500).json({ message: error.message });
  }
};
// console.log(post.user);         // ObjectId("6445e72b9c1e8d0012345678")
// console.log(req.user._id);      // ObjectId("6445e72b9c1e8d0012345678")

// console.log(post.user === req.user._id);        // false (compares objects, not values)
// console.log(post.user.toString() === req.user._id.toString());  // true (compares string values)

export const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user._id;
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (!text) {
      return res.status(400).json({ message: "Please enter a comment" });
    }
    const comments = { user: userId, text };
    post.comments.push(comments);
    await post.save();
    res.status(200).json({ message: "Comment added successfully" });
  } catch (error) {
    console.error("error in commentOnPost in post.controller.js ", error);
    res.status(500).json({ message: `Internal server error ${error.message}` });
  }
};

export const likeUnlikePost = async (req, res) => {
  try {
    const userId = req.user._id.toString(); // Convert to string for comparison
    const postId = req.params.id; // Get the post ID from params
    const post = await Post.findById(postId); // Find the post in the database

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the user has already liked the post
    // const isLiked = post.likes.map((like) => like.toString()).includes(userId);
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // If the user has already liked the post, unlike it
      await Post.findByIdAndUpdate(
        postId, // The post's ID
        { $pull: { likes: userId } } // Remove the user's ID from the likes array
      );
      await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });
      return res.status(200).json({ message: "Post unliked successfully" });
    } else {
      // Otherwise, add the user's ID to the likes array
      await Post.findByIdAndUpdate(
        postId, // The post's ID
        { $push: { likes: userId } } // Add the user's ID to the likes array
      );
      await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
      const notification = new Notification({
        from: userId,
        to: postId,
        type: "like",
      });
      await notification.save();
      return res.status(200).json({ message: "Post liked successfully" });
    }
  } catch (error) {
    console.error("Error in likeUnlikePost:", error);
    res.status(500).json({ message: error.message });
  }
};
export const getPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    // const posts = await Post.findById(userId);
    //sort({createdAt:-1}) gives us the latest post
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });
    // The "user" here refers to the field in your Post schema
    // user: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'User',
    //   required: true
    // }

    /*The ref: 'User' part tells Mongoose that the user field in the Post schema refers to the User model.
    When we use populate, we specify the field name (in this case, "user"), not the model name ("User"). */
    if (posts.length === 0) {
      return res.status(200).json([]);
    }
    return res.status(200).json(posts);
  } catch (error) {
    console.error("Error in getPosts:", error);
    res.status(500).json({ message: error.message });
  }
};
// this is for other users so that we can see what posts they have liked
export const getLikedPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    // const likedPosts = await User.find(userId)
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // _id will be the postid
    const likedPosts = await Post.find({
      _id: { $in: user.likedPosts }, // Match posts whose IDs are in the user's likedPosts array
    })
      .populate({
        path: "user", // Populate the `user` field of the Post schema
        select: "-password", // Exclude the `password` field of the user document
      })
      .populate({
        path: "comments.user", // Populate the `comments` field of the Post schema
        select: "-password", // Exclude the `password` field of the user document
      });

    if (likedPosts.length === 0) {
      return res.status(200).json([]);
    }
    return res.status(200).json(likedPosts);
  } catch (error) {
    console.error("Error in getLikedPosts:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getFollowingPosts = async (req, res) => {
  const userId = req.user._id;
  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const following = user.following;
    let feedPosts = await Post.find({ user: { $in: following } })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });
    if (feedPosts.length === 0) {
      return res.status(200).json([]);
    }
    res.status(200).json({
      feedPosts,
    });
  } catch (error) {
    console.error("Error in getFollowingPosts:", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });
    res.status(200).json({ posts });
  } catch (error) {
    console.error("Error in getUserPosts:", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
