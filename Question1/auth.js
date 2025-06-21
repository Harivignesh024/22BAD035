const axios = require("axios");
const fs = require("fs");

// 📝 Your real credentials go here:
const registrationPayload = {
  email: "harivignesh.22ad@kct.ac.in",
  name: "Harivignesh C K",
  mobileNo: "7010832457",
  githubUsername: "Harivignesh024",
  rollNo: "22BAD035",
  collegeName: "Kumaraguru College of Technology",
  accessCode: "WcTSKv" // from Affordmed email
};

const register = async () => {
  try {
    // STEP 1: Register with Affordmed server
    const registerRes = await axios.post(
      "http://20.244.56.144/evaluation-service/register",
      registrationPayload
    );

    const creds = registerRes.data;
    console.log("✅ Registered Successfully. Got credentials:\n", creds);

    // STEP 2: Use credentials to get access token
    const authPayload = {
      email: creds.email,
      name: creds.name,
      rollNo: creds.rollNo,
      accessCode: creds.accessCode,
      clientID: creds.clientID,
      clientSecret: creds.clientSecret
    };

    const authRes = await axios.post(
      "http://20.244.56.144/evaluation-service/auth",
      authPayload
    );

    const token = `${authRes.data.token_type} ${authRes.data.access_token}`;
    console.log("✅ Authenticated. Access Token retrieved.\n");

    // Save token in a local file (token.js)
    const tokenContent = `module.exports = { token: "${token}" };`;
    fs.writeFileSync("token.js", tokenContent);
    console.log("✅ Token saved to token.js ✅");
  } catch (error) {
    console.error("❌ Something went wrong during registration/auth:", error.message);
  }
};

// Run the function
register();
