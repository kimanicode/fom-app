import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const tags = ['Hiking', 'Coffee', 'Art', 'Music', 'Food', 'Cycling', 'Books', 'Photography'];
  for (const name of tags) {
    await prisma.interestTag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const passwordHash = await bcrypt.hash('password123', 10);
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
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
      email: 'bob@example.com',
      passwordHash,
      name: 'Bob',
      alias: 'bob',
      ageRange: '25-34',
      city: 'San Francisco',
      bio: 'Down for any quest.'
    },
  });

  const tagRecords = await prisma.interestTag.findMany();
  await prisma.userInterest.createMany({
    data: [
      { userId: alice.id, tagId: tagRecords[0].id },
      { userId: alice.id, tagId: tagRecords[2].id },
      { userId: bob.id, tagId: tagRecords[1].id },
      { userId: bob.id, tagId: tagRecords[3].id },
    ],
    skipDuplicates: true,
  });

  const loc1 = await prisma.location.create({
    data: { placeName: 'Golden Gate Park', lat: 37.7694, lng: -122.4862, category: 'park' },
  });
  const loc2 = await prisma.location.create({
    data: { placeName: 'Ferry Building', lat: 37.7955, lng: -122.3937, category: 'market' },
  });

  const locations = [loc1, loc2];
  const vibes = ['chill', 'active', 'creative', 'curious'] as const;
  const activities = [
    'Photo Walk',
    'Coffee Swap',
    'Rooftop Yoga',
    'Street Art Hunt',
    'Book Picnic',
    'Golden Hour Skate',
    'Live Music Loop',
    'Sunrise Run',
    'Market Taste Tour',
    'Sketch & Sip',
    'City Bike Roll',
    'Film Night',
    'Park Games',
    'Gallery Crawl',
    'Sunset Hike',
    'Night Market',
    'Craft Jam',
    'Tea Tasting',
    'Mural Mapping',
    'Pier Chill',
  ];
  const adjectives = [
    'Sunset',
    'Morning',
    'Cozy',
    'Electric',
    'Slow',
    'Golden',
    'Hidden',
    'Late',
    'Urban',
    'Seaside',
  ];
  const descriptions = [
    'Capture golden hour shots and share your favorite frame.',
    'Grab a coffee and trade real-life stories.',
    'Move, breathe, and reset with a mellow flow.',
    'Track down murals and snap your favorite finds.',
    'Bring a book, swap with a stranger, and hang out.',
    'Easy loop with stops for photos and vibes.',
    'Hop between local musicians and pick a favorite set.',
    'Short run followed by a cool down stretch.',
    'Taste stalls and vote on the best bite.',
    'Sketch your surroundings and share one favorite page.',
    'Meet up and roll through the city at an easy pace.',
    'Watch a short film and talk about your favorite scene.',
    'Quick games and laughs with a casual crew.',
    'Browse local art and pick one piece you love.',
    'Hike a simple trail and catch the view.',
    'Try new foods and rate the finds together.',
    'Make something small and trade it with a new friend.',
    'Sample new teas and rank your top three.',
    'Find a mural and create a quick story around it.',
    'Chill at the pier and end with a sunset walk.',
  ];

  const usedTitles = new Set<string>();
  const makeTitle = () => {
    const title =
      adjectives[Math.floor(Math.random() * adjectives.length)] +
      ' ' +
      activities[Math.floor(Math.random() * activities.length)];
    return title;
  };
  const images = [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200',
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200',
    'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1200',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200',
    'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=1200',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200',
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200',
  ];

  const createdTemplates = [];
  for (let i = 0; i < 20; i++) {
    const location = locations[i % locations.length];
    let title = makeTitle();
    while (usedTitles.has(title)) title = makeTitle();
    usedTitles.add(title);

    const template = await prisma.questTemplate.create({
      data: {
        creatorId: i % 2 === 0 ? alice.id : bob.id,
        title,
        description: descriptions[i % descriptions.length],
        vibeTag: vibes[i % vibes.length],
        imageUrl: images[i % images.length],
        locationId: location.id,
        startTime: new Date(Date.now() + (i + 1) * 60 * 60 * 1000),
        durationMinutes: 60 + (i % 3) * 30,
        maxParticipants: 6 + (i % 5),
        cost: 'free',
      },
    });
    createdTemplates.push(template);

    const instance = await prisma.questInstance.create({
      data: {
        templateId: template.id,
        startTime: template.startTime,
        durationMinutes: template.durationMinutes,
        locationId: template.locationId,
        status: i % 4 === 0 ? 'completed' : 'scheduled',
      },
    });

    await prisma.questParticipant.createMany({
      data: [
        { instanceId: instance.id, userId: alice.id },
        { instanceId: instance.id, userId: bob.id },
      ],
      skipDuplicates: true,
    });

    if (instance.status === 'completed') {
      await prisma.checkin.create({
        data: {
          instanceId: instance.id,
          userId: bob.id,
          lat: location.lat,
          lng: location.lng,
        },
      });
      await prisma.post.create({
        data: {
          instanceId: instance.id,
          userId: bob.id,
          locationId: location.id,
          mediaUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          mediaType: 'photo',
          caption: 'Great vibes and strong coffee.',
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
