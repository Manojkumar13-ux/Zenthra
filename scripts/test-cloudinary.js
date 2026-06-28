const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

console.log('=================================');
console.log('🧪 Cloudinary Connection Test');
console.log('=================================');

// Get credentials from environment
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dmglpchx0';
const apiKey = process.env.CLOUDINARY_API_KEY || '298788287794719';
const apiSecret = process.env.CLOUDINARY_API_SECRET || 'JFluKxZH73DmgTtP5J8klPkrDgg';

console.log('\n📋 Environment Variables:');
console.log(`  CLOUDINARY_CLOUD_NAME: ${cloudName ? '✅ Set' : '❌ Missing'}`);
console.log(`  CLOUDINARY_API_KEY: ${apiKey ? '✅ Set' : '❌ Missing'}`);
console.log(`  CLOUDINARY_API_SECRET: ${apiSecret ? '✅ Set' : '❌ Missing'}`);

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

console.log('\n🔧 Cloudinary Configuration:');
console.log(`  Cloud Name: ${cloudinary.config().cloud_name}`);
console.log(`  API Key: ${cloudinary.config().api_key ? '✅ Configured' : '❌ Missing'}`);
console.log(`  Secure: ${cloudinary.config().secure}`);

// Test 1: Check API connection
console.log('\n📡 Test 1: Checking API Connection...');

async function testCloudinary() {
  try {
    // Test 1: Ping Cloudinary API
    console.log('\n📡 Test 1: Pinging Cloudinary API...');
    const pingResult = await cloudinary.api.ping();
    console.log(`  ✅ API Ping: ${pingResult.status}`);
  } catch (error) {
    console.log(`  ❌ API Ping Failed: ${error.message}`);
    if (error.message.includes('invalid api_key')) {
      console.log('  💡 Please check your CLOUDINARY_API_KEY');
    }
    if (error.message.includes('invalid cloud_name')) {
      console.log('  💡 Please check your CLOUDINARY_CLOUD_NAME');
    }
  }

  // Test 2: Test upload with a base64 image
  console.log('\n📡 Test 2: Testing Upload...');

  // Simple SVG test image
  const testImage = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect width="100" height="100" fill="#4F46E5"/>
      <text x="50" y="60" font-size="40" text-anchor="middle" fill="white" font-weight="bold">Z</text>
    </svg>
  `).toString('base64');

  const uploadOptions = {
    folder: 'zenthra/test',
    public_id: `test-upload-${Date.now()}`,
    resource_type: 'image',
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
  };

  try {
    console.log('  Uploading test image...');
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        `data:image/svg+xml;base64,${testImage}`,
        uploadOptions,
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });

    console.log('  ✅ Upload successful!');
    console.log(`     URL: ${result.secure_url}`);
    console.log(`     Public ID: ${result.public_id}`);
    console.log(`     Format: ${result.format}`);
    console.log(`     Size: ${result.bytes} bytes`);

  } catch (error) {
    console.log(`  ❌ Upload failed: ${error.message}`);
    if (error.message.includes('signature')) {
      console.log('  💡 Please check your CLOUDINARY_API_SECRET');
    }
    if (error.message.includes('not found')) {
      console.log('  💡 Please check your Cloudinary account');
    }
  }

  // Test 3: Test video upload (optional)
  console.log('\n📡 Test 3: Testing Video Upload (optional)...');
  console.log('  💡 Video upload requires a video file. Skipping...');

  // Test 4: Get account usage
  console.log('\n📡 Test 4: Getting Account Usage...');
  try {
    const usage = await cloudinary.api.usage();
    console.log(`  ✅ Account Usage:`);
    console.log(`     Storage: ${usage.storage_usage || 0} bytes`);
    console.log(`     Bandwidth: ${usage.bandwidth_usage || 0} bytes`);
    console.log(`     Transformations: ${usage.transformations_usage || 0}`);
  } catch (error) {
    console.log(`  ❌ Failed to get usage: ${error.message}`);
  }

  console.log('\n=================================');
  console.log('✅ Cloudinary Test Complete');
  console.log('=================================');

  console.log('\n📌 Next Steps:');
  console.log('  1. If tests passed, Cloudinary is configured correctly');
  console.log('  2. If uploads failed, check your Cloudinary credentials');
  console.log('  3. Try uploading a file through your app');
  console.log('  4. Check the browser console for upload errors');
}

// Run all tests
testCloudinary();