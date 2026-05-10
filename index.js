const express = require("express");
const axios = require("axios");
const OAuth = require("oauth-1.0a");
const CryptoJS = require("crypto-js");
const crypto = require("crypto");
require("dotenv").config();

const app = express();

// =====================
// OAUTH1 SETUP
// =====================
const oauth = OAuth({
  consumer: {
    key: process.env.API_KEY,
    secret: process.env.API_SECRET
  },
  signature_method: "HMAC-SHA1",
  hash_function(base_string, key) {
    return CryptoJS.HmacSHA1(base_string, key).toString(CryptoJS.enc.Base64);
  }
});

const token = {
  key: process.env.ACCESS_TOKEN,
  secret: process.env.ACCESS_TOKEN_SECRET
};

// =====================
// ONE LINK ENTRY
// =====================
app.get("/run", async (req, res) => {
  try {
    const request = {
      url: "https://api.x.com/1.1/account/update_profile.json",
      method: "POST",
      data: {
        name: "Your New Name",
        description: "ClickSlxt bot active 😵‍💫✨",
        url: "https://throne.com/melanierosalee"
      }
    };

    const authHeader = oauth.toHeader(
      oauth.authorize(request, token)
    );

    // 1. UPDATE BIO + NAME
    await axios.post(request.url, new URLSearchParams(request.data), {
      headers: {
        ...authHeader,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    // 2. UPDATE PROFILE IMAGE
    await axios.post(
      "https://api.x.com/1.1/account/update_profile_image.json",
      new URLSearchParams({
        image: process.env.PROFILE_IMAGE_BASE64
      }),
      {
        headers: {
          ...authHeader,
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    // 3. UPDATE BANNER
    await axios.post(
      "https://api.x.com/1.1/account/update_profile_banner.json",
      new URLSearchParams({
        banner: process.env.BANNER_IMAGE_BASE64
      }),
      {
        headers: {
          ...authHeader,
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    res.redirect("https://x.com/home");

  } catch (err) {
    console.log(err.response?.data || err.message);
    res.status(500).send("Profile update failed ❌");
  }
});

// =====================
app.listen(process.env.PORT || 3000, () => {
  console.log("One-link bot running 🚀");
});