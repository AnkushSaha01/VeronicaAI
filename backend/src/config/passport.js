import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import userModel from '../models/user.model.js';
import config from './config.js';

export default (passport) => {
  passport.use(new GoogleStrategy({
    clientID: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/api/auth/google/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // 1. Check if user already exists with this Google ID
      let user = await userModel.findOne({ googleId: profile.id });
      if (user) {
        user.authMessage = "user logged in successfully";
        return done(null, user);
      }

      // 2. Check if user exists with the same email
      user = await userModel.findOne({ email: profile.emails[0].value });
      if (user) {
        // Link Google ID to existing account
        user.googleId = profile.id;
        
        // Update profile picture if user doesn't have one and google provides one
        if (!user.profilePicture && profile.photos && profile.photos.length > 0) {
          user.profilePicture = profile.photos[0].value;
        }
        await user.save();
        
        user.authMessage = "user logged in successfully";
        return done(null, user);
      }

      // 3. Create a new user
      // 3. Create a new user
      user = await userModel.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        fullname: profile.displayName,
        profilePicture: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : "",
      });

      user.authMessage = "user registered successfully";
      return done(null, user);
    } catch (error) {
      console.log("Error in passport callback:", error);
      return done(error, null);
    }
  }));
};
