export interface SystemRoleSeed {
  code: string;
  name: string;
  description: string;
  permissionCodes: readonly string[];
}

export const SYSTEM_ROLE_SEED_POLICY_VERSION = 1;

export const SYSTEM_ROLE_SEEDS: readonly SystemRoleSeed[] = [
  {
    code: 'BRANCH_MANAGER',
    name: 'Branch Manager',
    description: 'Manages ordinary operations within assigned branches.',
    permissionCodes: [
      'branches.view',
      'branches.create',
      'branches.update',
      'warehouses.view',
      'warehouses.create',
      'warehouses.update',
      'warehouses.activate',
      'warehouses.deactivate',
      'warehouses.view_capacity',
      'warehouses.manage_capacity',
      'warehouses.manage_availability',
      'products.view',
      'inventory.view',
      'inventory.receive',
      'inventory.issue',
      'inventory.transfer',
      'inventory.adjust',
      'shipments.view',
      'shipments.create',
      'shipments.update',
      'shipments.approve',
      'shipments.cancel',
      'customers.view',
      'customers.create',
      'customers.update',
      'drivers.view',
      'drivers.create',
      'drivers.update',
    ],
  },
  {
    code: 'WAREHOUSE_MANAGER',
    name: 'Warehouse Manager',
    description:
      'Manages assigned warehouse settings, capacity, and inventory.',
    permissionCodes: [
      'warehouses.view',
      'warehouses.update',
      'warehouses.view_capacity',
      'warehouses.manage_capacity',
      'warehouses.manage_availability',
      'products.view',
      'inventory.view',
      'inventory.receive',
      'inventory.issue',
      'inventory.transfer',
      'inventory.adjust',
    ],
  },
  {
    code: 'INVENTORY_OPERATOR',
    name: 'Inventory Operator',
    description:
      'Performs permitted inventory operations in assigned branches.',
    permissionCodes: [
      'inventory.view',
      'inventory.receive',
      'inventory.issue',
      'inventory.transfer',
    ],
  },
  {
    code: 'ACCOUNTANT',
    name: 'Accountant',
    description: 'Manages invoice workflows and related customer records.',
    permissionCodes: [
      'invoices.view',
      'invoices.create',
      'invoices.update',
      'invoices.approve',
      'invoices.cancel',
      'invoices.export',
      'customers.view',
    ],
  },
  {
    code: 'OPERATIONS_USER',
    name: 'Operations User',
    description: 'Views and performs routine assigned-branch operations.',
    permissionCodes: [
      'warehouses.view',
      'warehouses.view_capacity',
      'products.view',
      'inventory.view',
      'inventory.receive',
      'inventory.issue',
      'inventory.transfer',
      'shipments.view',
      'shipments.create',
      'shipments.update',
      'customers.view',
      'drivers.view',
    ],
  },
];
