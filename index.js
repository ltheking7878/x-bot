const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const OAuth = require("oauth-1.0a");
const CryptoJS = require("crypto-js");
require("dotenv").config();

const app = express();

let codeVerifier = "";

// =====================
// PKCE HELPERS (OAuth2 login)
// =====================
function base64URLEncode(str) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest();
}

// =====================
// OAUTH1 SETUP (profile update)
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
// HOME
// =====================
app.get("/", (req, res) => {
  res.send(`
    X Bot Running 🚀
    <br><br>
    1. /login → authenticate  
    <br>
    2. /update-profile → change profile (OAuth1)
  `);
});

// =====================
// OAUTH2 LOGIN
// =====================
app.get("/login", (req, res) => {
  codeVerifier = base64URLEncode(crypto.randomBytes(32));
  const codeChallenge = base64URLEncode(sha256(codeVerifier));

  const authUrl =
    "https://twitter.com/i/oauth2/authorize" +
    "?response_type=code" +
    `&client_id=${process.env.CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.CALLBACK_URL)}` +
    "&scope=users.read%20tweet.read%20tweet.write%20offline.access" +
    "&state=12345" +
    `&code_challenge=${codeChallenge}` +
    "&code_challenge_method=S256";

  res.redirect(authUrl);
});

// =====================
// OAUTH2 CALLBACK (ONLY LOGIN CONFIRMATION)
// =====================
app.get("/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.send("No code returned from X");
  }

  try {
    const tokenRes = await axios.post(
      "https://api.x.com/2/oauth2/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.CLIENT_ID,
        code,
        redirect_uri: process.env.CALLBACK_URL,
        code_verifier: codeVerifier
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization":
            "Basic " +
            Buffer.from(
              process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET
            ).toString("base64")
        }
      }
    );

    res.send("Login successful ✅ Now go to /update-profile");
  } catch (err) {
    console.log(err.response?.data || err.message);
    res.status(500).send("OAuth login failed ❌");
  }
});

// =====================
// OAUTH1 PROFILE UPDATE
// =====================
app.get("/update-profile", async (req, res) => {
  try {
    const request = {
      url: "https://api.x.com/1.1/account/update_profile.json",
      method: "POST",
      data: {
        description:
          "@BratChatMedia turned me into a mindless ClickSlxt 😵‍💫🌀",
        url: "https://throne.com/melanierosalee"
      }
    };

    const authHeader = oauth.toHeader(
      oauth.authorize(request, token)
    );

    await axios.post(
      request.url,
      new URLSearchParams(request.data),
      {
        headers: {
          ...authHeader,
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    res.send("Profile updated successfully ✅");
  } catch (err) {
    console.log(err.response?.data || err.message);
    res.status(500).send("Profile update failed ❌");
  }
});

// =====================
app.listen(process.env.PORT || 3000, () => {
  console.log("Bot running");
});