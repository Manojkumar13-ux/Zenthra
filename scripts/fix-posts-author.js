// scripts/fix-posts-author.js
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const client = new MongoClient(uri);

async function fixPostsAuthor() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    
    const db = client.db("zenthra");
    const postsCollection = db.collection("posts");
    const usersCollection = db.collection("users");

    // Get all users
    const users = await usersCollection.find().toArray();
    console.log(`📊 Found ${users.length} users in database`);
    console.log("Users:");
    users.forEach(u => {
      console.log(`  - ${u.name} (@${u.username}) [${u._id}]`);
    });

    // Get all posts
    const posts = await postsCollection.find().toArray();
    console.log(`\n📊 Found ${posts.length} posts`);

    let fixedCount = 0;
    let deletedCount = 0;

    // Create a map of user IDs to user data
    const userMap = {};
    users.forEach(u => {
      userMap[u._id.toString()] = u;
    });

    for (const post of posts) {
      const authorId = post.author?.id || post.authorId;

      // If post has no author, delete it
      if (!authorId) {
        await postsCollection.deleteOne({ _id: post._id });
        deletedCount++;
        console.log(`🗑️ Deleted post ${post._id} (no author)`);
        continue;
      }

      // Check if author exists in userMap
      const user = userMap[authorId];

      if (user) {
        // ✅ Update post with correct author data
        await postsCollection.updateOne(
          { _id: post._id },
          { 
            $set: { 
              author: {
                id: user._id.toString(),
                name: user.name || "Unknown User",
                username: user.username || "user",
                image: user.image || null,
              }
            }
          }
        );
        fixedCount++;
        console.log(`✅ Fixed post ${post._id} - Author: ${user.name}`);
      } else {
        // ❌ Author not found - delete the post or reassign to a default user
        console.log(`❌ User not found for post ${post._id} (author.id: ${authorId})`);
        
        // Option 1: Delete the post
        await postsCollection.deleteOne({ _id: post._id });
        deletedCount++;
        console.log(`🗑️ Deleted post ${post._id}`);
        
        // Option 2: Reassign to a default user (if there's at least one user)
        // if (users.length > 0) {
        //   const defaultUser = users[0];
        //   await postsCollection.updateOne(
        //     { _id: post._id },
        //     { 
        //       $set: { 
        //         author: {
        //           id: defaultUser._id.toString(),
        //           name: defaultUser.name,
        //           username: defaultUser.username,
        //           image: defaultUser.image,
        //         }
        //       }
        //     }
        //   );
        //   fixedCount++;
        //   console.log(`✅ Reassigned post ${post._id} to ${defaultUser.name}`);
        // }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Fixed ${fixedCount} posts`);
    console.log(`🗑️ Deleted ${deletedCount} posts`);
    
    await client.close();
  } catch (error) {
    console.error("❌ Error:", error);
    await client.close();
  }
}

fixPostsAuthor();