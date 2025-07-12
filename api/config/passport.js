import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import User from "../models/User.js";

passport.use(
    new LocalStrategy(
        {
        usernameField: "username",
        passwordField: "password",
        session: false
        },
        async (username, password, done) => {
            try {
                const user = await User.findOne({ where: { username } });
                if (!user || !user.validPassword(password)) {
                   return done(null, false, { message: "Incorrect username or password." });
                }
                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    )
);

export default passport;