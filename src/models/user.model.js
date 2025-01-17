import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { isDebugging } from "../constants.js";
const userSchema = new mongoose.Schema(
  {
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowecase: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowecase: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index:true,
    },
    avatar: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      
    },
    password: {
      type: String,
      required: [true,"password is required"],
    },
    refreshToken: {
      type: String,
      
    },
    address: {
      type:{
        city: {type:String,default:"Karachi"},
        state: {type:String,default:"Sindh"},
        country: {type:String,default:"Pakistan"},
        pinCode: {type:Number,default:new Number("05444")}
      },
      required: true
    }
  },
  { timestamps: true }
);



userSchema.pre(
  "save",
  async function (next) {
    if(this.isModified("password"))
      this.password = await bcrypt.hash(this.password, 10);
      next();
  }
);

userSchema.methods.isPasswordCorrect=  async function (password) {
    return await bcrypt.compare(password, this.password); 
   }


userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};   

userSchema.methods.generateRefreshToken = function () {

  this.refreshToken = jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
  return this.refreshToken;
}


export const User = mongoose.model("User", userSchema);
