import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Manually construct DATABASE_URL from environment variables
const DATABASE_URL = `mysql://${process.env.MYSQL_USER}:${process.env.MYSQL_PASSWORD_PROD}@localhost:${process.env.MYSQL_PORT_PROD}/${process.env.MYSQL_DATABASE}`;
process.env.DATABASE_URL = DATABASE_URL;

const prisma = new PrismaClient();

async function resetAdminPassword() {
  // Get password from command line argument
  const newPassword = process.argv[2];

  if (!newPassword) {
    console.error('❌ Usage: npx tsx scripts/reset-admin-password.ts <new-password>');
    console.error('Example: npx tsx scripts/reset-admin-password.ts Admin2025!');
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error('❌ Password must be at least 8 characters long');
    process.exit(1);
  }

  // Find admin user
  const adminUser = await prisma.user.findFirst({
    where: {
      role: 'ADMIN',
      email: 'admin@crm.se'
    }
  });

  if (!adminUser) {
    console.error('❌ Admin user not found');
    process.exit(1);
  }

  console.log(`\n📧 Found admin user: ${adminUser.email} (ID: ${adminUser.id})`);

  // Hash the new password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  // Update the user
  const updatedUser = await prisma.user.update({
    where: {
      id: adminUser.id
    },
    data: {
      passwordHash: passwordHash,
      updatedAt: new Date()
    }
  });

  console.log('✅ Admin password has been successfully updated!');
  console.log(`📧 Email: ${updatedUser.email}`);
  console.log(`🆔 User ID: ${updatedUser.id}`);
  console.log(`🔑 New password: [hidden for security]\n`);

  // Verify the update in the database
  const verifyUser = await prisma.user.findUnique({
    where: { id: updatedUser.id },
    select: {
      id: true,
      email: true,
      role: true,
      passwordHash: true,
      updatedAt: true
    }
  });

  console.log('✅ Verification: User found in database');
  console.log(`   Password hash updated: ${verifyUser?.passwordHash ? 'Yes' : 'No'}`);
  console.log(`   Last updated: ${verifyUser?.updatedAt}\n`);

  await prisma.$disconnect();
}

resetAdminPassword().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
