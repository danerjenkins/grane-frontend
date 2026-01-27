/**
 * Admin API barrel exports
 * Import all admin modules from here for convenience
 */

export * as productsAdmin from './productsAdmin';
export * as ordersAdmin from './ordersAdmin';
export * as usersAdmin from './usersAdmin';
export * as bakeDaysAdmin from './bakeDaysAdmin';
export * as bakeDayProductsAdmin from './bakeDayProductsAdmin';

export type {
  Product,
  Order,
  OrderItem,
  OrderWithItems,
  UserRow,
  UserRole,
  BakeDay,
  BakeDayProduct,
  BakeDayProductWithProduct,
} from './types';
