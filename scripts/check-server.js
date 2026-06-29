async function checkServer() {
  try {
    console.log("🔍 Checking server status...");

    const res = await fetch("http://localhost:3000/api/auth/session", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      console.log("✅ Server is running!");
      console.log(`✅ Status: ${res.status}`);
      const data = await res.json();
      console.log("✅ Response:", data);
    } else {
      console.log(`❌ Server returned error: ${res.status}`);
    }
  } catch (error) {
    console.log("❌ Server is NOT running!");
    console.log("❌ Error:", error.message);
    console.log("\n📝 Please start the server with: npm run dev");
  }
}

checkServer();
