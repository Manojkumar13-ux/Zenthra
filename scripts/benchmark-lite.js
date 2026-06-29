const postId = "YOUR_POST_ID_HERE"; // Replace with an actual post ID

async function benchmarkLike() {
  console.log("🚀 Testing like API...\n");

  const start = Date.now();

  try {
    const res = await fetch("http://localhost:3000/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: postId }),
    });

    const data = await res.json();
    const end = Date.now();
    const time = end - start;

    console.log(`✅ Like response: ${time}ms`);
    console.log(`✅ Result: ${JSON.stringify(data)}`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

benchmarkLike();
