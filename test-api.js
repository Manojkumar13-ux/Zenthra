// test-api-full.js
const BASE_URL = 'http://localhost:3000';

async function loginAndTest() {
  try {
    console.log('🔵 Starting API tests...');

    // First, check if server is running
    try {
      const healthCheck = await fetch(`${BASE_URL}`);
      console.log('✅ Server is running');
    } catch (error) {
      console.error('❌ Server not running. Please start with: npm run dev');
      console.error('Error:', error.message);
      return;
    }

    // Test notifications
    console.log('\n📊 Testing Notifications API...');
    const notifResponse = await fetch(`${BASE_URL}/api/notifications?filter=all&unreadOnly=false`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Status:', notifResponse.status);
    
    if (notifResponse.status === 401) {
      console.log('⚠️  Please login first. Go to http://localhost:3000/login');
      console.log('Then run this script again after logging in.');
      return;
    }

    const notifData = await notifResponse.json();
    console.log('📊 Notifications:', notifData);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
}

loginAndTest();