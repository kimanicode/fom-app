import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { seedTaxonomy } from './seed-taxonomy';

const prisma = new PrismaClient();

async function main() {
  await seedTaxonomy(prisma);

  const passwordHash = await bcrypt.hash('password123', 10);
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      supabaseAuthId: 'seed-alice',
      email: 'alice@example.com',
      passwordHash,
      name: 'Alice',
      alias: 'alice',
      ageRange: '25-34',
      city: 'San Francisco',
      bio: 'Chasing real-life moments.'
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      supabaseAuthId: 'seed-bob',
      email: 'bob@example.com',
      passwordHash,
      name: 'Bob',
      alias: 'bob',
      ageRange: '25-34',
      city: 'San Francisco',
      bio: 'Down for any quest.'
    },
  });

  const tagRecords = await prisma.interestTag.findMany({
    where: {
      slug: { in: ['hiking', 'painting', 'brunch', 'jazz'] },
    },
    orderBy: { slug: 'asc' },
  });
  await prisma.userInterest.createMany({
    data: [
      { userId: alice.id, tagId: tagRecords.find((tag) => tag.slug === 'hiking')!.id, source: 'explicit' },
      { userId: alice.id, tagId: tagRecords.find((tag) => tag.slug === 'painting')!.id, source: 'explicit' },
      { userId: bob.id, tagId: tagRecords.find((tag) => tag.slug === 'brunch')!.id, source: 'explicit' },
      { userId: bob.id, tagId: tagRecords.find((tag) => tag.slug === 'jazz')!.id, source: 'explicit' },
    ],
    skipDuplicates: true,
  });

  await prisma.userPreferenceProfile.upsert({
    where: { userId: alice.id },
    update: {
      intentTags: ['meet_new_people', 'stay_active'],
      vibePreferences: ['energetic', 'adventurous'],
      audienceAffinities: ['locals', 'professionals'],
      locationPreferences: ['outdoors', 'westlands'],
      timePreferences: ['morning', 'weekend'],
      pricePreferences: ['free', 'budget'],
    },
    create: {
      userId: alice.id,
      selectedCategoryIds: [],
      selectedSubcategoryIds: [],
      selectedInterestIds: tagRecords
        .filter((tag) => ['hiking', 'painting'].includes(tag.slug))
        .map((tag) => tag.id),
      intentTags: ['meet_new_people', 'stay_active'],
      vibePreferences: ['energetic', 'adventurous'],
      audienceAffinities: ['locals', 'professionals'],
      locationPreferences: ['outdoors', 'westlands'],
      timePreferences: ['morning', 'weekend'],
      pricePreferences: ['free', 'budget'],
    },
  });

  // Dummy quest/location content intentionally removed from seed data.
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
