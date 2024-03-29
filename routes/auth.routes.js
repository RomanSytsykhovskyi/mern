const { Router } = require("express");
const bcrypt = require("bcryptjs");
const config = require("config");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const User = require("../models/User");
const router = Router();

// api/auth/register
router.post(
  "/register",
  [
    check("email", "incorrect email").isEmail(),
    check("password", "Minimal length of password is 6 symbols").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    console.log("Body", req.body);
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty) {
        return res.status(400).json({
          errors: errors.array(),
          message: "Incorrect data during registration",
        });
      }

      const { email, password } = req.body;

      const candidate = await User.findOne({ email });

      if (candidate) {
        return res.status(400).json({ message: "This user already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = new User({ email, password: hashedPassword });
      await user.save();

      res.status(201).json({ message: "User is created" });
    } catch (e) {
      res.status(500).json({ message: "Something is going wrong" });
    }
  }
);

// api/auth/login
router.post(
  "/login",
  [
    check("email", "Enter the correct email").normalizeEmail().isEmail(),
    check("password", "Enter the password").exists(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty) {
        return res.status(400).json({
          errors: errors.array(),
          message: "Incorrect data during log in",
        });
      }

      const { email, password } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ message: "Something is going wrong, try again" });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Incorrect password, try again" });
      }

      const token = jwt.sign({ userId: user.id }, config.get("jwtSecret"), {
        expiresIn: "1h",
      });

      res.json({ token, userId: user.id });
    } catch (e) {
      res.status(500).json({ message: "Something is going wrong" });
    }
  }
);

module.exports = router;
