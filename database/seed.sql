USE carfix;

-- Start transaction for data integrity
START TRANSACTION;

-- Function to safely insert a user if they don't exist
DELIMITER //
CREATE OR REPLACE FUNCTION insert_user_if_not_exists(
    p_name VARCHAR(255),
    p_email VARCHAR(255),
    p_password VARCHAR(255),
    p_role ENUM('admin', 'customer', 'seller'),
    p_phone VARCHAR(20),
    p_address TEXT,
    p_business_name VARCHAR(255),
    p_business_description TEXT,
    p_business_website VARCHAR(255),
    p_business_phone VARCHAR(20),
    p_business_address TEXT,
    p_is_verified BOOLEAN,
    p_is_active BOOLEAN
) RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE v_user_id INT;
    
    -- Check if user exists
    SELECT id INTO v_user_id FROM users WHERE email = p_email;
    
    -- If user doesn't exist, insert them
    IF v_user_id IS NULL THEN
        INSERT INTO users (
            name, email, password, role, phone, address,
            business_name, business_description, business_website,
            business_phone, business_address, is_verified, is_active
        ) VALUES (
            p_name, p_email, p_password, p_role, p_phone, p_address,
            p_business_name, p_business_description, p_business_website,
            p_business_phone, p_business_address, p_is_verified, p_is_active
        );
        SET v_user_id = LAST_INSERT_ID();
    END IF;
    
    RETURN v_user_id;
END //
DELIMITER ;

-- Insert sellers
INSERT IGNORE INTO users (name, email, password, role, phone, address, business_name, business_description, business_website, business_phone, business_address, is_verified, is_active)
VALUES
('Auto Parts Co', 'seller1@autoparts.com', 'hashedpass1', 'seller', '1111111111', '123 Seller St', 'Auto Parts Co', 'Quality auto parts', 'https://autoparts.com', '1111111111', '123 Seller St', 1, 1),
('Premium Parts', 'seller2@premiumparts.com', 'hashedpass2', 'seller', '2222222222', '456 Seller Ave', 'Premium Parts', 'Premium car parts', 'https://premiumparts.com', '2222222222', '456 Seller Ave', 1, 1);

-- Insert customers (if not already present)
INSERT IGNORE INTO users (name, email, password, role, phone, address, is_verified, is_active)
VALUES
('John Doe', 'john@example.com', 'hashedpass3', 'customer', '2345678901', '456 Customer Ave, Town', 1, 1),
('Sarah Smith', 'sarah@example.com', 'hashedpass4', 'customer', '4567890123', '321 User St, Town', 1, 1);

-- Set user IDs for reference
SET @seller1_id = (SELECT id FROM users WHERE email = 'seller1@autoparts.com');
SET @seller2_id = (SELECT id FROM users WHERE email = 'seller2@premiumparts.com');
SET @john_id = (SELECT id FROM users WHERE email = 'john@example.com');
SET @sarah_id = (SELECT id FROM users WHERE email = 'sarah@example.com');

-- Insert categories
INSERT IGNORE INTO categories (name, description, is_featured, is_active)
VALUES
('Engine', 'Engine parts', 1, 1),
('Brakes', 'Brake system parts', 1, 1),
('Suspension', 'Suspension system parts', 0, 1);

SET @engine_cat = (SELECT id FROM categories WHERE name = 'Engine');
SET @brakes_cat = (SELECT id FROM categories WHERE name = 'Brakes');
SET @susp_cat = (SELECT id FROM categories WHERE name = 'Suspension');

-- Insert brands
INSERT IGNORE INTO brands (name, description, is_featured, is_active)
VALUES
('Bosch', 'Bosch auto parts', 1, 1),
('Brembo', 'Brembo brakes', 1, 1),
('KYB', 'KYB suspension', 0, 1);

SET @bosch_brand = (SELECT id FROM brands WHERE name = 'Bosch');
SET @brembo_brand = (SELECT id FROM brands WHERE name = 'Brembo');
SET @kyb_brand = (SELECT id FROM brands WHERE name = 'KYB');

-- Insert products
INSERT IGNORE INTO products (name, description, price, stock, category_id, brand_id, seller_id, part_condition, sku, weight, featured, is_active)
VALUES
('Oil Filter', 'High quality oil filter', 15.99, 100, @engine_cat, @bosch_brand, @seller1_id, 'new', 'OF-001', 0.5, 1, 1),
('Brake Pads', 'Ceramic brake pads', 49.99, 50, @brakes_cat, @brembo_brand, @seller2_id, 'new', 'BP-002', 1.2, 1, 1),
('Shock Absorber', 'Front shock absorber', 89.99, 30, @susp_cat, @kyb_brand, @seller1_id, 'new', 'SA-003', 3.0, 0, 1);

SET @oil_filter = (SELECT id FROM products WHERE name = 'Oil Filter');
SET @brake_pads = (SELECT id FROM products WHERE name = 'Brake Pads');
SET @shock_absorber = (SELECT id FROM products WHERE name = 'Shock Absorber');

-- Insert product images
INSERT IGNORE INTO product_images (product_id, image_url, is_primary)
VALUES
(@oil_filter, 'https://example.com/oilfilter.jpg', 1),
(@brake_pads, 'https://example.com/brakepads.jpg', 1),
(@shock_absorber, 'https://example.com/shockabsorber.jpg', 1);

-- Insert orders
INSERT IGNORE INTO orders (user_id, total_amount, status, shipping_address, shipping_city, shipping_state, shipping_country, shipping_zip, shipping_phone, payment_method, payment_status, estimated_delivery)
VALUES
(@john_id, 65.98, 'delivered', '456 Customer Ave', 'Town', 'State', 'Country', '12345', '2345678901', 'credit_card', 'paid', DATE_ADD(CURRENT_DATE, INTERVAL 5 DAY)),
(@sarah_id, 49.99, 'shipped', '321 User St', 'Town', 'State', 'Country', '54321', '4567890123', 'paypal', 'paid', DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY));

SET @order1 = (SELECT id FROM orders WHERE user_id = @john_id AND total_amount = 65.98);
SET @order2 = (SELECT id FROM orders WHERE user_id = @sarah_id AND total_amount = 49.99);

-- Insert order items
INSERT IGNORE INTO order_items (order_id, product_id, quantity, price)
VALUES
(@order1, @oil_filter, 2, 15.99),
(@order1, @shock_absorber, 1, 89.99),
(@order2, @brake_pads, 1, 49.99);

-- Insert reviews
INSERT IGNORE INTO reviews (product_id, user_id, order_id, rating, title, comment, is_verified, is_approved)
VALUES
(@oil_filter, @john_id, @order1, 5, 'Great filter', 'Worked perfectly', 1, 1),
(@brake_pads, @sarah_id, @order2, 4, 'Good pads', 'A bit noisy at first', 1, 1);

-- Insert cart items
INSERT IGNORE INTO cart (user_id, product_id, quantity)
VALUES
(@john_id, @brake_pads, 1),
(@sarah_id, @oil_filter, 1);

-- Insert wishlist items
INSERT IGNORE INTO wishlist (user_id, product_id)
VALUES
(@john_id, @shock_absorber),
(@sarah_id, @brake_pads);

-- Insert notifications
INSERT IGNORE INTO notifications (user_id, title, message, type, reference_id, reference_type, is_read)
VALUES
(@john_id, 'Order Delivered', 'Your order has been delivered', 'order', @order1, 'order', 1),
(@sarah_id, 'Order Shipped', 'Your order has been shipped', 'order', @order2, 'order', 0);

-- Drop the temporary function
DROP FUNCTION IF EXISTS insert_user_if_not_exists;

-- Commit the transaction
COMMIT;
