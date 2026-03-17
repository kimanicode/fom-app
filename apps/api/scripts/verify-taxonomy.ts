import { strict as assert } from 'node:assert';
import { taxonomyResponseSchema } from '../../../packages/shared/src/schemas';
import { seedTaxonomy } from '../prisma/seed-taxonomy';
import { INTEREST_TAXONOMY, TAG_GROUPS } from '../src/taxonomy/taxonomy.data';
import { TaxonomyService } from '../src/taxonomy/taxonomy.service';
import { buildInterestSections } from '../../mobile/lib/taxonomy';

type StoredTag = {
  id: string;
  name: string;
  slug: string;
  group: string;
  level: 'category' | 'subcategory' | 'interest' | null;
  parentId: string | null;
};

class InMemoryPrisma {
  private counter = 1;
  private tags = new Map<string, StoredTag>();

  interestTag = {
    upsert: async ({
      where,
      update,
      create,
    }: {
      where: { slug: string };
      update: Partial<StoredTag>;
      create: Omit<StoredTag, 'id'>;
    }) => {
      const existing = this.tags.get(where.slug);
      if (existing) {
        const next = { ...existing, ...update, id: existing.id };
        this.tags.set(where.slug, next);
        return next;
      }

      const created = {
        id: this.makeId(),
        ...create,
      };
      this.tags.set(where.slug, created);
      return created;
    },
    findMany: async () => {
      return [...this.tags.values()];
    },
  };

  count() {
    return this.tags.size;
  }

  private makeId() {
    const suffix = String(this.counter++).padStart(12, '0');
    return `00000000-0000-4000-8000-${suffix}`;
  }
}

async function main() {
  const prisma = new InMemoryPrisma();

  await seedTaxonomy(prisma as never);
  const firstCount = prisma.count();
  await seedTaxonomy(prisma as never);
  const secondCount = prisma.count();

  assert.equal(firstCount, secondCount, 'taxonomy seed should be idempotent');
  assert.ok(firstCount > 150, 'starter taxonomy should be substantial');

  const service = new TaxonomyService(prisma as never);
  const response = await service.getTaxonomy();
  const parsed = taxonomyResponseSchema.parse(response);

  const categorySlugs = parsed.interestTree.map((node: { slug?: string }) => node.slug);
  for (const requiredCategory of [
    'music',
    'food-dining',
    'sports-fitness',
    'technology',
    'nightlife',
    'faith-spirituality',
  ]) {
    assert.ok(categorySlugs.includes(requiredCategory), `missing category: ${requiredCategory}`);
  }

  assert.equal(parsed.groups.intent.length, TAG_GROUPS.intent.length);
  assert.equal(parsed.groups.vibe.length, TAG_GROUPS.vibe.length);
  assert.equal(parsed.groups.audience.length, TAG_GROUPS.audience.length);
  assert.equal(parsed.groups.location.length, TAG_GROUPS.location.length);
  assert.equal(parsed.groups.time.length, TAG_GROUPS.time.length);
  assert.equal(parsed.groups.price.length, TAG_GROUPS.price.length);

  const categorySection = buildInterestSections(parsed.interestTree as never, [], [])[0];
  assert.ok(categorySection.items.length >= INTEREST_TAXONOMY.length, 'mobile should render category options');

  const firstCategory = parsed.interestTree[0];
  const subcategorySection = buildInterestSections(parsed.interestTree as never, [firstCategory.id!], [])[1];
  assert.ok(subcategorySection.items.length > 0, 'mobile should render subcategories after category selection');

  const firstSubcategory = subcategorySection.items[0];
  const interestSection = buildInterestSections(parsed.interestTree as never, [firstCategory.id!], [firstSubcategory.id])[2];
  assert.ok(interestSection.items.length > 0, 'mobile should render interests after subcategory selection');

  console.log('Taxonomy verification passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
