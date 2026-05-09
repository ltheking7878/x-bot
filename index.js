const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

const app = express();

// Store PKCE verifier temporarily (simple version for single-user bot)
let codeVerifier = "";

// helper: base64url
function base64URLEncode(str) {
  return str
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest();
}

// =========================
// HOME
// =========================
app.get("/", (req, res) => {
  res.send("X Bot Running on Render. Go to /login");
});

// =========================
// STEP 1: LOGIN
// =========================
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
    "&code_challenge_method=S256`;

  res.redirect(authUrl);
});

// =========================
// STEP 2: CALLBACK
// =========================
app.get("/callback", async (req, res) => {
  const code = req.query.code;

  try {
    // exchange code for token
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
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    const accessToken = tokenRes.data.access_token;

    // =========================
    // STEP 3: UPDATE PROFILE
    // =========================

    await axios.post(
      "https://api.x.com/1.1/account/update_profile.json",
      new URLSearchParams({
        description: "@BratChatMedia turned me into a mindless ClickSlxt 😵‍💫😵‍💫🌀🌀 I’ve given myself up to her completely ‼️‼️ click and join too 💗✨😵‍💫",
        url: "https://throne.com/melanierosalee"
      }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    res.send("Profile updated successfully ✅");
  } catch (err) {
    console.log(err.response?.data || err.message);
    res.status(500).send("Error updating profile ❌");
  }
});

// =========================
// START SERVER
// =========================
app.listen(3000, () => {
  console.log("Server running on port 3000");
});