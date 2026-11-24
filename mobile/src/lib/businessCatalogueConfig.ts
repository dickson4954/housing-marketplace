import type { BusinessSetupResponse } from './businessOwnerApi';

export type UniversalCatalogueItemType = 'PRODUCT' | 'SERVICE' | 'MENU_ITEM';

export type BusinessCatalogueConfig = {
  businessCategory: string;
  businessType: string;
  businessName: string;
  itemSingular: string;
  itemPlural: string;
  allowedTypes: UniversalCatalogueItemType[];
  defaultType: UniversalCatalogueItemType;
  typeLabels: Record<UniversalCatalogueItemType, string>;
  searchPlaceholder: string;
  showInventory: boolean;
  showPreparationTime: boolean;
  showServiceDuration: boolean;
  showBooking: boolean;
  requestedModules: string[];
};

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

export function getBusinessCatalogueConfig(
  business: BusinessSetupResponse['business'] | null | undefined,
): BusinessCatalogueConfig {
  const category = clean(business?.category).toUpperCase();
  const operatingModel = record(business?.operatingModel);
  const answers = record(operatingModel.answers);

  const businessType =
    clean(operatingModel.specificBusinessType) ||
    clean(answers.specificBusinessType) ||
    clean(business?.suggestedCategory) ||
    clean(business?.categoryLabel) ||
    clean(business?.name) ||
    'Business';

  const modules = stringList(business?.requestedModules);

  let allowedTypes: UniversalCatalogueItemType[] = [
    'PRODUCT',
    'SERVICE',
    'MENU_ITEM',
  ];

  let defaultType: UniversalCatalogueItemType = 'PRODUCT';
  let itemSingular = 'offering';
  let itemPlural = 'offerings';
  let typeLabels: Record<UniversalCatalogueItemType, string> = {
    PRODUCT: 'Product',
    SERVICE: 'Service',
    MENU_ITEM: 'Menu item',
  };

  if (category === 'SHOPPING') {

    defaultType = 'PRODUCT';
    itemSingular = 'product';
    itemPlural = 'products';
  } else if (category === 'FOOD_HOSPITALITY') {

    defaultType = 'MENU_ITEM';
    itemSingular = 'menu item';
    itemPlural = 'menu items';
    typeLabels = {
      PRODUCT: 'Retail product',
      SERVICE: 'Hospitality service',
      MENU_ITEM: 'Menu item',
    };
  } else if (category === 'SERVICES') {

    defaultType = 'SERVICE';
    itemSingular = 'service';
    itemPlural = 'services';
    typeLabels = {
      PRODUCT: 'Product',
      SERVICE: 'Service',
      MENU_ITEM: 'Menu item',
    };
  } else if (category === 'MOBILITY_DELIVERY') {

    defaultType = 'SERVICE';
    itemSingular = 'service';
    itemPlural = 'services';
    typeLabels = {
      PRODUCT: 'Product',
      SERVICE: 'Delivery service',
      MENU_ITEM: 'Menu item',
    };
  }

  return {
    businessCategory: category || 'OTHER',
    businessType,
    businessName: clean(business?.name) || 'Your business',
    itemSingular,
    itemPlural,
    allowedTypes,
    defaultType,
    typeLabels,
    searchPlaceholder: `Search ${itemPlural}, descriptions or SKU`,
    showInventory: modules.includes('INVENTORY') || category === 'SHOPPING',
    showPreparationTime:
      category === 'FOOD_HOSPITALITY' || modules.includes('MENU'),
    showServiceDuration:
      category === 'SERVICES' || modules.includes('APPOINTMENTS'),
    showBooking:
      modules.includes('APPOINTMENTS') || category === 'FOOD_HOSPITALITY',
    requestedModules: modules,
  };
}
