// test-follow.js
async function testFollow() {
  try {
    console.log("🔵 Testing Follow API...");

    const userId = "6a3e6d487c602e5c38fc5530";

    const res = await fetch(`http://localhost:3000/api/users/${userId}/follow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ action: "follow" }),
    });

    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testFollow();
