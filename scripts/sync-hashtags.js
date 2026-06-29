// scripts/sync-hashtags.js (updated)
const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in .env.local");
  process.exit(1);
}

const PostSchema = new mongoose.Schema(
  {
    content: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    hashtags: [String],
    createdAt: Date,
  },
  { timestamps: true }
);

const HashtagSchema = new mongoose.Schema(
  {
    tag: { type: String, required: true, trim: true, lowercase: true },
    count: { type: Number, default: 0 },
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    isTrending: { type: Boolean, default: false },
    lastUsed: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

HashtagSchema.index({ tag: 1 }, { unique: true });
HashtagSchema.index({ count: -1 });

const Post = mongoose.models.Post || mongoose.model("Post", PostSchema);
const Hashtag = mongoose.models.Hashtag || mongoose.model("Hashtag", HashtagSchema);

async function syncHashtags() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("🔄 Syncing hashtags from existing posts...");

    // Get all posts with hashtags
    const posts = await Post.find({ hashtags: { $exists: true, $ne: [] } });
    console.log(`📁 Found ${posts.length} posts with hashtags`);

    if (posts.length === 0) {
      console.log("ℹ️ No posts with hashtags found.");
      await mongoose.disconnect();
      process.exit(0);
    }

    // Clear existing hashtags to rebuild
    console.log("🔄 Clearing existing hashtags...");
    await Hashtag.deleteMany({});

    let totalHashtagsAdded = 0;
    const hashtagMap = {};

    for (const post of posts) {
      if (post.hashtags && post.hashtags.length > 0) {
        for (const tag of post.hashtags) {
          // Clean the tag - remove extra # and spaces
          let cleanTag = tag.toLowerCase().trim();
          // Remove all # at the beginning, keep only one
          cleanTag = cleanTag.replace(/^#+/, "");
          // Remove any remaining # in the middle
          cleanTag = cleanTag.replace(/#/g, "");
          // Trim again
          cleanTag = cleanTag.trim();

          if (!cleanTag) continue;

          if (!hashtagMap[cleanTag]) {
            hashtagMap[cleanTag] = {
              tag: cleanTag,
              count: 0,
              posts: [],
              lastUsed: post.createdAt || new Date(),
            };
          }

          hashtagMap[cleanTag].count += 1;
          hashtagMap[cleanTag].posts.push(post._id);
          totalHashtagsAdded++;
        }
      }
    }

    console.log(`📊 Processing ${Object.keys(hashtagMap).length} unique hashtags`);

    for (const [tag, data] of Object.entries(hashtagMap)) {
      await Hashtag.create({
        tag: tag,
        count: data.count,
        posts: data.posts,
        lastUsed: data.lastUsed,
        isTrending: data.count >= 3,
      });
      console.log(`✅ Synced #${tag} (${data.count} posts)`);
    }

    console.log(`📊 Total hashtags synced: ${totalHashtagsAdded}`);

    const totalHashtags = await Hashtag.countDocuments();
    console.log(`📊 Total hashtags in database: ${totalHashtags}`);

    const topHashtags = await Hashtag.find({}).sort({ count: -1 }).limit(10).lean();

    console.log("\n🏆 Top 10 Trending Hashtags:");
    topHashtags.forEach((h, i) => {
      console.log(`  ${i + 1}. #${h.tag} - ${h.count} posts ${h.isTrending ? "🔥" : ""}`);
    });

    await mongoose.disconnect();
    console.log("✅ Done!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error syncing hashtags:", error);
    try {
      await mongoose.disconnect();
    } catch (e) {}
    process.exit(1);
  }
}

syncHashtags();
