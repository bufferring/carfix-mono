require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, generateToken } = require('./middleware/auth');
const authRoutes = require('./routes/auth-supabase');
const { productValidation } = require('./middleware/validators');
const jwt = require('jsonwebtoken');
const { supabase } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Serve uploaded files (images) via a custom middleware (business-level solution) so that images are always served (and CORS allowed) regardless of deployment.
app.use('/uploads', (req, res, next) => {
  // (Optional) restrict to your frontend origin in production, e.g. res.header('Access-Control-Allow-Origin', 'https://myfrontend.com');
  res.header('Access-Control-Allow-Origin', '*');
  // (Optional) if you want to prepend a dynamic base URL (e.g. for deployed environments) to image URLs, you can do so here.
  // (In our case, the backend already prepends req.protocol + '://' + req.get('host') in the API endpoints, so this middleware is not strictly needed.)
  // (If you do not need dynamic base URL prepending, you can remove this middleware.)
  const baseUrl = req.protocol + '://' + req.get('host');
  req.baseUrl = baseUrl; // (or use res.locals, etc.)
  next();
}, (req, res, next) => {
  // (Custom middleware) read the file from disk (uploadsDir) and stream it (with CORS headers) so that images are always served (and CORS allowed) regardless of deployment.
  const filePath = path.join(uploadsDir, req.url.replace(/^\/uploads\//, ''));
  fs.stat(filePath, (err, stat) => {
    if (err) {
      console.error("Error stat'ing file:", err);
      return res.status(404).send("File not found");
    }
    const stream = fs.createReadStream(filePath);
    stream.on("error", (err) => {
      console.error("Error streaming file:", err);
      res.status(500).send("Internal Server Error");
    });
    res.setHeader("Content-Type", (() => {
      const ext = path.extname(filePath).toLowerCase();
      switch (ext) {
        case ".png": return "image/png";
        case ".jpg": case ".jpeg": return "image/jpeg";
        case ".gif": return "image/gif";
        default: return "application/octet-stream";
      }
    })());
    res.setHeader("Content-Length", stat.size);
    stream.pipe(res);
  });
});

// Supabase is configured in ./config/db.js

// Routes
app.use('/api/auth', authRoutes);

// Protected routes
// GET /users
app.get('/api/users', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, is_verified, is_active')
      .order('id');
    
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /products
app.get('/api/products', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT p.id, p.name, p.price, p.stock, p.featured, c.name AS category, b.name AS brand, u.name AS seller, GROUP_CONCAT(pi.image_url) AS images
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN brands b ON p.brand_id = b.id
      JOIN users u ON p.seller_id = u.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE p.is_active = true AND p.is_deleted = false
      GROUP BY p.id, p.name, p.price, p.stock, p.featured, c.name, b.name, u.name
      ORDER BY p.featured DESC, p.id
    `);
    await conn.end();
    const products = rows.map(product => {
      let images = [];
      if (product.images) {
         images = product.images.split(',').map(url => {
            let imageData = null;
            if (url && url.startsWith('/uploads/')) {
               const filePath = path.join(uploadsDir, url.replace(/^\/uploads\//, ''));
               try {
                  const data = fs.readFileSync(filePath);
                  const ext = path.extname(filePath).toLowerCase();
                  let mime = "image/png";
                  switch (ext) {
                     case ".png": mime = "image/png"; break;
                     case ".jpg": case ".jpeg": mime = "image/jpeg"; break;
                     case ".gif": mime = "image/gif"; break;
                  }
                  imageData = "data:" + mime + ";base64," + data.toString("base64");
               } catch (err) {
                  console.error("Error reading file (inline) (for product " + product.id + "):", err);
               }
            } else if (url) {
               imageData = req.protocol + '://' + req.get('host') + url;
            }
            return { imageData };
         });
      }
      delete product.images; // remove the raw GROUP_CONCAT field
      product.images = images;
      return product;
    });
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /orders (protected, only customer's own orders or all orders for admin)
app.get('/api/orders', auth, async (req, res) => {
  try {
    const conn = await getConnection();
    let query = `
      SELECT o.id, u.name AS customer, o.total_amount, o.status, o.payment_status
      FROM orders o
      JOIN users u ON o.user_id = u.id
    `;
    
    // If not admin, only show user's own orders
    if (req.user.role !== 'admin') {
      query += ' WHERE o.user_id = ?';
    }
    
    query += ' ORDER BY o.id';
    
    const [rows] = await conn.execute(
      query,
      req.user.role !== 'admin' ? [req.user.id] : []
    );
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /categories
app.get('/api/categories', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(
      'SELECT id, name, description, is_featured, is_active FROM categories WHERE is_deleted = false ORDER BY name'
    );
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /brands
app.get('/api/brands', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(
      'SELECT id, name, description, is_featured, is_active FROM brands ORDER BY id'
    );
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching brands:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /reviews
app.get('/api/reviews', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT r.id, p.name AS product, u.name AS reviewer, r.rating, r.title, r.comment, r.is_verified, r.is_approved
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      JOIN users u ON r.user_id = u.id
      ORDER BY r.id
    `);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /cart (protected, only user's own cart)
app.get('/api/cart', auth, async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT c.id, p.id AS product_id, p.name AS product_name, 
             p.price, c.quantity, p.stock,
             (SELECT pi.image_url FROM product_images pi 
              WHERE pi.product_id = p.id 
              ORDER BY pi.is_primary DESC 
              LIMIT 1) AS image_url
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.id
    `, [req.user.id]);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching cart:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /wishlist (protected, only user's own wishlist)
app.get('/api/wishlist', auth, async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT w.id, p.name AS product, p.price
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ?
      ORDER BY w.id
    `, [req.user.id]);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /notifications (protected, only user's own notifications)
app.get('/api/notifications', auth, async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT id, title, message, type, is_read, created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [req.user.id]);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /seller/products (protected, seller only)
app.get('/api/seller/products', auth, async (req, res) => {
  if (req.user.role !== 'seller') {
    return res.status(403).json({ error: 'Only sellers can access their products' });
  }
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT 
        p.id, p.name, p.description, p.price, p.stock, p.featured,
        p.is_active, p.created_at, p.updated_at,
        p.category_id, p.brand_id,
        c.name AS category, b.name AS brand,
        (SELECT COUNT(*) FROM orders o JOIN order_items oi ON o.id = oi.order_id WHERE oi.product_id = p.id) as total_orders,
        (SELECT SUM(oi.quantity) FROM orders o JOIN order_items oi ON o.id = oi.order_id WHERE oi.product_id = p.id) as total_sold,
        (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.id ASC LIMIT 1) AS image_url
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN brands b ON p.brand_id = b.id
      WHERE p.seller_id = ? AND p.is_deleted = false
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    await conn.end();
    rows.forEach(product => {
      // Ensure IDs are strings
      product.category_id = product.category_id?.toString() || '';
      product.brand_id = product.brand_id?.toString() || '';
      // Fix image URLs
      if (product.image_url) {
        if (product.image_url.startsWith('/uploads/')) {
          const filePath = path.join(uploadsDir, product.image_url.replace(/^\/uploads\//, ''));
          try {
            const data = fs.readFileSync(filePath);
            const ext = path.extname(filePath).toLowerCase();
            let mime = "image/png"; // (or "application/octet-stream" if ext is unknown)
            switch (ext) {
              case ".png": mime = "image/png"; break;
              case ".jpg": case ".jpeg": mime = "image/jpeg"; break;
              case ".gif": mime = "image/gif"; break;
            }
            product.imageData = "data:" + mime + ";base64," + data.toString("base64");
          } catch (err) {
            console.error("Error reading file (inline) (for product " + product.id + "):", err);
            product.imageData = null;
          }
        } else {
          product.imageData = req.protocol + '://' + req.get('host') + product.image_url;
        }
      } else {
        product.imageData = null;
      }
    });
    res.json(rows);
  } catch (err) {
    console.error('Error fetching seller products:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/seller/products/:id (protected, seller only)
app.get('/api/seller/products/:id', auth, async (req, res) => {
  if (req.user.role !== 'seller') {
    return res.status(403).json({ error: 'Only sellers can access their products' });
  }
  const { id } = req.params;
  const conn = await getConnection();
  try {
    const [rows] = await conn.execute(`
      SELECT p.*, p.category_id, p.brand_id, c.name AS category_name, b.name AS brand_name, GROUP_CONCAT(pi.id, ':', pi.image_url, ':', pi.is_primary) AS images
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.id = ? AND p.seller_id = ? AND p.is_deleted = false
      GROUP BY p.id
    `, [id, req.user.id]);
    if (rows.length === 0) {
      await conn.end();
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }
    const product = rows[0];
    // Ensure IDs are strings
    product.category_id = product.category_id?.toString() || '';
    product.brand_id = product.brand_id?.toString() || '';
    // Fix image URLs
    if (product.images) {
      product.images = product.images.split(',').map(img => {
        const [id, url, is_primary] = img.split(':');
        let imageData = null;
        if (url && url.startsWith('/uploads/')) {
          const filePath = path.join(uploadsDir, url.replace(/^\/uploads\//, ''));
          try {
            const data = fs.readFileSync(filePath);
            const ext = path.extname(filePath).toLowerCase();
            let mime = "image/png";
            switch (ext) {
              case ".png": mime = "image/png"; break;
              case ".jpg": case ".jpeg": mime = "image/jpeg"; break;
              case ".gif": mime = "image/gif"; break;
            }
            imageData = "data:" + mime + ";base64," + data.toString("base64");
          } catch (err) {
            console.error("Error reading file (inline) (for image " + id + "):", err);
          }
        }
        return { id: parseInt(id), imageData, is_primary: is_primary === '1' };
      });
    } else {
      product.images = [];
    }
    await conn.end();
    res.json(product);
  } catch (err) {
    console.error('Error fetching seller product:', err);
    await conn.end();
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /seller/products/:id (protected, seller only)
app.put('/api/seller/products/:id', auth, upload.array('images', 5), productValidation, async (req, res) => {
  // Check if user is a seller
  if (req.user.role !== 'seller') {
    return res.status(403).json({ error: 'Only sellers can update products' });
  }

  const connection = await getConnection();
  await connection.beginTransaction();

  try {
    const { id } = req.params;
    const { name, description, price, category_id, brand_id, stock, featured, is_active, delete_images } = req.body;

    // Verify product belongs to seller
    const [products] = await connection.execute(
      'SELECT id FROM products WHERE id = ? AND seller_id = ? AND is_deleted = false',
      [id, req.user.id]
    );

    if (products.length === 0) {
      await connection.rollback();
      await connection.end();
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    // Update product
    await connection.execute(`
      UPDATE products 
      SET name = ?, 
          description = ?, 
          price = ?, 
          category_id = ?, 
          brand_id = ?, 
          stock = ?, 
          featured = ?,
          is_active = ?,
          updated_at = NOW()
      WHERE id = ? AND seller_id = ?
    `, [
      name,
      description,
      parseFloat(price),
      parseInt(category_id),
      parseInt(brand_id),
      parseInt(stock),
      featured === '1' ? 1 : 0,
      is_active === '1' ? 1 : 0,
      id,
      req.user.id
    ]);

    // Handle image deletions if specified
    if (delete_images) {
      const imageIds = JSON.parse(delete_images);
      if (Array.isArray(imageIds) && imageIds.length > 0) {
        // Build placeholders for the IN clause
        const placeholders = imageIds.map(() => '?').join(',');
        // Get image URLs before deletion for cleanup
        const [imagesToDelete] = await connection.execute(
          `SELECT image_url FROM product_images WHERE id IN (${placeholders}) AND product_id = ?`,
          [...imageIds, id]
        );
        // Delete images from database
        await connection.execute(
          `DELETE FROM product_images WHERE id IN (${placeholders}) AND product_id = ?`,
          [...imageIds, id]
        );
        // Delete image files
        for (const image of imagesToDelete) {
          const imagePath = path.join(__dirname, image.image_url.replace('/uploads/', ''));
          fs.unlink(imagePath, (err) => {
            if (err) console.error('Error deleting image file:', err);
          });
        }
      }
    }

    // Check if there are any images left after deletion
    let imagesLeft = 0;
    const [imgCountRows] = await connection.execute(
      'SELECT COUNT(*) as count FROM product_images WHERE product_id = ?',
      [id]
    );
    if (imgCountRows && imgCountRows[0]) {
      imagesLeft = imgCountRows[0].count;
    }
    // Insert new images
    if (req.files && req.files.length > 0) {
      for (const [idx, file] of req.files.entries()) {
        await connection.execute(
          `INSERT INTO product_images (product_id, image_url, is_primary, created_at)
           VALUES (?, ?, ?, NOW())`,
          [
            id,
            `/uploads/${file.filename}`,
            imagesLeft === 0 && idx === 0 ? 1 : 0 // Set first new image as primary if no images left
          ]
        );
      }
    }

    // Commit transaction
    await connection.commit();

    // Fetch updated product (using a LEFT JOIN) so that the response includes an array of images (each with id, imageData (base64 inline), and is_primary) (or an empty array if none).
    const [updatedProducts] = await connection.execute(`
      SELECT p.id, p.name, p.description, p.price, p.stock, p.featured, p.is_active, p.created_at, p.updated_at, p.category_id, p.brand_id, c.name AS category, b.name AS brand, pi.id AS image_id, pi.image_url, pi.is_primary
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN brands b ON p.brand_id = b.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE p.id = ?
      ORDER BY pi.is_primary DESC, pi.id ASC
    `, [id]);
    if (updatedProducts.length === 0) {
       await connection.end();
       return res.status(404).json({ error: "Updated product not found." });
    }
    const product = { ...updatedProducts[0], images: [] };
    // Ensure IDs are strings (for consistency)
    product.category_id = product.category_id?.toString() || '';
    product.brand_id = product.brand_id?.toString() || '';
    // Loop over rows (one per image) and build an array of images (each with id, imageData (base64 inline), and is_primary) (or an empty array if none).
    updatedProducts.forEach((row) => {
      if (row.image_id) {
         let imageData = null;
         if (row.image_url && row.image_url.startsWith('/uploads/')) {
            const filePath = path.join(uploadsDir, row.image_url.replace(/^\/uploads\//, ''));
            try {
               const data = fs.readFileSync(filePath);
               const ext = path.extname(filePath).toLowerCase();
               let mime = "image/png";
               switch (ext) {
                  case ".png": mime = "image/png"; break;
                  case ".jpg": case ".jpeg": mime = "image/jpeg"; break;
                  case ".gif": mime = "image/gif"; break;
               }
               imageData = "data:" + mime + ";base64," + data.toString("base64");
            } catch (err) {
               console.error("Error reading file (inline) (for image " + row.image_id + "):", err);
            }
         } else if (row.image_url) {
            imageData = req.protocol + '://' + req.get('host') + row.image_url;
         }
         product.images.push({ id: row.image_id, imageData, is_primary: row.is_primary === 1 });
      }
    });
    await connection.end();
    res.json(product);
  } catch (error) {
    // Rollback transaction on error
    await connection.rollback();
    
    // Delete uploaded files if there was an error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }
    
    console.error('Error updating product:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// DELETE /seller/products/:id (protected, seller only)
app.delete('/api/seller/products/:id', auth, async (req, res) => {
  // Check if user is a seller
  if (req.user.role !== 'seller') {
    return res.status(403).json({ error: 'Only sellers can delete products' });
  }

  try {
    const { id } = req.params;
    const conn = await getConnection();

    // Verify product belongs to seller
    const [products] = await conn.execute(
      'SELECT id FROM products WHERE id = ? AND seller_id = ?',
      [id, req.user.id]
    );

    if (products.length === 0) {
      await conn.end();
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    // Soft delete product
    await conn.execute(
      'UPDATE products SET is_deleted = true, updated_at = NOW() WHERE id = ?',
      [id]
    );

    await conn.end();
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create product endpoint (protected, seller only)
app.post('/api/products', auth, upload.array('images', 5), productValidation, async (req, res) => {
  // Check if user is a seller
  if (req.user.role !== 'seller') {
    return res.status(403).json({ error: 'Only sellers can create products' });
  }

  const connection = await getConnection();
  await connection.beginTransaction();

  try {
    const { name, description, price, category_id, brand_id, stock, featured } = req.body;

    // Insert product
    const [result] = await connection.execute(
      `INSERT INTO products (
        name, description, price, category_id, brand_id, 
        seller_id, stock, featured, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, NOW())`,
      [
        name,
        description,
        parseFloat(price),
        parseInt(category_id),
        parseInt(brand_id),
        req.user.id,
        parseInt(stock),
        featured === '1' ? 1 : 0
      ]
    );

    const productId = result.insertId;

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      // Insert images one by one to ensure proper error handling
      for (const file of req.files) {
        await connection.execute(
          `INSERT INTO product_images (product_id, image_url, is_primary, created_at)
           VALUES (?, ?, ?, NOW())`,
          [productId, `/uploads/${file.filename}`, req.files.indexOf(file) === 0] // First image is primary
        );
      }
    }

    // Commit transaction
    await connection.commit();

    // Get the created product with images
    const [products] = await connection.execute(
      `SELECT p.*, 
        GROUP_CONCAT(pi.image_url) as images
       FROM products p
       LEFT JOIN product_images pi ON p.id = pi.product_id
       WHERE p.id = ?
       GROUP BY p.id`,
      [productId]
    );

    // Format the response
    const product = products[0];
    if (product.images) {
      product.images = product.images.split(',');
    } else {
      product.images = [];
    }

    res.status(201).json(product);
  } catch (error) {
    // Rollback transaction on error
    await connection.rollback();
    
    // Delete uploaded files if there was an error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }
    
    console.error('Error creating product:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// POST /cart (protected, customer only)
app.post('/api/cart', auth, async (req, res) => {
  // Check if user is a customer
  if (req.user.role !== 'customer') {
    return res.status(403).json({ error: 'Only customers can add items to cart' });
  }

  try {
    const { product_id, quantity } = req.body;
    const conn = await getConnection();

    // Check if product exists and is active
    const [products] = await conn.execute(
      'SELECT id, stock FROM products WHERE id = ? AND is_active = true AND is_deleted = false',
      [product_id]
    );

    if (products.length === 0) {
      await conn.end();
      return res.status(404).json({ error: 'Product not found or unavailable' });
    }

    const product = products[0];
    if (product.stock < quantity) {
      await conn.end();
      return res.status(400).json({ error: 'Not enough stock available' });
    }

    // Check if item already in cart
    const [existingItems] = await conn.execute(
      'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    );

    if (existingItems.length > 0) {
      // Update quantity
      const newQuantity = existingItems[0].quantity + quantity;
      if (product.stock < newQuantity) {
        await conn.end();
        return res.status(400).json({ error: 'Not enough stock available' });
      }

      await conn.execute(
        'UPDATE cart SET quantity = ? WHERE id = ?',
        [newQuantity, existingItems[0].id]
      );
    } else {
      // Add new item
      await conn.execute(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.user.id, product_id, quantity]
      );
    }

    // Get updated cart
    const [cartItems] = await conn.execute(`
      SELECT c.id, p.name AS product, c.quantity, p.price
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.id
    `, [req.user.id]);

    await conn.end();
    res.json(cartItems);
  } catch (err) {
    console.error('Error adding to cart:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /cart/:id (protected, customer only)
app.put('/api/cart/:id', auth, async (req, res) => {
  const { quantity } = req.body;
  if (quantity === undefined || quantity < 1) {
    return res.status(400).json({ error: 'Invalid quantity' });
  }

  try {
    const conn = await getConnection();
    // First, get the cart item and the product stock
    const [cartItem] = await conn.execute(
      `SELECT c.*, p.stock 
       FROM cart c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.id = ? AND c.user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (cartItem.length === 0) {
      await conn.end();
      return res.status(404).json({ error: 'Cart item not found' });
    }

    // Check if the requested quantity exceeds available stock
    if (cartItem[0].stock < quantity) {
      await conn.end();
      return res.status(400).json({ 
        error: `Only ${cartItem[0].stock} items available in stock` 
      });
    }

    // Update the cart item
    await conn.execute(
      'UPDATE cart SET quantity = ? WHERE id = ?',
      [quantity, req.params.id]
    );
    await conn.end();

    res.json({ message: 'Cart item updated' });
  } catch (err) {
    console.error('Error updating cart:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /cart/:id (protected, customer only)
app.delete('/api/cart/:id', auth, async (req, res) => {
  // Check if user is a customer
  if (req.user.role !== 'customer') {
    return res.status(403).json({ error: 'Only customers can remove items from cart' });
  }

  try {
    const { id } = req.params;
    const conn = await getConnection();

    // Verify cart item belongs to user
    const [cartItems] = await conn.execute(
      'SELECT id FROM cart WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (cartItems.length === 0) {
      await conn.end();
      return res.status(404).json({ error: 'Cart item not found or unauthorized' });
    }

    // Remove item
    await conn.execute(
      'DELETE FROM cart WHERE id = ?',
      [id]
    );

    await conn.end();
    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    console.error('Error removing from cart:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get cart count
app.get('/api/cart/count', auth, async (req, res) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({ error: 'Only customers can access cart' });
  }

  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(
      'SELECT COUNT(*) as count FROM cart WHERE user_id = ?',
      [req.user.id]
    );
    await conn.end();
    res.json({ count: parseInt(rows[0].count) });
  } catch (error) {
    console.error('Error getting cart count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /categories (protected, seller only)
app.post('/api/categories', auth, async (req, res) => {
  if (req.user.role !== 'seller') {
    return res.status(403).json({ error: 'Only sellers can manage categories' });
  }

  const { name, description, is_featured } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    const conn = await getConnection();
    const [result] = await conn.execute(
      'INSERT INTO categories (name, description, is_featured) VALUES (?, ?, ?)',
      [name, description, is_featured || false]
    );
    await conn.end();

    res.status(201).json({
      id: result.insertId,
      name,
      description,
      is_featured: is_featured || false,
      is_active: true
    });
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /categories/:id (protected, seller only)
app.put('/api/categories/:id', auth, async (req, res) => {
  if (req.user.role !== 'seller') {
    return res.status(403).json({ error: 'Only sellers can manage categories' });
  }

  const { id } = req.params;
  const { name, description, is_featured, is_active } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    const conn = await getConnection();
    const [result] = await conn.execute(
      'UPDATE categories SET name = ?, description = ?, is_featured = ?, is_active = ? WHERE id = ? AND is_deleted = false',
      [name, description, is_featured, is_active, id]
    );
    await conn.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      id,
      name,
      description,
      is_featured,
      is_active
    });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /categories/:id (protected, seller only)
app.delete('/api/categories/:id', auth, async (req, res) => {
  if (req.user.role !== 'seller') {
    return res.status(403).json({ error: 'Only sellers can manage categories' });
  }

  const { id } = req.params;
  try {
    const conn = await getConnection();
    
    // Check if category is in use
    const [products] = await conn.execute(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_deleted = false',
      [id]
    );
    
    if (products[0].count > 0) {
      await conn.end();
      return res.status(400).json({ error: 'Cannot delete category that has products' });
    }

    // Soft delete the category
    const [result] = await conn.execute(
      'UPDATE categories SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    await conn.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
}); 