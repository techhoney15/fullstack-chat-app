import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long." });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ message: "User already exists with this email." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      const _token = generateToken(newUser?._id, res);
      await newUser.save();
      return res.status(201).json({
        message: "User created successfully",
        user: {
          _id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          profilePic: newUser.profilePic,
          token: _token,
        },
      });
    } else {
      return res
        .status(400)
        .json({ message: "Failed to create user. Please try again." });
    }
  } catch (error) {
    console.error("Error during signup:", error);
    return res
      .status(500)
      .json({ message: "Internal server error. Please try again later." });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const currentUser = await User.findOne({ email });
    if (!currentUser) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      currentUser?.password
    );
    if (isPasswordValid) {
      const _token = generateToken(currentUser?._id, res);
      await User.findByIdAndUpdate(
        currentUser._id,
        { token: _token },
        {
          new: true,
        }
      );

      res.status(200).json({
        message: "Login successful",
        user: {
          _id: currentUser?._id,
          fullName: currentUser?.fullName,
          email: currentUser?.email,
          profilePic: currentUser?.profilePic,
          token: _token,
        },
      });
    }
  } catch (error) {
    console.error("Error during login:", error);
    return res
      .status(500)
      .json({ message: "Internal server error. Please try again later." });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", {
      maxAge: 0,
    });
    return res.status(200).json({
      message: "Logged out successfully",
    });
    s;
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error. Please try again later." });
  }
};

export const updateProfile = async (req, res) => {
  try {
    // console.log(req, "hkjashfkjhasjhkjhfas");

    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile picture is required." });
    }

    const uploadResponse = await cloudinary?.uploader?.upload(profilePic);
    console.log(uploadResponse, "uploadResponse");

    if (!uploadResponse || !uploadResponse?.secure_url) {
      return res.status(500).json({
        message: uploadResponse?.err || "Failed to upload profile picture.",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        profilePic: updatedUser.profilePic,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res
      .status(500)
      .json({ message: "Internal server error. Please try again later." });
  }
};

export const checkAuth = async (req, res) => {
  try {
    res.status(200).json({
      user: {
        _id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        profilePic: req.user.profilePic,
        token: req.user.token,
      },
    });
  } catch (error) {
    console.error("Error checking authentication:", error);
    return res
      .status(500)
      .json({ message: "Internal server error. Please try again later." });
  }
};
