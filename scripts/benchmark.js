const start = Date.now();

fetch("http://localhost:3000/api/feed?tab=following&page=1&limit=10")
  .then((res) => res.json())
  .then(() => {
    const end = Date.now();
    console.log(`✅ Feed API response time: ${end - start}ms`);
  })
  .catch((err) => console.error("Error:", err));
