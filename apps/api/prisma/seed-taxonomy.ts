import { PrismaClient } from '@prisma/client';
import { INTEREST_TAXONOMY, TAG_GROUPS, InterestSeedNode } from '../src/taxonomy/taxonomy.data';

export async function seedTaxonomy(prisma: PrismaClient) {
  for (const root of INTEREST_TAXONOMY) {
    await upsertInterestNode(prisma, root, 'category', null);
  }

  for (const [group, tags] of Object.entries(TAG_GROUPS)) {
    for (const slug of tags) {
      await prisma.interestTag.upsert({
        where: { slug },
        update: {
          name: humanize(slug),
          group,
          level: null,
          parentId: null,
        },
        create: {
          name: humanize(slug),
          slug,
          group,
          level: null,
        },
      });
    }
  }
}

async function upsertInterestNode(
  prisma: PrismaClient,
  node: InterestSeedNode,
  level: 'category' | 'subcategory' | 'interest',
  parentId: string | null,
) {
  const record = await prisma.interestTag.upsert({
    where: { slug: node.slug },
    update: {
      name: node.name,
      group: 'interest',
      level,
      parentId,
    },
    create: {
      name: node.name,
      slug: node.slug,
      group: 'interest',
      level,
      parentId,
    },
  });

  const nextLevel = level === 'category' ? 'subcategory' : 'interest';
  for (const child of node.children ?? []) {
    await upsertInterestNode(prisma, child, nextLevel, record.id);
  }
}

function humanize(slug: string) {
  return slug
    .split('_')
    .join(' ')
    .split('-')
    .join(' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
