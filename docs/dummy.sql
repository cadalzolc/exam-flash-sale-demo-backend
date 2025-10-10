INSERT INTO products (id, name, description, stock, created_at) VALUES
(1, 'iPhone 15 Pro', 'Latest Apple smartphone with advanced camera', 1000, NOW()),

INSERT INTO promos (id, name, date_start, date_end, created_at, is_active) VALUES
(2, 'Flash Sale October 2024', NOW(), NOW() + INTERVAL '24 hours',  NOW(), true);

INSERT INTO promos_products (promo_id, product_id, stock, price, sold, max_qty_per_order) VALUES
(2, 1, 25, 50000, 0, 1), 
