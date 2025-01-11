import jwt from "jsonwebtoken";

export const generateTokenSetCookie = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '15d',
    });
    res.cookie("jwt", token, {
        maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
        httpOnly: true, // Prevent XSS attacks
        secure: process.env.NODE_ENV !== 'development', // Use secure cookie in production
        sameSite: 'strict', // Prevent CSRF attacks
    });
};
