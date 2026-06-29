const endpoints = [
  { name: "Feed", url: "http://localhost:3000/api/feed?tab=following&page=1&limit=10" },
  { name: "Explore", url: "http://localhost:3000/api/explore?q=&type=posts" },
  { name: "Notifications", url: "http://localhost:3000/api/notifications" },
  { name: "Suggested Users", url: "http://localhost:3000/api/users/suggested" },
];

async function benchmarkAll() {
  console.log("🚀 Benchmarking API endpoints...\n");

  for (const endpoint of endpoints) {
    const start = Date.now();
    try {
      const res = await fetch(endpoint.url);
      const status = res.status;
      const end = Date.now();
      const time = end - start;

      console.log(`✅ ${endpoint.name}: ${time}ms (${status})`);
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Failed (${error.message})`);
    }
  }

  console.log("\n✅ Benchmark complete!");
}

benchmarkAll();
