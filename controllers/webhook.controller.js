const { GoogleGenAI } = require("@google/genai");
const crypto = require("crypto");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const webhookController = async (req, res) => {
  const startTime = performance.now();

  // HMAC security
  const signature = req.headers["x-hub-signature-256"];
  if (!signature) {
    console.log("Signature not found");
    return res.status(401).send("Unauthorized: No signature provided");
  }
  const payloadString = JSON.stringify(req.body);
  const secret = process.env.WEBHOOK_SECRET;

  if (!secret) {
    console.log("Secret not found");
    return res.status(500).send("Server misconfiguration");
  }

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payloadString);
  const expectedSignature = `sha256=${hmac.digest("hex")}`;

  try {
    const signatureBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      console.error(
        "🚨 SECURITY ALERT: Signature mismatch! Potential hacking attempt.",
      );
      return res.status(401).send("Unauthorized: Invalid signature");
    }
  } catch (error) {
    console.error("Error during cryptographic verification:", error);
    return res.status(500).send("Internal Server Error");
  }

  console.log(
    "🔒 Security Check Passed: Payload is authentically from GitHub.",
  );

  // Main logic work
  const eventType = req.headers["x-github-event"];
  // 1. Acknowledge receipt immediately to prevent timeouts
  res.status(202).send("Webhook successfully received");

  // 2. Filter for Pull Requests only
  if (eventType === "pull_request") {
    const action = req.body.action;
    const prTitle = req.body.pull_request.title;

    console.log(`Action : PR ${action} - ${prTitle}`);

    // 3. Only when action is opened and synchronize.
    if (action === "opened" || action === "synchronize") {
      const apiUrl = req.body.pull_request.url;
      const commentsUrl = req.body.pull_request.comments_url;
      console.log(`Target acquired. Downloading code from ${apiUrl}`);

      try {
        // 4. reach out to internet and download the data.
        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, // for private repos
            Accept: "application/vnd.github.v3.diff", // frocing for getting string data
          },
        });

        //5. convert response into plain text;
        const diffText = await response.text();
        console.log(diffText);

        // model selection
        const model = "gemini-2.5-flash";

        // prompt for the ai
        const prompt = `
            SYSTEM INSTRUCTIONS:
            You are a ruthless, highly-experienced Senior Security Auditor and Principal Software Engineer.
            Your job is to review the provided Git Diff.
            
            CRITICAL RULES:
            1. ONLY flag severe architectural flaws, logic bugs, security vulnerabilities (like hardcoded secrets, SQL injection), or massive performance bottlenecks.
            2. ABSOLUTELY DO NOT comment on minor formatting, missing semicolons, syntax preferences, or variable naming. Assume the team has a linter for that.
            3. If the code is perfectly fine and safe, reply exactly with: "Code looks solid. No critical issues found."
            4. Format your feedback in concise Markdown. Use bullet points and mention specific file names and line numbers if an error exists.

            USER DATA (Git Diff to analyze):
            ${diffText}
        `;

        // generating ai review
        const result = await ai.models.generateContent({
          model: model,
          contents: prompt,
        });

        const aiReview = result.text;
        console.log(aiReview);

        const postResponse = await fetch(commentsUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            body: aiReview,
          }),
        });

        if (postResponse.ok) {
          console.log("Success AI Comment posted on github PR");
        } else {
          const errorData = await postResponse.text();
          console.error("❌ FAILED to post comment to GitHub:", errorData);
        }
      } catch (error) {
        console.error("Network or AI error:", error);
      }
    }
  }

  const endTime = performance.now();
  const executionTime = endTime - startTime;

  console.log(executionTime);
};

module.exports = { webhookController };
