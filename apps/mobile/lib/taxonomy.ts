export type TaxonomyNode = {
  id: string;
  name: string;
  slug: string;
  level: 'category' | 'subcategory' | 'interest' | null;
  children: TaxonomyNode[];
};

export type TaxonomyTag = {
  id: string;
  name: string;
  slug: string;
};

export type TaxonomySection = {
  title: string;
  items: TaxonomyNode[];
  emptyMessage: string;
};

export function flattenTaxonomy(nodes: TaxonomyNode[]) {
  const categories: TaxonomyNode[] = [];
  const subcategories: TaxonomyNode[] = [];
  const interests: TaxonomyNode[] = [];

  const walk = (node: TaxonomyNode) => {
    if (node.level === 'category') categories.push(node);
    if (node.level === 'subcategory') subcategories.push(node);
    if (node.level === 'interest') interests.push(node);
    node.children.forEach(walk);
  };

  nodes.forEach(walk);
  return { categories, subcategories, interests };
}

export function findChildren(nodes: TaxonomyNode[], parentIds: string[]) {
  const allowed = new Set(parentIds);
  const results: TaxonomyNode[] = [];

  const walk = (node: TaxonomyNode) => {
    if (node.children.some((child) => allowed.has(child.id))) {
      // noop
    }
    if (allowed.has(node.id)) {
      results.push(...node.children);
      return;
    }
    node.children.forEach(walk);
  };

  nodes.forEach(walk);
  return results;
}

export function buildInterestSections(
  taxonomy: TaxonomyNode[],
  selectedCategoryIds: string[],
  selectedSubcategoryIds: string[],
): TaxonomySection[] {
  const { categories } = flattenTaxonomy(taxonomy);
  const subcategories = findChildren(taxonomy, selectedCategoryIds);
  const interests = findChildren(taxonomy, selectedSubcategoryIds);

  return [
    {
      title: 'Categories',
      items: categories,
      emptyMessage: 'No categories are available yet.',
    },
    {
      title: 'Subcategories',
      items: subcategories,
      emptyMessage:
        selectedCategoryIds.length === 0
          ? 'Select one or more categories to unlock subcategories.'
          : 'No subcategories are available for the selected categories yet.',
    },
    {
      title: 'Specific Interests',
      items: interests,
      emptyMessage:
        selectedSubcategoryIds.length === 0
          ? 'Select one or more subcategories to pick specific interests.'
          : 'No specific interests are available for the selected subcategories yet.',
    },
  ];
}
