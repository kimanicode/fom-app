import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { INTEREST_TAXONOMY, TAG_GROUPS } from './taxonomy.data';

type TaxonomyNode = {
  id: string;
  name: string;
  slug: string;
  level: string | null;
  group: string;
  children: TaxonomyNode[];
};

@Injectable()
export class TaxonomyService {
  constructor(private prisma: PrismaService) {}

  async getTaxonomy() {
    const tags = await this.prisma.interestTag.findMany({
      orderBy: [{ group: 'asc' }, { name: 'asc' }],
    });

    const interestTags = tags.filter((tag) => tag.group === 'interest');
    const interestTree = this.buildTree(interestTags);
    const groupedTags = Object.fromEntries(
      Object.keys(TAG_GROUPS).map((group) => [
        group,
        tags
          .filter((tag) => tag.group === group)
          .map((tag) => ({ id: tag.id, name: tag.name, slug: tag.slug })),
      ]),
    );

    return {
      interestTree: this.sortTree(interestTree),
      groups: groupedTags,
      defaults: {
        suggestedCategorySlugs: INTEREST_TAXONOMY.slice(0, 3).map((node) => node.slug),
      },
    };
  }

  async listLeafInterests() {
    return this.prisma.interestTag.findMany({
      where: { group: 'interest', level: 'interest' },
      orderBy: { name: 'asc' },
    });
  }

  private buildTree(tags: Array<{ id: string; name: string; slug: string; level: string | null; group: string; parentId: string | null }>) {
    const byId = new Map<string, TaxonomyNode>();
    const roots: TaxonomyNode[] = [];

    for (const tag of tags) {
      byId.set(tag.id, {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        level: tag.level,
        group: tag.group,
        children: [],
      });
    }

    for (const tag of tags) {
      const current = byId.get(tag.id)!;
      if (!tag.parentId) {
        roots.push(current);
        continue;
      }
      const parent = byId.get(tag.parentId);
      if (parent) parent.children.push(current);
      else roots.push(current);
    }

    return roots;
  }

  private sortTree(nodes: TaxonomyNode[]): TaxonomyNode[] {
    return [...nodes]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((node): TaxonomyNode => ({
        ...node,
        children: this.sortTree(node.children),
      }));
  }
}
