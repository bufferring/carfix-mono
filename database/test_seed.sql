USE carfix;

-- Test 1: Verify Users
SELECT 'Test 1: Verifying Users' as test;
SELECT id, name, email, role, is_verified, is_active 
FROM users 
ORDER BY id;

-- Test 2: Verify Products and their relationships
SELECT 'Test 2: Verifying Products and Categories' as test;
SELECT p.id, p.name, p.price, c.name as category, b.name as brand, u.name as seller
FROM products p
JOIN categories c ON p.category_id = c.id
JOIN brands b ON p.brand_id = b.id
JOIN users u ON p.seller_id = u.id
ORDER BY p.id;

-- Test 3: Verify Orders and their relationships
SELECT 'Test 3: Verifying Orders and Order Items' as test;
SELECT o.id, u.name as customer, o.total_amount, o.status, o.payment_status,
       COUNT(oi.id) as item_count, SUM(oi.quantity) as total_items
FROM orders o
JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id
ORDER BY o.id;

-- Test 4: Verify Order Items details
SELECT 'Test 4: Verifying Order Items Details' as test;
SELECT oi.order_id, p.name as product, oi.quantity, oi.price, 
       (oi.quantity * oi.price) as total_price
FROM order_items oi
JOIN products p ON oi.product_id = p.id
ORDER BY oi.order_id, oi.id;

-- Test 5: Verify Reviews
SELECT 'Test 5: Verifying Reviews' as test;
SELECT r.id, p.name as product, u.name as reviewer, r.rating, r.title,
       CASE WHEN r.order_id IS NOT NULL THEN 'Verified Purchase' ELSE 'Unverified' END as purchase_status
FROM reviews r
JOIN products p ON r.product_id = p.id
JOIN users u ON r.user_id = u.id
ORDER BY r.id;

-- Test 6: Verify Cart Items
SELECT 'Test 6: Verifying Cart Items' as test;
SELECT u.name as customer, p.name as product, c.quantity, p.price,
       (c.quantity * p.price) as total_price
FROM cart c
JOIN users u ON c.user_id = u.id
JOIN products p ON c.product_id = p.id
ORDER BY u.name, p.name;

-- Test 7: Verify Wishlist Items
SELECT 'Test 7: Verifying Wishlist Items' as test;
SELECT u.name as customer, p.name as product, p.price
FROM wishlist w
JOIN users u ON w.user_id = u.id
JOIN products p ON w.product_id = p.id
ORDER BY u.name, p.name;

-- Test 8: Verify Notifications
SELECT 'Test 8: Verifying Notifications' as test;
SELECT u.name as user, n.title, n.type, n.is_read,
       CASE 
           WHEN n.reference_type = 'order' THEN CONCAT('Order #', n.reference_id)
           WHEN n.reference_type = 'review' THEN CONCAT('Review #', n.reference_id)
           ELSE NULL
       END as reference
FROM notifications n
JOIN users u ON n.user_id = u.id
ORDER BY u.name, n.id;

-- Test 9: Verify Data Integrity
SELECT 'Test 9: Verifying Data Integrity' as test;

-- Check for orphaned order items
SELECT 'Orphaned Order Items:' as check_type,
       COUNT(*) as count
FROM order_items oi
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.id IS NULL;

-- Check for orphaned reviews
SELECT 'Orphaned Reviews:' as check_type,
       COUNT(*) as count
FROM reviews r
LEFT JOIN products p ON r.product_id = p.id
WHERE p.id IS NULL;

-- Check for orphaned cart items
SELECT 'Orphaned Cart Items:' as check_type,
       COUNT(*) as count
FROM cart c
LEFT JOIN products p ON c.product_id = p.id
WHERE p.id IS NULL;

-- Check for orphaned wishlist items
SELECT 'Orphaned Wishlist Items:' as check_type,
       COUNT(*) as count
FROM wishlist w
LEFT JOIN products p ON w.product_id = p.id
WHERE p.id IS NULL;

-- Test 10: Verify Business Logic
SELECT 'Test 10: Verifying Business Logic' as test;

-- Check if all orders have at least one item
SELECT 'Orders without items:' as check_type,
       COUNT(*) as count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE oi.id IS NULL;

-- Check if all paid orders are in appropriate status
SELECT 'Paid orders in incorrect status:' as check_type,
       COUNT(*) as count
FROM orders
WHERE payment_status = 'paid' 
AND status NOT IN ('shipped', 'delivered');

-- Check if all delivered orders are paid
SELECT 'Delivered orders not paid:' as check_type,
       COUNT(*) as count
FROM orders
WHERE status = 'delivered' 
AND payment_status != 'paid';

-- Check if all verified reviews are from orders
SELECT 'Verified reviews without order reference:' as check_type,
       COUNT(*) as count
FROM reviews
WHERE is_verified = TRUE 
AND order_id IS NULL; 