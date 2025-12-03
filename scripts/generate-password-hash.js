const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter password to hash: ', async (password) => {
  try {
    const hash = await bcrypt.hash(password, 10);
    console.log('\n✅ Password hash generated:');
    console.log(hash);
    console.log('\n📝 Add this to your .env.local file as:');
    console.log(`ADMIN_PASSWORD_HASH=${hash}`);
    console.log('\nOr use it directly in your Vercel environment variables.');
  } catch (error) {
    console.error('Error generating hash:', error);
  } finally {
    rl.close();
  }
});

