import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
    try {
      // Step 1: Check if cookies are defined and contain the jwt token
      if (!req.cookies || !req.cookies.jwt) {
        // If the cookie is missing, the user is not logged in
        return res.status(401).json({ error: "You must be logged in" });
      }
  
      // Step 2: Extract the token from the cookie
      const token = req.cookies.jwt;
  
      // Step 3: Verify the token using JWT_SECRET
      const decode = jwt.verify(token, process.env.JWT_SECRET);
  
      if (!decode) {
        // If the token is invalid, return an error
        return res.status(401).json({ error: "Invalid Token" });
      }
  
      // Step 4: Use the decoded token to find the user in the database
      const user = await User.findById(decode.userId).select("-password");
  
      if (!user) {
        // If no user is found, return an error
        return res.status(401).json({ error: "User not found" });
      }
  
      // Step 5: Attach the user object to the request (for the next function to use)
      req.user = user;
  
      // Step 6: Call `next()` to pass control to the next middleware or route handler
      next();
    } catch (error) {
      console.log("Error in protective middleware ", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  
