import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";

import Notification from "../models/notification.model.js";
import bcrypt from "bcryptjs";

export const getUserProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.log("Error in getUserProfile", error);
    res.status(500).json({ error: error.message });
  }
};

export const followUnFollowUser = async (req, res) => {
  try {
    const { id } = req.params; // ID of the user to follow/unfollow
    const userToModify = await User.findById(id); // User being followed/unfollowed
    const currentUser = await User.findById(req.user._id); // Logged-in user

    if (!userToModify || !currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the user is trying to follow/unfollow themselves
    if (id === req.user._id.toString()) {
      return res
        .status(400)
        .json({ error: "You cant follow or unfollow yourself" });
    }

    // Check if already following
    const isFollowing = currentUser.following
      .map((f) => f.toString())
      .includes(id);
    console.log("Is following:", isFollowing);

    if (isFollowing) {
      // Unfollow the user
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
      console.log("User unfollowed:", id);
      return res
        .status(200)
        .json({ success: true, message: "User unfollowed successfully" });
    } else {
      // Follow the user
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
      console.log("User followed:", id);

      // Save notification
      const newNotifications = new Notification({
        type: "follow",
        from: req.user._id,
        to: userToModify._id,
      });
      await newNotifications.save();
      console.log("Notification saved:", newNotifications);

      return res
        .status(200)
        .json({ success: true, message: "User followed successfully" });
    }
  } catch (error) {
    console.log("Error in followUnFollowUser", error);
    res.status(500).json({ error: error.message });
  }
};

export const getSuggestedUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentUser = await User.findById(userId); // Current user
    const usersFollowedByMe = await User.findById(userId).select("following"); // Users followed by the current user

    // Get users where the current user's ID is not in their list
    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId }, // Exclude the current user
        },
      },
      {
        $sample: {
          size: 10, // Randomly select 10 users
        },
      },
    ]);

    // Filter out users already followed by the current user
    const filteredUsers = users.filter(
      (user) =>
        !usersFollowedByMe.following
          .map((f) => f.toString())
          .includes(user._id.toString())
    );

    // Limit to 4 suggested users
    const suggestedUsers = filteredUsers.slice(0, 4);

    // Exclude passwords from the response
    suggestedUsers.forEach((user) => (user.password = null));

    // Send response
    res.status(200).json(suggestedUsers);
  } catch (error) {
    console.log("Error in getSuggestedUser", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  const { fullName, email, username, bio, link } = req.body;
  let { profileImg, coverImg } = req.body;
  const userId = req.user._id;

  try {
    // Find the user
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Handle profile image update
    if (profileImg) {
      if (user.profileImg) {
        // Delete the old profile image from Cloudinary
        await cloudinary.uploader.destroy(
          user.profileImg.split("/").pop().split(".")[0]
        );
      }
      // Upload new profile image to Cloudinary
      const uploadedResponse = await cloudinary.uploader.upload(profileImg);
      profileImg = uploadedResponse.secure_url;
    }

    // Handle cover image update
    if (coverImg) {
      if (user.coverImg) {
        // Delete the old cover image from Cloudinary
        await cloudinary.uploader.destroy(
          user.coverImg.split("/").pop().split(".")[0]
        );
      }
      // Upload new cover image to Cloudinary
      const uploadedResponse = await cloudinary.uploader.upload(coverImg);
      coverImg = uploadedResponse.secure_url;
    }

    // Update user fields
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.username = username || user.username;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;

    // Save the updated user
    await user.save();

    // Remove password from the response
    const { password, ...updatedUser } = user.toObject();

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error in updateUser:", error);
    res.status(500).json({ error: error.message });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  try {
    // Validate that both passwords are provided
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current and new password are required" });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the current password matches the stored password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Validate the new password length
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Save the updated user
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.log("Error in changePassword:", error);
    res.status(500).json({ error: error.message });
  }
};
