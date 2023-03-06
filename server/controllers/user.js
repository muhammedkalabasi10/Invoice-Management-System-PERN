import UserModel from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { validationResult } from "express-validator/check/index.js";
import TokenModel from "../models/TokenModel.js";

dotenv.config();
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

export const signIn = async (req, res) => {
  const { email, password } = await req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ message: errors.errors[0].msg });
  try {
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Username and password are required." });
    const existingUser = await UserModel.findOne({ email });
    if (!existingUser)
      return res.status(404).json({ message: "User doesn't exist" });
    const passwordCheck = await bcrypt.compare(password, existingUser.password);
    if (!passwordCheck)
      return res.status(400).json({ message: "Email or Password Invalid" });
    if (!existingUser.verified)
      return res.status(401).json({ message: "Email not verified" });
    const accessToken = jwt.sign({ user: existingUser }, ACCESS_TOKEN_SECRET, {
      expiresIn: "30s",
    });
    const refreshToken = jwt.sign({ user: email }, REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("jwt", refreshToken, {
      httpOnly: false,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ accessToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const signUp = async (req, res) => {
  const { name, surName, email, phone, password } = await req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ message: errors.errors[0].msg });
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await new UserModel(
      null,
      name,
      surName,
      email,
      phone,
      hashedPassword
    );
    const result = await user.save();
    const newToken = await new TokenModel(
      result.rows[0]._id,
      crypto.randomBytes(32).toString("hex")
    );
    const savedToken = await newToken.save();
    const transporter = await nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      secure: false,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    transporter.sendMail(
      {
        from: process.env.EMAIL_USERNAME,
        to: `${result.rows[0].email}`,
        subject: "Invoice",
        text: "Invoice Text",
        html: `<p>Click the link: ${process.env.API_LINK}/verify/${result.rows[0]._id}/${savedToken.rows[0].token}</p>`,
      },
      (error, info) => {
        if (error)
          res.status(502).json({ message: "E-mail could not be sent" });
        else console.log(info);
      }
    );
    res.status(200).json({ email: email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const activateUser = async (req, res) => {
  const { userId, token } = await req.params;
  const { operation } = await req.body;
  try {
    const user = await UserModel.findOne({ _id: userId });
    if (!user) return res.status(400).send("Invalid link or expired");
    const savedToken = await TokenModel.findOne(userId, token);
    if (!savedToken.rows[0])
      return res.status(400).send("Invalid link or expired");
    await UserModel.activateUser(userId);
    await TokenModel.remove(
      savedToken.rows[0].userId,
      savedToken.rows[0].token
    );
    if (operation === "verify") {
      console.log("girdi");
      const accessToken = jwt.sign({ user: user }, ACCESS_TOKEN_SECRET, {
        expiresIn: "30s",
      });
      const refreshToken = jwt.sign(
        { user: user.email },
        REFRESH_TOKEN_SECRET,
        {
          expiresIn: "7d",
        }
      );
      res.cookie("jwt", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.status(200).json({ accessToken });
    } else {
      res.status(200).json({ accessToken: "Token removed successfully" });
    }
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  const { name, surName, email, phone, password } = await req.body;
  const { id: _id } = await req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ message: errors.errors[0].msg });
  try {
    const user = await new UserModel(
      _id,
      name,
      surName,
      email,
      phone
    );
    const updatedUser = user.update();
    const accessToken = jwt.sign(
      { user: updatedUser.rows[0] },
      ACCESS_TOKEN_SECRET,
      {
        expiresIn: "30s",
      }
    );
    const refreshToken = jwt.sign({ user: email }, REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      overwrite: true,
    });
    res.status(200).json({ accessToken });
  } catch (err) {
    res.json({ message: err.message });
  }
};

export const refresh = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorizedd" });
  const refreshToken = cookies.jwt;
  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ message: "Forbidden" });
    const foundUser = await UserModel.findOne({ email: decoded.user });
    if (!foundUser) return res.status(401).json({ message: "Unauthorized" });
    const accessToken = jwt.sign({ user: foundUser }, ACCESS_TOKEN_SECRET, {
      expiresIn: "30s",
    });
    res.json({ accessToken });
  });
};

export const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  res.json({ message: "Cookie cleared" });
};

export const forgotPassword = async (req, res) => {
  const { email } = await req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ message: errors.errors[0].msg });
  try {
    const result = await UserModel.findOne({ email });
    const newToken = await new TokenModel(
      result._id,
      crypto.randomBytes(32).toString("hex")
    );
    const savedToken = await newToken.save();
    const transporter = await nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      secure: false,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    transporter.sendMail(
      {
        from: process.env.EMAIL_USERNAME,
        to: `${result.email}`,
        subject: "Invoice",
        text: "Invoice Text",
        html: `<p>Your account verification link: ${process.env.API_LINK}/reset/${result._id}/${savedToken.rows[0].token}</p>`,
      },
      (error, info) => {
        if (error)
          res.status(502).json({ message: "E-mail could not be sent" });
        else console.log(info);
      }
    );
    res
      .status(200)
      .json({
        message:
          "E-Mail sent successfully. Please check your email and click the link sent.",
      });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const resetPassword = async (req, res) => {
  const { password } = await req.body;
  const { id: _id } = await req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ message: errors.errors[0].msg });
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user=new UserModel(_id, null, null, null, null, hashedPassword)
    await user.update();
    res.status(200).json({ success: "Password updated successfully" });
  } catch (error) {
    res.json({ message: error.message });
  }
};
