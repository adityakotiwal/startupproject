// Test WhatsApp Integration
// Run this to test if your Twilio credentials are working

require('dotenv').config({ path: '.env.local' });
const twilio = require('twilio');

console.log('🧪 Testing WhatsApp Integration...\n');

// Check environment variables
console.log('📋 Configuration Check:');
console.log('  TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing');
console.log('  TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing');
console.log('  TWILIO_WHATSAPP_NUMBER:', process.env.TWILIO_WHATSAPP_NUMBER ? '✅ Set' : '❌ Missing');
console.log('');

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_NUMBER) {
  console.error('❌ Missing Twilio credentials in .env.local');
  process.exit(1);
}

// Initialize Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Test 1: Validate credentials
console.log('🔐 Test 1: Validating Twilio credentials...');
client.api.accounts(process.env.TWILIO_ACCOUNT_SID)
  .fetch()
  .then(account => {
    console.log('✅ Credentials valid!');
    console.log('   Account SID:', account.sid);
    console.log('   Status:', account.status);
    console.log('');
    
    // Test 2: Ask user for phone number
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('📱 Test 2: Send a test WhatsApp message');
    console.log('');
    console.log('⚠️  IMPORTANT: Before continuing:');
    console.log('   1. Open WhatsApp on your phone');
    console.log('   2. Send "join product-thick" to +1 415 523 8886');
    console.log('   3. Wait for confirmation message');
    console.log('');
    
    readline.question('Enter your phone number (format: +919876543210): ', (phone) => {
      if (!phone.startsWith('+')) {
        console.error('❌ Phone number must start with + (E.164 format)');
        console.log('   Example: +919876543210');
        readline.close();
        process.exit(1);
      }
      
      const whatsappPhone = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;
      
      console.log('');
      console.log('📤 Sending test message to:', whatsappPhone);
      console.log('');
      
      client.messages
        .create({
          body: '🎉 Success! Your WhatsApp integration is working!\n\nThis is a test message from GymSync Pro.\n\n✅ Twilio credentials: Valid\n✅ WhatsApp connection: Active\n✅ Message delivery: Working\n\nYou can now send automated messages to your gym members!',
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          to: whatsappPhone
        })
        .then(message => {
          console.log('✅ Message sent successfully!');
          console.log('   Message SID:', message.sid);
          console.log('   Status:', message.status);
          console.log('   To:', message.to);
          console.log('');
          console.log('📱 Check your WhatsApp now!');
          console.log('');
          console.log('🎉 All tests passed! WhatsApp integration is ready!');
          console.log('');
          console.log('📋 Next steps:');
          console.log('   1. Setup database table (run setup-whatsapp-db.sh or manually in Supabase)');
          console.log('   2. Restart your dev server: npm run dev');
          console.log('   3. Add a new member with your phone number');
          console.log('   4. Receive welcome message automatically!');
          console.log('');
          readline.close();
        })
        .catch(error => {
          console.error('❌ Failed to send message:');
          console.error('   Error:', error.message);
          console.error('');
          
          if (error.message.includes('not a valid phone number')) {
            console.log('💡 Tip: Use E.164 format: +[country code][number]');
            console.log('   India: +919876543210');
            console.log('   US: +14155551234');
          } else if (error.message.includes('sandbox')) {
            console.log('💡 Tip: Make sure you joined the sandbox:');
            console.log('   1. Open WhatsApp');
            console.log('   2. Send "join product-thick" to +1 415 523 8886');
            console.log('   3. Wait for confirmation');
            console.log('   4. Try again');
          } else if (error.code === 20003) {
            console.log('💡 Tip: Check your Twilio credentials in .env.local');
          }
          
          console.log('');
          console.log('📚 For more help, see: WHATSAPP_SETUP_GUIDE.md');
          console.log('');
          readline.close();
          process.exit(1);
        });
    });
  })
  .catch(error => {
    console.error('❌ Invalid Twilio credentials!');
    console.error('   Error:', error.message);
    console.error('');
    console.error('💡 Check your .env.local file:');
    console.error('   - TWILIO_ACCOUNT_SID should start with "AC"');
    console.error('   - TWILIO_AUTH_TOKEN should be 32 characters');
    console.error('   - Both should match your Twilio Console');
    console.error('');
    process.exit(1);
  });
