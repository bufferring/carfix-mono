-- Drop database if exists
DROP DATABASE IF EXISTS carfix;

-- Set proper character set and collation
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

-- Create database and use it
CREATE DATABASE carfix
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE carfix;

-- Users
CREATE TABLE users (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('customer', 'admin', 'seller') NOT NULL DEFAULT 'customer',
    phone VARCHAR(20),
    address TEXT,
    business_name VARCHAR(100),
    business_description TEXT,
    business_website VARCHAR(255),
    business_phone VARCHAR(20),
    business_address TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_verified (is_verified),
    INDEX idx_is_active (is_active),
    INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB;

-- Categories
CREATE TABLE categories (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    parent_id INT UNSIGNED NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_parent_id (parent_id),
    INDEX idx_is_featured (is_featured),
    INDEX idx_is_active (is_active),
    INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB;

-- Brands
CREATE TABLE brands (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    logo_url VARCHAR(255),
    website_url VARCHAR(255),
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_is_featured (is_featured),
    INDEX idx_is_active (is_active),
    INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB;

-- Products
CREATE TABLE products (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    stock INT UNSIGNED NOT NULL DEFAULT 0,
    category_id INT UNSIGNED,
    brand_id INT UNSIGNED,
    seller_id INT UNSIGNED,
    part_condition ENUM('new', 'used', 'remanufactured') NOT NULL DEFAULT 'new',
    oem_code VARCHAR(50),
    sku VARCHAR(50),
    weight DECIMAL(10,2),
    dimensions VARCHAR(50),
    featured BOOLEAN DEFAULT FALSE,
    images TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_category_id (category_id),
    INDEX idx_brand_id (brand_id),
    INDEX idx_seller_id (seller_id),
    INDEX idx_part_condition (part_condition),
    INDEX idx_featured (featured),
    INDEX idx_is_active (is_active),
    INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB;

-- Product Images
CREATE TABLE product_images (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    product_id INT UNSIGNED NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id),
    INDEX idx_is_primary (is_primary)
) ENGINE=InnoDB;

-- Orders
CREATE TABLE orders (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_country VARCHAR(100),
    shipping_zip VARCHAR(20),
    shipping_phone VARCHAR(20),
    payment_method VARCHAR(50) NOT NULL,
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    payment_id VARCHAR(255),
    tracking_number VARCHAR(100),
    estimated_delivery DATE,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB;

-- Order Items
CREATE TABLE order_items (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    order_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB;

-- Reviews
CREATE TABLE reviews (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    product_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    order_id INT UNSIGNED,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    images TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX idx_product_id (product_id),
    INDEX idx_user_id (user_id),
    INDEX idx_order_id (order_id),
    INDEX idx_rating (rating),
    INDEX idx_is_verified (is_verified),
    INDEX idx_is_approved (is_approved),
    INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB;

-- Cart
CREATE TABLE cart (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL DEFAULT 1 CHECK (quantity > 0),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_item (user_id, product_id),
    INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB;

-- Wishlist
CREATE TABLE wishlist (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_wishlist_item (user_id, product_id),
    INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB;

-- Notifications
CREATE TABLE notifications (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('order', 'system', 'promotion', 'review', 'price_alert') NOT NULL DEFAULT 'system',
    reference_id INT UNSIGNED,
    reference_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB;

-- Create views
DROP VIEW IF EXISTS vw_product_details;
CREATE OR REPLACE VIEW vw_product_details AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.stock,
    p.part_condition,
    p.oem_code,
    p.sku,
    p.featured,
    p.images,
    c.name as category_name,
    c.parent_id as category_parent_id,
    pc.name as parent_category_name,
    b.name as brand_name,
    u.business_name as seller_name,
    u.phone as seller_phone,
    u.address as seller_address,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(r.id) as review_count,
    p.is_active,
    p.is_deleted
FROM products p
JOIN categories c ON p.category_id = c.id
LEFT JOIN categories pc ON c.parent_id = pc.id
JOIN brands b ON p.brand_id = b.id
JOIN users u ON p.seller_id = u.id
LEFT JOIN reviews r ON p.id = r.product_id AND r.is_deleted = FALSE AND r.is_approved = TRUE
WHERE p.is_deleted = FALSE
GROUP BY p.id;

DROP VIEW IF EXISTS vw_order_details;
CREATE OR REPLACE VIEW vw_order_details AS
SELECT 
    o.id,
    o.total_amount,
    o.status,
    o.shipping_address,
    o.shipping_city,
    o.shipping_state,
    o.shipping_country,
    o.shipping_zip,
    o.payment_method,
    o.payment_status,
    o.tracking_number,
    o.estimated_delivery,
    o.created_at,
    u.name as customer_name,
    u.email as customer_email,
    u.phone as customer_phone,
    GROUP_CONCAT(
        CONCAT(
            p.name, ' (', oi.quantity, ' x $', oi.price, ')'
        )
        SEPARATOR '; '
    ) as items
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.is_deleted = FALSE
GROUP BY o.id;

-- Create triggers
DELIMITER //

CREATE TRIGGER after_order_item_insert
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE products 
    SET stock = stock - NEW.quantity 
    WHERE id = NEW.product_id;
END //

CREATE TRIGGER after_order_item_delete
AFTER DELETE ON order_items
FOR EACH ROW
BEGIN
    UPDATE products 
    SET stock = stock + OLD.quantity 
    WHERE id = OLD.product_id;
END //

CREATE TRIGGER before_order_item_update
BEFORE UPDATE ON order_items
FOR EACH ROW
BEGIN
    UPDATE products 
    SET stock = stock + OLD.quantity - NEW.quantity 
    WHERE id = NEW.product_id;
END //

CREATE TRIGGER before_order_update
BEFORE UPDATE ON orders
FOR EACH ROW
BEGIN
    UPDATE orders 
    SET total_amount = (
        SELECT SUM(quantity * price) 
        FROM order_items 
        WHERE order_id = NEW.id
    )
    WHERE id = NEW.id;
END //

CREATE TRIGGER trg_soft_delete_user
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
        SET NEW.deleted_at = CURRENT_TIMESTAMP;
    END IF;
END //

CREATE TRIGGER trg_soft_delete_product
BEFORE UPDATE ON products
FOR EACH ROW
BEGIN
    IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
        SET NEW.deleted_at = CURRENT_TIMESTAMP;
    END IF;
END //

CREATE TRIGGER trg_soft_delete_order
BEFORE UPDATE ON orders
FOR EACH ROW
BEGIN
    IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
        SET NEW.deleted_at = CURRENT_TIMESTAMP;
    END IF;
END //

CREATE TRIGGER trg_after_review_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
    SELECT 
        p.seller_id,
        'New Review',
        CONCAT('New ', NEW.rating, '-star review for ', p.name),
        'review',
        NEW.id,
        'review'
    FROM products p
    WHERE p.id = NEW.product_id;
END //

DELIMITER ; 