import { generateTokenSetCookie } from "../lib/utils/generateToken.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid Email Format" });
    }

    // Check for existing username and email
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: "Username already exists" });
    }
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already exists" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user with default values
    const newUser = new User({
      fullName,
      username,
      email,
      password: hashedPassword,
      followers: [], // Default to an empty array
      following: [], // Default to an empty array
      coverImg: "", // Default to an empty string
      profileImg: "", // Default to an empty string
    });

    // Save user and generate token
    await newUser.save();
    generateTokenSetCookie(newUser._id, res);

    res.status(201).json({
      message: "User created successfully",
      _id: newUser._id,
      fullName: newUser.fullName,
      username: newUser.username,
      email: newUser.email,
      followers: newUser.followers,
      following: newUser.following,
      profileImg: newUser.profileImg,
      coverImg: newUser.coverImg,
      bio: newUser.bio,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    //it compares 2 passwords one that user passes {password} and one in database {user.password}
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user?.password || ""
    );
    if (!user || !isPasswordCorrect) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    generateTokenSetCookie(user._id, res);
    // console.log("Response Cookies: ", res.getHeaders()["set-cookie"]);

    return res.status(200).json({
      message: "User logged in successfully",
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      followers: user.followers,
      following: user.following,
      profileImg: user.profileImg,
      coverImg: user.coverImg,
      bio: user.bio,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Internal Server Error ${error.message}` });
  }
};

export const logout = async (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res
      .status(200)
      .json({ success: true, message: "User logged out successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Internal Server Error ${error.message}` });
  }
};

export const getMe = async (req, res) => {
  try {
    // It Runs After protectRoute
    // The getMe function depends on the protectRoute middleware.
    // If protectRoute attaches req.user, this function can safely access req.user._id

    // Step 1: Use the user ID (from req.user) to find the user in the database
    const user = await User.findById(req.user._id).select("-password");

    // Step 2: Return the user data as a response
    return res.status(200).json(user);
  } catch (error) {
    console.error("error in getme controller ", error);
    res.status(500).json({ error: `Internal Server Error ${error.message}` });
  }
};
