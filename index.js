const express = require("express");
const axios = require("axios");
const OAuth = require("oauth-1.0a");
const CryptoJS = require("crypto-js");
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
// HOME ROUTE (FIXES "Cannot GET /")
// =====================
app.get("/", (req, res) => {
  res.send(`
    <h2>X Bot Running 🚀</h2>
    <p>Click below to run profile update:</p>
    <a href="/run">Run Bot</a>
  `);
});

// =====================
// ONE LINK ENTRY
// =====================
app.get("/run", async (req, res) => {
  try {
    // =====================
    // UPDATE PROFILE (BIO + NAME + URL)
    // =====================
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

    await axios.post(request.url, new URLSearchParams(request.data), {
      headers: {
        ...authHeader,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    // =====================
    // UPDATE PROFILE IMAGE
    // =====================
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

    // =====================
    // UPDATE BANNER
    // =====================
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

    // =====================
    // FINISH
    // =====================
    res.redirect("https://x.com/home");

  } catch (err) {
    console.log("ERROR:", err.response?.data || err.message);
    res.status(500).send("Profile update failed ❌ Check logs");
  }
});

// =====================
app.listen(process.env.PORT || 3000, () => {
  console.log("One-link bot running 🚀");
});