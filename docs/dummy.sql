INSERT INTO products (name, description, stock, created_at) VALUES
('iPhone 15 Pro', 'Latest Apple smartphone with advanced camera', 1000, NOW()),
('Samsung Galaxy S24', 'Powerful Android phone with AI features', 800, NOW()),
('MacBook Air M3', 'Lightweight laptop with Apple Silicon', 500, NOW()),
('Sony WH-1000XM5', 'Noise-canceling wireless headphones', 300, NOW()),
('Nintendo Switch OLED', 'Gaming console with vibrant OLED screen', 200, NOW());


INSERT INTO promos (name, date_start, date_end, mode, created_at, is_active) VALUES
('Flash Sale October 2024', NOW(), NOW() + INTERVAL '24 hours', 'FLASH_SALE', NOW(), true);

INSERT INTO promos_products (promo_id, product_id, stock, price, sold, max_qty_per_order) VALUES
(1, 1, 25, 899.99, 0, 1), 
(1, 3, 50, 1099.99, 0, 1),
(1, 5, 30, 349.99, 0, 1);