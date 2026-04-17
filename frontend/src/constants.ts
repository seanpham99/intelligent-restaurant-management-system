import { MenuItem } from './types';

export const MENU_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: 'Truffle Arancini',
    description: 'Crispy risotto balls filled with wild mushrooms and truffle oil.',
    price: 125000,
    currency: 'VND',
    category: 'Appetizers',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRuLYzi8X1ibSb-p9v84gOBxpPppjK8A0vd3QWuMIWP-x1meu-4minAlm5Cy47jMCuRqXYY2z67h6uKMe9EQJTUEXHby8yaORWbeWYfCugX0lDCN0zXBfPx_TwYjZkA51UhYOU-uWyKptxQRRtsxY92pP9WqKGvZCttiN5btMyDidVdk8mTrrO-F52RrGxyjCiuEbrs_9vfNyae5aaGzoUaL94N-gp2_bkDemTWbjeE5A9iQOlO70AsZ-sQS9M1g5CYG5i5URaXug'
  },
  {
    id: '2',
    name: 'Wagyu Beef Carpaccio',
    description: 'Thinly sliced wagyu, capers, parmesan shavings, lemon oil.',
    price: 285000,
    currency: 'VND',
    category: 'Appetizers',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAC-QrRMJpXyC5ZPB7jgirJJiasXXLuTRCbwnOUdC0LHN6Winr1a_ee2FwqimquNHE12IqC2hcAkIcxgz4ZP5fkin7wKXcVCQFs5S-9B7_yBmzvfiN7CEevf054DtTLoVQ471R9H_K0w_68zQ8XF6AbH9UKwUZ_swcWuV3_rYOPy_GI3kx6PzkcRISC_1DQUZIQz9R3FTvar1Kkj0N7zX9wiY6QNowJwTzLhCFashMXeqpjUHqJxIMelJt6nm3A0cc1buu6yV9euow'
  },
  {
    id: '3',
    name: 'Burrata & Heirloom',
    description: 'Fresh creamy burrata, heirloom tomatoes, balsamic glaze, basil.',
    price: 195000,
    currency: 'VND',
    category: 'Appetizers',
    popular: true,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6oYuXHqaf5tsPpZCJ0G4m_xK4U1Porv6ENprw-r_VJ5HUfsFVWoGfEAu3t-j97uCDxreCE_iCkiXjKVW5yaAApSAKKA4rIsHbUKsJNI7q8VXATGuPs7WAH2xX7fHeNEauRnRvo8UlIvyFJRJ3edycd0x54U0amSzUei5F2VJ5lom52YB2zhEcDLX_BGtD0qGcnm746AHN3ueuQQiJrnFKmqo2k_-QnTKv8mqq52-nCLJFm50jYOshumt48L4nxRJlDbGjNFhPa70'
  },
  {
    id: '4',
    name: 'Calamari Fritti',
    description: 'Lightly battered squid rings with lemon aioli dip.',
    price: 150000,
    currency: 'VND',
    category: 'Appetizers',
    soldOut: true
  },
  {
    id: '5',
    name: 'Phở Bò',
    description: 'Traditional Vietnamese beef noodle soup with rice noodles and aromatic broth.',
    price: 75000,
    currency: 'VND',
    category: 'Main Course'
  },
  {
    id: '6',
    name: 'Gỏi Cuốn',
    description: 'Fresh spring rolls with shrimp, pork, herbs, and peanut dipping sauce.',
    price: 35000,
    currency: 'VND',
    category: 'Appetizers'
  },
  {
    id: '7',
    name: 'Truffle Risotto',
    description: 'Creamy Arborio rice with wild mushrooms and black truffle essence.',
    price: 28000, // Price in dollars based on payment screen
    currency: '$',
    category: 'Main Course'
  },
  {
    id: '8',
    name: 'Wagyu Ribeye',
    description: 'Premium Wagyu ribeye steak, grilled to perfection.',
    price: 65000, // Price in dollars based on payment screen
    currency: '$',
    category: 'Main Course'
  },
  {
    id: '9',
    name: 'Charred Asparagus',
    description: 'Fresh asparagus grilled with lemon zest and parmesan.',
    price: 12000, // Price in dollars based on payment screen
    currency: '$',
    category: 'Main Course'
  }
];

export const TAX_RATE = 0.085;
export const SERVICE_CHARGE_RATE = 0.18;
export const VAT_RATE = 0.10;
