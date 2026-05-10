import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    
    profilePicture: {
        type: String,
        required: true,
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    
});

const userModel = mongoose.model("User", userSchema);

export default userModel;