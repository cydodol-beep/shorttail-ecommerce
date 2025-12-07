import * as XLSX from 'xlsx';
import type { Product, ProductVariant } from '@/types/database';

// Excel cell text limit is 32767 characters
const EXCEL_MAX_CELL_LENGTH = 32767;

function truncateForExcel(text: string | null | undefined): string {
  if (!text) return '';
  if (text.length <= EXCEL_MAX_CELL_LENGTH) return text;
  return text.substring(0, EXCEL_MAX_CELL_LENGTH - 3) + '...';
}

export interface ProductImportRow {
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  base_price: number;
  stock_quantity: number;
  condition?: 'new' | 'secondhand';
  unit_weight_grams?: number;
  main_image_url?: string;
  is_active?: boolean;
}

export interface VariantImportRow {
  product_sku: string;
  variant_name: string;
  sku?: string;
  variant_image_url?: string;
  unit_label?: string;
  weight_grams?: number;
  price_adjustment: number;
  stock_quantity: number;
}

export type ProductWithVariants = Product & {
  product_variants?: ProductVariant[];
};

export interface ParsedExcelData {
  products: ProductImportRow[];
  variants: VariantImportRow[];
}

export function parseProductsFromExcel(file: File): Promise<ParsedExcelData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Failed to read file data'));
          return;
        }
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Parse Products sheet
        const productsSheet = workbook.Sheets['Products'] || workbook.Sheets[workbook.SheetNames[0]];
        if (!productsSheet) {
          reject(new Error('No Products sheet found'));
          return;
        }
        const productsData = XLSX.utils.sheet_to_json<Record<string, unknown>>(productsSheet);
        
        const products: ProductImportRow[] = productsData.map((row) => ({
          name: String(row.name || ''),
          description: row.description ? String(row.description) : undefined,
          sku: row.sku ? String(row.sku) : undefined,
          category: row.category ? String(row.category) : undefined,
          base_price: Number(row.base_price) || 0,
          stock_quantity: Number(row.stock_quantity) || 0,
          condition: row.condition === 'secondhand' ? 'secondhand' : 'new',
          unit_weight_grams: row.unit_weight_grams ? Number(row.unit_weight_grams) : 0,
          main_image_url: row.main_image_url ? String(row.main_image_url) : undefined,
          is_active: row.is_active === 'true' || row.is_active === true || row.is_active === 1,
        }));
        
        // Parse Variants sheet if exists
        let variants: VariantImportRow[] = [];
        if (workbook.Sheets['Variants']) {
          const variantsData = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets['Variants']);
          variants = variantsData.map((row) => ({
            product_sku: String(row.product_sku || ''),
            variant_name: String(row.variant_name || ''),
            sku: row.sku ? String(row.sku) : undefined,
            variant_image_url: row.variant_image_url ? String(row.variant_image_url) : undefined,
            unit_label: row.unit_label ? String(row.unit_label) : undefined,
            weight_grams: row.weight_grams ? Number(row.weight_grams) : undefined,
            price_adjustment: Number(row.price_adjustment) || 0,
            stock_quantity: Number(row.stock_quantity) || 0,
          }));
        }
        
        resolve({ products, variants });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function exportProductsToExcel(products: ProductWithVariants[], filename: string = 'products_export') {
  const exportData = products.map((product) => ({
    name: truncateForExcel(product.name),
    description: truncateForExcel(product.description),
    sku: product.sku || '',
    category: product.category || '',
    base_price: product.base_price,
    stock_quantity: product.stock_quantity,
    condition: product.condition || 'new',
    unit_weight_grams: product.unit_weight_grams,
    main_image_url: truncateForExcel(product.main_image_url),
    is_active: product.is_active,
    has_variants: product.has_variants,
    created_at: product.created_at,
  }));

  const workbook = XLSX.utils.book_new();
  
  // Products sheet
  const productsSheet = XLSX.utils.json_to_sheet(exportData);
  const productColWidths = [
    { wch: 40 }, // name
    { wch: 60 }, // description
    { wch: 15 }, // sku
    { wch: 15 }, // category
    { wch: 12 }, // base_price
    { wch: 14 }, // stock_quantity
    { wch: 12 }, // condition
    { wch: 16 }, // unit_weight_grams
    { wch: 50 }, // main_image_url
    { wch: 10 }, // is_active
    { wch: 12 }, // has_variants
    { wch: 20 }, // created_at
  ];
  productsSheet['!cols'] = productColWidths;
  XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products');

  // Variants sheet
  const variantsData: {
    product_sku: string;
    product_name: string;
    variant_name: string;
    sku: string;
    variant_image_url: string;
    unit_label: string;
    weight_grams: number | null;
    price_adjustment: number;
    stock_quantity: number;
  }[] = [];
  
  products.forEach((product) => {
    if (product.product_variants && product.product_variants.length > 0) {
      product.product_variants.forEach((variant) => {
        variantsData.push({
          product_sku: product.sku || '',
          product_name: product.name,
          variant_name: variant.variant_name,
          sku: variant.sku || '',
          variant_image_url: truncateForExcel(variant.variant_image_url),
          unit_label: variant.unit_label || '',
          weight_grams: variant.weight_grams,
          price_adjustment: variant.price_adjustment,
          stock_quantity: variant.stock_quantity,
        });
      });
    }
  });

  if (variantsData.length > 0) {
    const variantsSheet = XLSX.utils.json_to_sheet(variantsData);
    const variantColWidths = [
      { wch: 15 }, // product_sku
      { wch: 40 }, // product_name
      { wch: 30 }, // variant_name
      { wch: 15 }, // sku
      { wch: 50 }, // variant_image_url
      { wch: 12 }, // unit_label
      { wch: 12 }, // weight_grams
      { wch: 15 }, // price_adjustment
      { wch: 14 }, // stock_quantity
    ];
    variantsSheet['!cols'] = variantColWidths;
    XLSX.utils.book_append_sheet(workbook, variantsSheet, 'Variants');
  }

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function downloadTemplate() {
  const productsTemplateData = [
    {
      name: 'Premium Dog Food - Chicken & Rice',
      description: 'High-quality dog food made with real chicken and rice.',
      sku: 'DOG-FOOD-001',
      category: 'dog-food',
      base_price: 185000,
      stock_quantity: 50,
      condition: 'new',
      unit_weight_grams: 2000,
      main_image_url: 'https://example.com/images/dog-food-1.jpg',
      is_active: true,
    },
    {
      name: 'Cat Treats - Salmon Flavor (with variants)',
      description: 'Delicious salmon-flavored treats for cats. Available in multiple sizes.',
      sku: 'CAT-TREAT-001',
      category: 'cat-food',
      base_price: 45000,
      stock_quantity: 0,
      condition: 'new',
      unit_weight_grams: 150,
      main_image_url: 'https://example.com/images/cat-treats-1.jpg',
      is_active: true,
    },
  ];

  const variantsTemplateData = [
    {
      product_sku: 'CAT-TREAT-001',
      variant_name: 'Small (50g)',
      sku: 'CAT-TREAT-001-S',
      variant_image_url: '',
      unit_label: '50g',
      weight_grams: 50,
      price_adjustment: 0,
      stock_quantity: 50,
    },
    {
      product_sku: 'CAT-TREAT-001',
      variant_name: 'Medium (150g)',
      sku: 'CAT-TREAT-001-M',
      variant_image_url: '',
      unit_label: '150g',
      weight_grams: 150,
      price_adjustment: 25000,
      stock_quantity: 30,
    },
    {
      product_sku: 'CAT-TREAT-001',
      variant_name: 'Large (300g)',
      sku: 'CAT-TREAT-001-L',
      variant_image_url: '',
      unit_label: '300g',
      weight_grams: 300,
      price_adjustment: 50000,
      stock_quantity: 20,
    },
  ];

  const workbook = XLSX.utils.book_new();
  
  // Products sheet
  const productsSheet = XLSX.utils.json_to_sheet(productsTemplateData);
  const productColWidths = [
    { wch: 40 }, { wch: 60 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
    { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 50 }, { wch: 10 },
  ];
  productsSheet['!cols'] = productColWidths;
  XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products');
  
  // Variants sheet
  const variantsSheet = XLSX.utils.json_to_sheet(variantsTemplateData);
  const variantColWidths = [
    { wch: 15 }, { wch: 25 }, { wch: 18 }, { wch: 50 }, { wch: 12 },
    { wch: 12 }, { wch: 15 }, { wch: 14 },
  ];
  variantsSheet['!cols'] = variantColWidths;
  XLSX.utils.book_append_sheet(workbook, variantsSheet, 'Variants');

  XLSX.writeFile(workbook, 'products_import_template.xlsx');
}
