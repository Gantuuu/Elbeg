import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { eq } from "drizzle-orm";
import multer from "multer";
import fs from "fs";
import path from "path";
import { setupAuth } from "./auth";
import { hashPassword } from "./auth";
import { sendOrderConfirmationEmail, sendNewOrderNotificationEmail, testEmailTemplate } from "./email";

// Middleware to check if user is an admin or has admin session
function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  // Check if user has admin session first
  const hasAdminSession = req.session && req.session.adminLoggedIn === true;
  
  if (hasAdminSession) {
    console.log("Admin access granted via session");
    return next();
  }
  
  // If no admin session, check if user is authenticated and has admin rights
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Үйлдлийг гүйцэтгэхийн тулд нэвтрэх шаардлагатай" });
  }

  if (!req.user.isAdmin) {
    console.log("Admin access denied:", { 
      username: req.user.username,
      isAdmin: req.user.isAdmin, 
      adminLoggedIn: hasAdminSession 
    });
    return res.status(403).json({ message: "Зөвхөн админ хандах боломжтой" });
  }

  console.log("Admin access granted:", {
    username: req.user.username,
    isAdmin: req.user.isAdmin,
    adminLoggedIn: hasAdminSession
  });

  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // -------------------- Product routes --------------------
  app.get("/api/products", async (req, res) => {
    try {
      // Set cache headers for better performance
      res.set({
        'Cache-Control': 'public, max-age=120, s-maxage=300', // 2 min browser, 5 min CDN
        'ETag': `"products-${Date.now()}"`,
      });
      
      const products = await storage.getProducts();
      res.status(200).json(products);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Бүтээгдэхүүнүүдийг авахад алдаа гарлаа" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Буруу ID өгөгдсөн" });
      }

      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Бүтээгдэхүүн олдсонгүй" });
      }

      res.status(200).json(product);
    } catch (error: any) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Бүтээгдэхүүн авахад алдаа гарлаа" });
    }
  });

  app.get("/api/products/category/:category", async (req, res) => {
    try {
      const category = req.params.category;
      const products = await storage.getProductsByCategory(category);
      res.status(200).json(products);
    } catch (error: any) {
      console.error("Error fetching products by category:", error);
      res.status(500).json({ message: "Ангиллын бүтээгдэхүүнүүдийг авахад алдаа гарлаа" });
    }
  });

  // Configure multer for file storage - save to permanent data directory
  const multerStorage = multer.diskStorage({
    destination: function(req, file, cb) {
      // Use data directory as primary permanent storage
      const dataDir = './data/uploads';
      const publicDir = './public/uploads';
      
      // Create both directories if they don't exist
      if (!fs.existsSync(dataDir)){
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      if (!fs.existsSync(publicDir)){
        fs.mkdirSync(publicDir, { recursive: true });
      }
      
      // Save to permanent data directory first
      cb(null, dataDir);
    },
    filename: function(req, file, cb) {
      // Create unique filename with timestamp and product ID if available
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const uniqueFilename = `${timestamp}-${randomSuffix}${ext}`;
      cb(null, uniqueFilename);
    }
  });

  const upload = multer({ 
    storage: multerStorage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: function(req, file, cb) {
      console.log('File filter - originalname:', file.originalname);
      console.log('File filter - mimetype:', file.mimetype);
      console.log('File filter - size:', file.size);
      
      // Check if file has valid name and content
      if (!file.originalname || file.originalname === 'undefined' || !file.mimetype) {
        console.log('Rejecting invalid file (no name or mimetype)');
        return cb(null, false);
      }
      
      const allowedTypes = /jpeg|jpg|png|gif|webp|jfif/;
      const allowedMimeTypes = /image\/(jpeg|jpg|png|gif|webp)/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedMimeTypes.test(file.mimetype);
      
      if (extname && mimetype) {
        console.log('File accepted:', file.originalname);
        return cb(null, true);
      } else {
        console.log('File rejected - invalid type:', file.originalname, file.mimetype);
        return cb(null, false);
      }
    }
  });

  // Function to ensure image exists in both data and public directories
  const ensureImagePersistence = (filename: string) => {
    return new Promise((resolve, reject) => {
      try {
        const dataFile = path.resolve(`./data/uploads/${filename}`);
        const publicFile = path.resolve(`./public/uploads/${filename}`);
        
        // Ensure directories exist
        const dataDir = path.dirname(dataFile);
        const publicDir = path.dirname(publicFile);
        
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        
        // If file exists in data directory but not in public, copy it
        if (fs.existsSync(dataFile) && !fs.existsSync(publicFile)) {
          fs.copyFileSync(dataFile, publicFile);
          console.log(`✅ Copied image from data to public: ${filename}`);
        }
        // If file exists in public but not in data, copy it
        else if (!fs.existsSync(dataFile) && fs.existsSync(publicFile)) {
          fs.copyFileSync(publicFile, dataFile);
          console.log(`✅ Backed up image from public to data: ${filename}`);
        }
        
        // Verify both files exist
        if (fs.existsSync(dataFile) && fs.existsSync(publicFile)) {
          console.log(`✅ Image persistence ensured: ${filename}`);
          resolve(true);
        } else {
          const error = `Failed to ensure image persistence: ${filename}`;
          console.error(`❌ ${error}`);
          reject(new Error(error));
        }
      } catch (error) {
        console.error('❌ Error ensuring image persistence:', error);
        reject(error);
      }
    });
  };



  app.post("/api/products", authenticateAdmin, upload.single('image'), async (req, res) => {
    try {
      let productData;
      
      if (req.body.productData) {
        // If the data was sent as FormData with productData field
        productData = JSON.parse(req.body.productData);
      } else {
        // If the data was sent directly as JSON
        productData = req.body;
      }

      // Check if file was rejected by filter
      if (req.body.productData && req.body.image && !req.file) {
        return res.status(400).json({ message: "Зөвхөн зураг оруулна уу (JPEG, PNG, GIF, WEBP)" });
      }

      // Add image URL if a file was uploaded
      if (req.file) {
        // Set the image URL path
        productData.imageUrl = `/uploads/${req.file.filename}`;
        
        // Ensure image persistence in both directories
        try {
          await ensureImagePersistence(req.file.filename);
          console.log(`✅ Product image uploaded with full persistence: ${req.file.filename}`);
        } catch (persistenceError) {
          console.error('Could not ensure image persistence:', persistenceError);
          // Continue anyway as the image exists in data directory
        }
      }

      console.log("Creating product with data:", productData);
      
      const newProduct = await storage.createProduct(productData);
      res.status(201).json(newProduct);
    } catch (error: any) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Бүтээгдэхүүн үүсгэхэд алдаа гарлаа" });
    }
  });

  app.put("/api/products/:id", authenticateAdmin, upload.single('image'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Буруу ID өгөгдсөн" });
      }

      let productData;
      
      if (req.body.productData) {
        // If the data was sent as FormData with productData field
        productData = JSON.parse(req.body.productData);
      } else {
        // If the data was sent directly as JSON
        productData = req.body;
      }

      // Check if file was rejected by filter
      if (req.body.productData && req.body.image && !req.file) {
        return res.status(400).json({ message: "Зөвхөн зураг оруулна уу (JPEG, PNG, GIF, WEBP)" });
      }

      // Add image URL if a file was uploaded
      if (req.file) {
        productData.imageUrl = `/uploads/${req.file.filename}`;
        console.log(`📸 New image uploaded: ${req.file.filename}`);
        console.log(`📸 Image URL set to: ${productData.imageUrl}`);
        
        // Ensure image persistence in both directories
        try {
          await ensureImagePersistence(req.file.filename);
          console.log(`✅ Product image updated with full persistence: ${req.file.filename}`);
        } catch (persistenceError) {
          console.error('Could not ensure image persistence:', persistenceError);
          // Continue anyway as the image exists in data directory
        }
      } else {
        console.log('📸 No new image uploaded, keeping existing imageUrl');
      }

      console.log("Updating product with data:", productData);

      const product = await storage.updateProduct(id, productData);
      if (!product) {
        return res.status(404).json({ message: "Бүтээгдэхүүн олдсонгүй" });
      }

      res.status(200).json(product);
    } catch (error: any) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Бүтээгдэхүүн шинэчлэхэд алдаа гарлаа" });
    }
  });

  app.delete("/api/products/:id", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Буруу ID өгөгдсөн" });
      }

      const success = await storage.deleteProduct(id);
      if (!success) {
        return res.status(404).json({ message: "Бүтээгдэхүүн олдсонгүй" });
      }

      // Update backup file to reflect the deletion
      try {
        const backupFilePath = path.resolve('./data/backups/products_backup.json');
        
        if (fs.existsSync(backupFilePath)) {
          const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
          const updatedBackup = backupData.filter((product: any) => product.id !== id);
          fs.writeFileSync(backupFilePath, JSON.stringify(updatedBackup, null, 2));
          console.log(`✅ Product ${id} deleted and backup updated`);
        }
      } catch (backupError) {
        console.error('Failed to update backup after product deletion:', backupError);
        // Continue anyway as the main deletion was successful
      }

      res.status(204).end();
    } catch (error: any) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Бүтээгдэхүүн устгахад алдаа гарлаа" });
    }
  });

  // -------------------- Category routes --------------------
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.status(200).json(categories);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Ангиллууд авахад алдаа гарлаа" });
    }
  });

  app.get("/api/categories/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const category = await storage.getCategoryBySlug(slug);
      if (!category) {
        return res.status(404).json({ message: "Ангилал олдсонгүй" });
      }

      res.status(200).json(category);
    } catch (error: any) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Ангилал авахад алдаа гарлаа" });
    }
  });

  // -------------------- Service Category routes --------------------
  app.get("/api/service-categories", async (req, res) => {
    try {
      const categories = await storage.getServiceCategories();
      res.status(200).json(categories);
    } catch (error: any) {
      console.error("Error fetching service categories:", error);
      res.status(500).json({ message: "Үйлчилгээний ангиллууд авахад алдаа гарлаа" });
    }
  });

  app.get("/api/service-categories/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const category = await storage.getServiceCategoryBySlug(slug);
      if (!category) {
        return res.status(404).json({ message: "Үйлчилгээний ангилал олдсонгүй" });
      }

      res.status(200).json(category);
    } catch (error: any) {
      console.error("Error fetching service category:", error);
      res.status(500).json({ message: "Үйлчилгээний ангилал авахад алдаа гарлаа" });
    }
  });

  app.post("/api/service-categories", authenticateAdmin, async (req, res) => {
    try {
      const category = req.body;
      const newCategory = await storage.createServiceCategory(category);
      res.status(201).json(newCategory);
    } catch (error: any) {
      console.error("Error creating service category:", error);
      res.status(500).json({ message: "Үйлчилгээний ангилал үүсгэхэд алдаа гарлаа" });
    }
  });

  app.put("/api/service-categories/:id", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Буруу ID өгөгдсөн" });
      }

      const category = await storage.updateServiceCategory(id, req.body);
      if (!category) {
        return res.status(404).json({ message: "Үйлчилгээний ангилал олдсонгүй" });
      }

      res.status(200).json(category);
    } catch (error: any) {
      console.error("Error updating service category:", error);
      res.status(500).json({ message: "Үйлчилгээний ангилал шинэчлэхэд алдаа гарлаа" });
    }
  });

  app.delete("/api/service-categories/:id", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Буруу ID өгөгдсөн" });
      }

      const success = await storage.deleteServiceCategory(id);
      if (!success) {
        return res.status(404).json({ message: "Үйлчилгээний ангилал олдсонгүй" });
      }

      res.status(204).end();
    } catch (error: any) {
      console.error("Error deleting service category:", error);
      res.status(500).json({ message: "Үйлчилгээний ангилал устгахад алдаа гарлаа" });
    }
  });

  // -------------------- Store routes --------------------
  app.get("/api/stores", async (req, res) => {
    try {
      const stores = await storage.getStores();
      res.status(200).json(stores);
    } catch (error: any) {
      console.error("Error fetching stores:", error);
      res.status(500).json({ message: "Байгууллагууд авахад алдаа гарлаа" });
    }
  });

  app.get("/api/service-categories/:slug/stores", async (req, res) => {
    try {
      const slug = req.params.slug;
      const stores = await storage.getStoresByCategorySlug(slug);
      res.status(200).json(stores);
    } catch (error: any) {
      console.error("Error fetching stores by category:", error);
      res.status(500).json({ message: "Ангиллын байгууллагууд авахад алдаа гарлаа" });
    }
  });

  app.get("/api/stores/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Буруу ID өгөгдсөн" });
      }

      const store = await storage.getStore(id);
      if (!store) {
        return res.status(404).json({ message: "Байгууллага олдсонгүй" });
      }

      res.status(200).json(store);
    } catch (error: any) {
      console.error("Error fetching store:", error);
      res.status(500).json({ message: "Байгууллага авахад алдаа гарлаа" });
    }
  });

  app.get("/api/stores/:id/products", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Буруу ID өгөгдсөн" });
      }

      const storeWithProducts = await storage.getStoreWithProducts(id);
      if (!storeWithProducts) {
        return res.status(404).json({ message: "Байгууллага олдсонгүй" });
      }

      res.status(200).json(storeWithProducts);
    } catch (error: any) {
      console.error("Error fetching store with products:", error);
      res.status(500).json({ message: "Байгууллагын бүтээгдэхүүнүүд авахад алдаа гарлаа" });
    }
  });

  app.post("/api/stores", async (req, res) => {
    try {
      // Ensure the requesting user is the owner
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Үйлдлийг гүйцэтгэхийн тулд нэвтрэх шаардлагатай" });
      }

      const storeData = {
        ...req.body,
        userId: req.user.id, // Set the current user as the store owner
      };

      const newStore = await storage.createStore(storeData);
      res.status(201).json(newStore);
    } catch (error: any) {
      console.error("Error creating store:", error);
      res.status(500).json({ message: "Байгууллага үүсгэхэд алдаа гарлаа" });
    }
  });

  app.put("/api/stores/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Буруу ID өгөгдсөн" });
      }

      // Ensure the requesting user is the owner
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Үйлдлийг гүйцэтгэхийн тулд нэвтрэх шаардлагатай" });
      }

      const store = await storage.getStore(id);
      if (!store) {
        return res.status(404).json({ message: "Байгууллага олдсонгүй" });
      }

      // Check ownership or admin status
      if (store.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Танд энэ үйлдлийг гүйцэтгэх эрх байхгүй байна" });
      }

      const updatedStore = await storage.updateStore(id, req.body);
      res.status(200).json(updatedStore);
    } catch (error: any) {
      console.error("Error updating store:", error);
      res.status(500).json({ message: "Байгууллага шинэчлэхэд алдаа гарлаа" });
    }
  });

  app.delete("/api/stores/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Буруу ID өгөгдсөн" });
      }

      // Ensure the requesting user is the owner
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Үйлдлийг гүйцэтгэхийн тулд нэвтрэх шаардлагатай" });
      }

      const store = await storage.getStore(id);
      if (!store) {
        return res.status(404).json({ message: "Байгууллага олдсонгүй" });
      }

      // Check ownership or admin status
      if (store.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Танд энэ үйлдлийг гүйцэтгэх эрх байхгүй байна" });
      }

      const success = await storage.deleteStore(id);
      if (!success) {
        return res.status(404).json({ message: "Байгууллага олдсонгүй" });
      }

      res.status(204).end();
    } catch (error: any) {
      console.error("Error deleting store:", error);
      res.status(500).json({ message: "Байгууллага устгахад алдаа гарлаа" });
    }
  });

  // -------------------- Admin routes --------------------
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      console.log(`Admin login attempt for username: ${username}`);
      
      // Check if username and password are provided
      if (!username || !password) {
        console.log("Admin login failed: Missing username or password");
        return res.status(400).json({ 
          message: "Хэрэглэгчийн нэр болон нууц үг оруулна уу" 
        });
      }

      // Admin credentials - should be moved to environment variables in production
      const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'arvijix2025';
      
      // Strict authentication check - both username AND password must match exactly
      if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        console.log(`Admin login failed: Invalid credentials for ${username}`);
        return res.status(401).json({ 
          message: "Хэрэглэгчийн нэр эсвэл нууц үг буруу байна" 
        });
      }
      
      console.log("Admin login successful with valid credentials");
      
      // Get or create admin user in database
      let user = await storage.getUserByUsername(username);
      if (!user) {
        try {
          user = await storage.createUser({
            username: ADMIN_USERNAME,
            password: await hashPassword(ADMIN_PASSWORD),
            email: 'admin@example.com',
            name: 'Administrator'
          });
        } catch (createError) {
          console.error("Error creating admin user:", createError);
          return res.status(500).json({
            message: "Системийн алдаа гарлаа"
          });
        }
      }
      
      // Set secure session
      if (req.session) {
        req.session.regenerate((err) => {
          if (err) {
            console.error("Error regenerating session:", err);
            return res.status(500).json({
              message: "Сэшн үүсгэхэд алдаа гарлаа."
            });
          }
          
          // Set admin session with extended cookie
          req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days 
          req.session.adminLoggedIn = true;
          req.session.adminId = user.id;
          
          console.log(`Admin login successful for user: ${username}`);
          console.log(`Session details: ID=${req.sessionID}, adminId=${req.session.adminId}, expires=${req.session.cookie.expires}`);
          
          // Save session and wait for completion before responding
          req.session.save((saveErr) => {
            if (saveErr) {
              console.error("Error saving session:", saveErr);
              return res.status(500).json({
                message: "Сэшн хадгалахад алдаа гарлаа."
              });
            }
            
            console.log("Session saved successfully for admin login");
            
            // Set additional headers for mobile browser compatibility
            res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.header('Pragma', 'no-cache');
            res.header('Expires', '0');
            res.header('Set-Cookie-SameSite', 'Lax');
            
            // Return success after session is confirmed saved
            return res.status(200).json({ 
              success: true,
              message: "Амжилттай нэвтэрлээ",
              userId: user.id,
              sessionId: req.sessionID
            });
          });
        });
      } else {
        // No session available - extremely unlikely but handle it
        return res.status(500).json({
          message: "Сэшн үүсгэх боломжгүй байна." 
        });
      }
    } catch (error: any) {
      console.error("Admin login error:", error);
      return res.status(500).json({ 
        message: "Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу." 
      });
    }
  });
  
  // Email template test route
  app.post("/api/admin/test-email", authenticateAdmin, async (req, res) => {
    try {
      const { templateId, testEmail } = req.body;
      
      if (!templateId || !testEmail) {
        return res.status(400).json({ message: "템플릿 ID와 테스트 이메일이 필요합니다" });
      }
      
      const success = await testEmailTemplate(templateId, testEmail);
      
      if (success) {
        res.status(200).json({ message: "테스트 이메일이 성공적으로 전송되었습니다" });
      } else {
        res.status(500).json({ message: "이메일 전송에 실패했습니다" });
      }
    } catch (error) {
      console.error("Error testing email:", error);
      res.status(500).json({ message: "이메일 테스트 중 오류가 발생했습니다" });
    }
  });
  
  app.get("/api/admin/check-auth", (req, res) => {
    console.log("Admin auth check requested");
    console.log("Session exists:", !!req.session);
    console.log("Session ID:", req.sessionID);
    console.log("Admin logged in:", req.session?.adminLoggedIn);
    console.log("Admin ID:", req.session?.adminId);
    console.log("Cookie header:", req.headers.cookie);
    
    if (req.session && req.session.adminLoggedIn) {
      console.log("Admin authentication verified - access granted");
      return res.status(200).json({ 
        authenticated: true,
        sessionId: req.sessionID,
        adminId: req.session.adminId
      });
    }
    
    console.log("Admin authentication failed - access denied");
    return res.status(200).json({ authenticated: false });
  });
  
  app.post("/api/admin/logout", (req, res) => {
    if (req.session) {
      console.log("Admin logout: destroying session", req.sessionID);
      
      // Better to regenerate the session completely for security
      req.session.regenerate((err) => {
        if (err) {
          console.error("Error regenerating session during logout:", err);
          // Still proceed with logout even if regeneration fails
        }
        
        // Make sure these are properly undefined
        req.session.adminLoggedIn = undefined;
        req.session.adminId = undefined;
        
        return res.status(200).json({ 
          success: true,
          message: "Амжилттай гарлаа" 
        });
      });
    } else {
      return res.status(200).json({ 
        success: true,
        message: "Амжилттай гарлаа" 
      });
    }
  });

  // Create HTTP server
  // Site Settings routes
  app.get("/api/settings/shipping-fee", async (req, res) => {
    try {
      const setting = await storage.getSiteSettingByKey("shipping_fee");
      if (!setting) {
        // Create default shipping fee setting if it doesn't exist
        const newSetting = await storage.createSiteSetting({
          key: "shipping_fee",
          value: "3000", // Default 3000 KRW shipping fee
          description: "Default shipping fee in KRW"
        });
        return res.status(200).json({ value: newSetting.value });
      }
      res.status(200).json({ value: setting.value });
    } catch (error: any) {
      console.error("Error fetching shipping fee:", error);
      res.status(500).json({ message: "Хүргэлтийн төлбөр авахад алдаа гарлаа" });
    }
  });

  app.put("/api/settings/shipping-fee", async (req, res) => {
    try {
      const { value } = req.body;
      if (!value || isNaN(Number(value))) {
        return res.status(400).json({ message: "Буруу утга өгөгдсөн" });
      }

      const setting = await storage.updateSiteSettingByKey("shipping_fee", value);
      if (!setting) {
        // Create the setting if it doesn't exist
        const newSetting = await storage.createSiteSetting({
          key: "shipping_fee",
          value: value,
          description: "Shipping fee in KRW"
        });
        return res.status(200).json({ value: newSetting.value });
      }
      
      res.status(200).json({ value: setting.value });
    } catch (error: any) {
      console.error("Error updating shipping fee:", error);
      res.status(500).json({ message: "Хүргэлтийн төлбөр шинэчлэхэд алдаа гарлаа" });
    }
  });

  app.get("/api/settings/site-name", async (req, res) => {
    try {
      const setting = await storage.getSiteSettingByKey("site_name");
      if (!setting) {
        // Create default site name setting if it doesn't exist
        const newSetting = await storage.createSiteSetting({
          key: "site_name",
          value: "Арвижих махны дэлгүүр", // Default site name
          description: "Website name"
        });
        return res.status(200).json({ value: newSetting.value });
      }
      res.status(200).json({ value: setting.value });
    } catch (error: any) {
      console.error("Error fetching site name:", error);
      res.status(500).json({ message: "Сайтын нэр авахад алдаа гарлаа" });
    }
  });

  app.get("/api/settings/hero", async (req, res) => {
    try {
      const setting = await storage.getSiteSettingByKey("hero_section");
      if (!setting) {
        // Create default hero section setting if it doesn't exist
        const defaultHero = {
          title: "Арвижих махны дэлгүүр",
          subtitle: "Шинэ шилдэг махны дэлгүүр",
          imageUrl: "/uploads/hero-bg.jpg"
        };
        
        const newSetting = await storage.createSiteSetting({
          key: "hero_section",
          value: JSON.stringify(defaultHero),
          description: "Hero section content"
        });
        return res.status(200).json(JSON.parse(newSetting.value));
      }
      
      res.status(200).json(JSON.parse(setting.value));
    } catch (error: any) {
      console.error("Error fetching hero section:", error);
      res.status(500).json({ message: "Hero section авахад алдаа гарлаа" });
    }
  });
  
  // PUT endpoint for updating hero settings
  app.put("/api/settings/hero", authenticateAdmin, upload.single('image'), async (req, res) => {
    try {
      console.log("Updating hero settings with data:", req.body);
      
      // Handle image upload if a file was provided
      let imageUrl = req.body.imageUrl; // Default to provided URL
      
      if (req.file) {
        // Set the image URL path
        imageUrl = `/uploads/${req.file.filename}`;
        
        // Copy file from data directory to public directory for immediate access
        const dataFilePath = path.resolve(`./data/uploads/${req.file.filename}`);
        const publicFilePath = path.resolve(`./public/uploads/${req.file.filename}`);
        
        try {
          // Ensure public uploads directory exists
          const publicDir = path.dirname(publicFilePath);
          if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
          }
          
          // Copy file to public directory for immediate access
          fs.copyFileSync(dataFilePath, publicFilePath);
          console.log(`✅ Hero image uploaded to permanent storage and copied to public: ${req.file.filename}`);
        } catch (copyError) {
          console.error('Could not copy hero image to public directory:', copyError);
          // File is still saved in data directory, so continue
        }
      }
      
      // Get existing hero settings
      let setting = await storage.getSiteSettingByKey("hero_section");
      
      // Parse existing settings or create default if not exists
      let currentSettings = setting ? JSON.parse(setting.value) : {
        title: "Арвижих махны дэлгүүр",
        subtitle: "Шинэ шилдэг махны дэлгүүр",
        imageUrl: "/uploads/hero-bg.jpg"
      };
      
      // Update with new values from request
      const updatedSettings = {
        ...currentSettings,
        title: req.body.title || currentSettings.title,
        subtitle: req.body.text || currentSettings.subtitle,
      };
      
      // Add image URL if a file was uploaded
      if (req.file) {
        updatedSettings.imageUrl = `/uploads/${req.file.filename}`;
        console.log("New hero image uploaded:", updatedSettings.imageUrl);
        
        // Ensure image persistence in both directories
        try {
          await ensureImagePersistence(req.file.filename);
          console.log(`✅ Hero image uploaded with full persistence: ${req.file.filename}`);
        } catch (persistenceError) {
          console.error('Could not ensure hero image persistence:', persistenceError);
        }
      } else if (req.body.imageUrl) {
        updatedSettings.imageUrl = req.body.imageUrl;
      }
      
      // Update or create settings
      if (setting) {
        setting = await storage.updateSiteSetting(setting.id, {
          value: JSON.stringify(updatedSettings)
        });
      } else {
        setting = await storage.createSiteSetting({
          key: "hero_section",
          value: JSON.stringify(updatedSettings),
          description: "Hero section content"
        });
      }
      
      res.status(200).json(updatedSettings);
    } catch (error: any) {
      console.error("Error updating hero settings:", error);
      res.status(500).json({ message: "Нүүр хуудасны тохиргоог шинэчлэхэд алдаа гарлаа" });
    }
  });

  app.get("/api/settings/footer", async (req, res) => {
    try {
      const setting = await storage.getSiteSettingByKey("footer_section");
      if (!setting) {
        // Create default footer section setting if it doesn't exist
        const defaultFooter = {
          companyName: "Арвижих махны дэлгүүр",
          description: "Чанартай махны бүтээгдэхүүн",
          address: "청주시 흥덕구 봉명동 1091",
          phone: "010 6884 9193",
          copyright: "© 2025 Арвижих махны дэлгүүр. Бүх эрх хуулиар хамгаалагдсан."
        };
        
        const newSetting = await storage.createSiteSetting({
          key: "footer_section",
          value: JSON.stringify(defaultFooter),
          description: "Footer section content"
        });
        return res.status(200).json(JSON.parse(newSetting.value));
      }
      
      res.status(200).json(JSON.parse(setting.value));
    } catch (error: any) {
      console.error("Error fetching footer section:", error);
      res.status(500).json({ message: "Footer section авахад алдаа гарлаа" });
    }
  });

  // Admin Users routes
  app.get("/api/admin/users", async (req, res) => {
    try {
      // Check if user has admin session
      const hasAdminSession = req.session && req.session.adminLoggedIn === true;
      
      if (!hasAdminSession) {
        // If no admin session, check if user is authenticated and is admin
        if (!req.isAuthenticated()) {
          return res.status(401).json({ message: "Үйлдлийг гүйцэтгэхийн тулд нэвтрэх шаардлагатай" });
        }
        
        if (!req.user.isAdmin) {
          return res.status(403).json({ message: "Зөвхөн админ хандах боломжтой" });
        }
      }
      
      console.log("Admin users API access granted via session");
      
      // Get all users
      const users = await storage.getAllUsers();
      console.log(`Retrieved ${users.length} users for admin panel`);
      res.status(200).json(users);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Хэрэглэгчдийн мэдээлэл авахад алдаа гарлаа" });
    }
  });

  // Orders routes
  app.post("/api/orders", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Үйлдлийг гүйцэтгэхийн тулд нэвтрэх шаардлагатай" });
      }
      
      const { orderData, cartItems } = req.body;
      console.log("Received order data:", orderData);
      console.log("Received cart items:", cartItems);

      if (!orderData || !cartItems || cartItems.length === 0) {
        return res.status(400).json({ message: "Захиалгын мэдээлэл эсвэл сагсны мэдээлэл дутуу байна" });
      }

      // Create order with the current user ID
      const orderToCreate = {
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        customerAddress: orderData.customerAddress,
        totalAmount: orderData.totalAmount,
        status: "pending",
        userId: req.user.id
      };

      // Convert cart items to order items format
      const orderItems = cartItems.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      }));

      // Create the order
      const order = await storage.createOrder(orderToCreate, orderItems);
      console.log(`주문 생성 완료: ID=${order.id}, 고객=${orderData.customerName}`);
      
      // Send order confirmation email and admin notification
      try {
        // Get order items with product details for email
        const orderItemsWithDetails = await Promise.all(
          orderItems.map(async (item) => {
            const product = await storage.getProduct(item.productId);
            return {
              name: product?.name || '알 수 없는 상품',
              quantity: item.quantity,
              price: new Intl.NumberFormat('ko-KR').format(Number(item.price)) + '원'
            };
          })
        );

        const orderEmailData = {
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          orderNumber: order.id.toString(),
          orderDate: new Date().toLocaleDateString('ko-KR'),
          totalAmount: new Intl.NumberFormat('ko-KR').format(Number(orderData.totalAmount)) + '원',
          items: orderItemsWithDetails,
          deliveryAddress: orderData.customerAddress,
          phoneNumber: orderData.customerPhone
        };

        // Send confirmation email to customer
        await sendOrderConfirmationEmail(orderEmailData);
        console.log(`Order confirmation email sent to ${orderData.customerEmail}`);

        // Send notification email to admin
        await sendNewOrderNotificationEmail(orderEmailData);
        console.log('New order notification email sent to admin');
      } catch (emailError) {
        console.error('Error sending order emails:', emailError);
        // Continue with order creation even if email fails
      }

      // Return the created order with ID
      res.status(200).json(order);
    } catch (error: any) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Захиалга үүсгэхэд алдаа гарлаа", error: error.message });
    }
  });

  app.get("/api/orders", async (req, res) => {
    try {
      // Check if user is authenticated or has admin session
      const hasAdminSession = req.session && req.session.adminLoggedIn === true;
      const isAuthenticated = req.isAuthenticated();
      
      if (!isAuthenticated && !hasAdminSession) {
        return res.status(401).json({ message: "Үйлдлийг гүйцэтгэхийн тулд нэвтрэх шаардлагатай" });
      }
      
      // Extract query parameters for date filtering
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      
      let orders: any[] = [];
      
      if (hasAdminSession || (isAuthenticated && req.user.isAdmin)) {
        // Admin can see all orders
        orders = await storage.getOrdersWithItems(
          startDate ? new Date(startDate) : undefined,
          endDate ? new Date(endDate) : undefined
        );
        console.log(`Retrieved ${orders.length} orders for admin`);
      } else if (isAuthenticated) {
        // Regular users can only see their own orders
        orders = await storage.getUserOrders(req.user.id);
        console.log(`Retrieved ${orders.length} orders for user ${req.user.id}`);
      }
      
      // Apply date filtering if necessary (for user orders)
      if ((startDate || endDate) && isAuthenticated && !req.user.isAdmin) {
        orders = orders.filter((order: any) => {
          const orderDate = new Date(order.createdAt);
          if (startDate && endDate) {
            return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
          } else if (startDate) {
            return orderDate >= new Date(startDate);
          } else if (endDate) {
            return orderDate <= new Date(endDate);
          }
          return true;
        });
      }
      
      res.status(200).json(orders);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Захиалгын мэдээлэл авахад алдаа гарлаа" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Үйлдлийг гүйцэтгэхийн тулд нэвтрэх шаардлагатай" });
      }
      
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Буруу ID өгөгдсөн" });
      }
      
      // Get order by ID
      const order = await storage.getOrderWithItems(orderId);
      
      // If order not found
      if (!order) {
        return res.status(404).json({ message: "Захиалга олдсонгүй" });
      }
      
      // Check if user has permission to view this order
      if (!req.user.isAdmin && order.userId !== req.user.id) {
        return res.status(403).json({ message: "Энэ захиалгыг харах эрх байхгүй байна" });
      }
      
      res.status(200).json(order);
    } catch (error: any) {
      console.error("Error fetching order details:", error);
      res.status(500).json({ message: "Захиалгын мэдээлэл авахад алдаа гарлаа" });
    }
  });

  // Support both PUT and PATCH methods for changing order status
  const handleUpdateOrderStatus = async (req: Request, res: Response) => {
    try {
      // Check if user has admin session first (most reliable check)
      const hasAdminSession = req.session && req.session.adminLoggedIn === true;
      
      // If no admin session, check if user is authenticated and is admin
      if (!hasAdminSession) {
        // If user is not even authenticated, deny access
        if (!req.isAuthenticated()) {
          console.log("Admin access denied for order status update: Not authenticated");
          return res.status(401).json({ message: "Үйлдлийг гүйцэтгэхийн тулд нэвтрэх шаардлагатай" });
        }
        
        // If user is authenticated but not an admin, deny access
        if (!req.user.isAdmin) {
          console.log("Admin access denied for order status update: Not an admin", { 
            username: req.user.username,
            isAdmin: req.user.isAdmin
          });
          return res.status(403).json({ message: "Зөвхөн админ хандах боломжтой" });
        }
      }
      
      console.log("Admin access granted for order status update:", {
        hasAdminSession,
        isAuthenticated: req.isAuthenticated(),
        userId: req.user?.id || req.session?.adminId
      });
      
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Буруу ID өгөгдсөн" });
      }
      
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Төлвийн мэдээлэл өгөгдөөгүй" });
      }
      
      console.log(`Updating order status for order ${orderId} to "${status}"`);
      
      // Update order status
      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      
      // If order not found
      if (!updatedOrder) {
        return res.status(404).json({ message: "Захиалга олдсонгүй" });
      }
      
      console.log("Order status updated successfully:", updatedOrder);
      
      // Make sure we always return JSON response
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(updatedOrder);
    } catch (error: any) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Захиалгын төлөв шинэчлэхэд алдаа гарлаа" });
    }
  };
  
  // Register both routes with the same handler
  app.put("/api/orders/:id/status", handleUpdateOrderStatus);
  app.patch("/api/orders/:id/status", handleUpdateOrderStatus);

  // Bank Account routes
  app.get("/api/bank-accounts", async (req, res) => {
    try {
      const accounts = await storage.getBankAccounts();
      res.status(200).json(accounts);
    } catch (error: any) {
      console.error("Error fetching bank accounts:", error);
      res.status(500).json({ message: "Банкны данс авахад алдаа гарлаа" });
    }
  });

  app.get("/api/bank-accounts/default", async (req, res) => {
    try {
      const account = await storage.getDefaultBankAccount();
      if (!account) {
        return res.status(404).json({ message: "Үндсэн банкны данс олдсонгүй" });
      }
      res.status(200).json(account);
    } catch (error: any) {
      console.error("Error fetching default bank account:", error);
      res.status(500).json({ message: "Үндсэн банкны данс авахад алдаа гарлаа" });
    }
  });

  app.get("/api/bank-accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Буруу ID өгөгдсөн" });
      }
      
      const account = await storage.getBankAccount(id);
      if (!account) {
        return res.status(404).json({ message: "Банкны данс олдсонгүй" });
      }
      
      res.status(200).json(account);
    } catch (error: any) {
      console.error("Error fetching bank account:", error);
      res.status(500).json({ message: "Банкны данс авахад алдаа гарлаа" });
    }
  });

  app.post("/api/bank-accounts", async (req, res) => {
    try {
      console.log("Creating bank account with data:", req.body);
      const account = await storage.createBankAccount(req.body);
      res.status(201).json(account);
    } catch (error: any) {
      console.error("Error creating bank account:", error);
      res.status(500).json({ message: "Банкны данс үүсгэхэд алдаа гарлаа" });
    }
  });

  app.post("/api/bank-accounts/:id/set-default", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Буруу ID өгөгдсөн" });
      }
      
      const success = await storage.setDefaultBankAccount(id);
      if (!success) {
        return res.status(404).json({ message: "Банкны данс олдсонгүй" });
      }
      
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Error setting default bank account:", error);
      res.status(500).json({ message: "Үндсэн банкны данс тохируулахад алдаа гарлаа" });
    }
  });

  app.put("/api/bank-accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Буруу ID өгөгдсөн" });
      }
      
      const account = await storage.updateBankAccount(id, req.body);
      if (!account) {
        return res.status(404).json({ message: "Банкны данс олдсонгүй" });
      }
      
      res.status(200).json(account);
    } catch (error: any) {
      console.error("Error updating bank account:", error);
      res.status(500).json({ message: "Банкны данс шинэчлэхэд алдаа гарлаа" });
    }
  });

  app.delete("/api/bank-accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Буруу ID өгөгдсөн" });
      }
      
      const success = await storage.deleteBankAccount(id);
      if (!success) {
        return res.status(404).json({ message: "Банкны данс олдсонгүй" });
      }
      
      res.status(204).end();
    } catch (error: any) {
      console.error("Error deleting bank account:", error);
      res.status(500).json({ message: "Банкны данс устгахад алдаа гарлаа" });
    }
  });

  // Media upload API for general image uploads
  app.post("/api/media/upload", authenticateAdmin, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Файл сонгогдоогүй байна" });
      }

      // Copy file from data directory to public directory for immediate access
      const dataFilePath = path.resolve(`./data/uploads/${req.file.filename}`);
      const publicFilePath = path.resolve(`./public/uploads/${req.file.filename}`);
      
      try {
        // Ensure public uploads directory exists
        const publicDir = path.dirname(publicFilePath);
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        
        // Copy file to public directory for immediate access
        fs.copyFileSync(dataFilePath, publicFilePath);
        console.log(`✅ Media file uploaded to permanent storage and copied to public: ${req.file.filename}`);
      } catch (copyError) {
        console.error('Could not copy media file to public directory:', copyError);
        // File is still saved in data directory, so continue
      }

      // Return the media information
      const mediaItem = {
        id: Date.now(), // Simple ID for now
        name: req.file.originalname,
        type: req.file.mimetype,
        url: `/uploads/${req.file.filename}`,
        size: req.file.size,
        createdAt: new Date().toISOString()
      };

      res.status(201).json(mediaItem);
    } catch (error: any) {
      console.error("Error uploading media file:", error);
      res.status(500).json({ message: "Файл хуулахад алдаа гарлаа" });
    }
  });

  // -------------------- Navigation routes --------------------
  app.get("/api/navigation", async (req, res) => {
    try {
      // Return default navigation items for the site
      const defaultNavigation = [
        {
          id: 1,
          title: "Нүүр",
          url: "/",
          order: 1,
          parentId: null,
          isActive: true
        },
        {
          id: 2,
          title: "Холбоо барих",
          url: "/contact",
          order: 2,
          parentId: null,
          isActive: true
        }
      ];
      
      res.status(200).json(defaultNavigation);
    } catch (error: any) {
      console.error("Error fetching navigation:", error);
      res.status(500).json({ message: "Навигацийн мэдээлэл авахад алдаа гарлаа" });
    }
  });

  // Media list API - returns list of uploaded media files
  app.get("/api/media", authenticateAdmin, async (req, res) => {
    try {
      const dataUploadsDir = './data/uploads';
      const mediaItems = [];

      if (fs.existsSync(dataUploadsDir)) {
        const files = fs.readdirSync(dataUploadsDir);
        
        for (const file of files) {
          const filePath = path.join(dataUploadsDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.isFile()) {
            mediaItems.push({
              id: file.split('-')[0], // Use timestamp part as ID
              name: file,
              type: path.extname(file).toLowerCase().includes('jpg') || path.extname(file).toLowerCase().includes('jpeg') ? 'image/jpeg' :
                    path.extname(file).toLowerCase().includes('png') ? 'image/png' :
                    path.extname(file).toLowerCase().includes('gif') ? 'image/gif' : 'image/unknown',
              url: `/uploads/${file}`,
              size: stats.size,
              createdAt: stats.birthtime.toISOString()
            });
          }
        }
      }

      // Sort by creation date, newest first
      mediaItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.status(200).json(mediaItems);
    } catch (error: any) {
      console.error("Error fetching media files:", error);
      res.status(500).json({ message: "Медиа файлуудыг авахад алдаа гарлаа" });
    }
  });

  // Delete media file API
  app.delete("/api/media/:id", authenticateAdmin, async (req, res) => {
    try {
      const fileId = req.params.id;
      const dataUploadsDir = './data/uploads';
      const publicUploadsDir = './public/uploads';
      
      // Find file with matching ID (timestamp)
      let targetFile = null;
      if (fs.existsSync(dataUploadsDir)) {
        const files = fs.readdirSync(dataUploadsDir);
        targetFile = files.find(file => file.startsWith(fileId + '-'));
      }
      
      if (!targetFile) {
        return res.status(404).json({ message: "Файл олдсонгүй" });
      }
      
      // Delete from both directories
      const dataFilePath = path.join(dataUploadsDir, targetFile);
      const publicFilePath = path.join(publicUploadsDir, targetFile);
      
      try {
        if (fs.existsSync(dataFilePath)) {
          fs.unlinkSync(dataFilePath);
          console.log(`✅ Deleted media file from data directory: ${targetFile}`);
        }
        
        if (fs.existsSync(publicFilePath)) {
          fs.unlinkSync(publicFilePath);
          console.log(`✅ Deleted media file from public directory: ${targetFile}`);
        }
        
        res.status(204).end();
      } catch (deleteError) {
        console.error('Error deleting media file:', deleteError);
        res.status(500).json({ message: "Файл устгахад алдаа гарлаа" });
      }
    } catch (error: any) {
      console.error("Error in delete media API:", error);
      res.status(500).json({ message: "Файл устгахад алдаа гарлаа" });
    }
  });

  // Logo settings API endpoints
  app.get("/api/settings/logo", async (req, res) => {
    try {
      const setting = await storage.getSiteSettingByKey("logo_url");
      if (!setting) {
        // Create default logo setting if it doesn't exist
        const newSetting = await storage.createSiteSetting({
          key: "logo_url",
          value: "/logo.png",
          description: "Site logo URL"
        });
        return res.status(200).json({ logoUrl: newSetting.value });
      }
      
      res.status(200).json({ logoUrl: setting.value });
    } catch (error: any) {
      console.error("Error fetching logo settings:", error);
      res.status(500).json({ message: "Лого тохиргоо авахад алдаа гарлаа" });
    }
  });

  app.put("/api/settings/logo", authenticateAdmin, upload.single('logo'), async (req, res) => {
    try {
      console.log("Updating logo settings with data:", req.body);
      
      // Handle image upload if a file was provided
      let logoUrl = req.body.logoUrl; // Default to provided URL
      
      if (req.file) {
        // Set the logo URL path
        logoUrl = `/uploads/${req.file.filename}`;
        
        // Copy file from data directory to public directory for immediate access
        const dataFilePath = path.resolve(`./data/uploads/${req.file.filename}`);
        const publicFilePath = path.resolve(`./public/uploads/${req.file.filename}`);
        
        try {
          // Ensure public uploads directory exists
          const publicDir = path.dirname(publicFilePath);
          if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
          }
          
          // Copy file to public directory for immediate access
          fs.copyFileSync(dataFilePath, publicFilePath);
          console.log(`✅ Logo image uploaded to permanent storage and copied to public: ${req.file.filename}`);
        } catch (copyError) {
          console.error('Could not copy logo image to public directory:', copyError);
          // File is still saved in data directory, so continue
        }
      }
      
      // Get existing logo settings
      let setting = await storage.getSiteSettingByKey("logo_url");
      
      if (setting) {
        // Update existing setting
        setting = await storage.updateSiteSetting(setting.id, {
          value: logoUrl,
          description: "Site logo URL"
        });
      } else {
        // Create new setting
        setting = await storage.createSiteSetting({
          key: "logo_url",
          value: logoUrl,
          description: "Site logo URL"
        });
      }
      
      console.log("Logo settings updated successfully:", setting);
      if (setting) {
        res.status(200).json({ logoUrl: setting.value });
      } else {
        res.status(200).json({ logoUrl: logoUrl });
      }
    } catch (error: any) {
      console.error("Error updating logo settings:", error);
      res.status(500).json({ message: "Лого тохиргоо шинэчлэхэд алдаа гарлаа" });
    }
  });

  // Get pending order count for admin notifications - optimized with caching
  let pendingOrdersCountCache = { count: 0, lastUpdated: 0 };
  const CACHE_DURATION = 30000; // 30 seconds cache
  
  app.get("/api/admin/pending-orders-count", authenticateAdmin, async (req, res) => {
    try {
      const now = Date.now();
      
      // Return cached result if still valid
      if (now - pendingOrdersCountCache.lastUpdated < CACHE_DURATION) {
        return res.status(200).json({ count: pendingOrdersCountCache.count });
      }
      
      // Fetch fresh data and update cache
      const pendingOrdersCount = await storage.getPendingOrdersCount();
      pendingOrdersCountCache = {
        count: pendingOrdersCount,
        lastUpdated: now
      };
      
      res.status(200).json({ count: pendingOrdersCount });
    } catch (error: any) {
      console.error("Error fetching pending orders count:", error);
      res.status(500).json({ message: "Pending orders count авахад алдаа гарлаа" });
    }
  });

  // Set up authentication routes
  setupAuth(app);
  

  
  // Enhanced image restoration function - ensures ALL images from data directory are available in public directory
  const restoreAllImages = async () => {
    try {
      console.log('🔄 Starting comprehensive image restoration process...');
      
      const dataUploadsDir = './data/uploads';
      const publicUploadsDir = './public/uploads';
      
      // Ensure both directories exist
      if (!fs.existsSync(dataUploadsDir)) {
        fs.mkdirSync(dataUploadsDir, { recursive: true });
        console.log('📁 Created data/uploads directory');
      }
      
      if (!fs.existsSync(publicUploadsDir)) {
        fs.mkdirSync(publicUploadsDir, { recursive: true });
        console.log('📁 Created public/uploads directory');
      }
      
      // Count variables for reporting
      let restoredCount = 0;
      let alreadyExistCount = 0;
      let failedCount = 0;
      
      // Get all files from data/uploads directory
      const dataFiles = fs.readdirSync(dataUploadsDir);
      
      for (const filename of dataFiles) {
        const dataFilePath = path.join(dataUploadsDir, filename);
        const publicFilePath = path.join(publicUploadsDir, filename);
        
        // Skip if it's not a file
        const stats = fs.statSync(dataFilePath);
        if (!stats.isFile()) continue;
        
        // Check if file already exists in public directory
        if (fs.existsSync(publicFilePath)) {
          alreadyExistCount++;
          continue;
        }
        
        // Copy file from data to public directory
        try {
          fs.copyFileSync(dataFilePath, publicFilePath);
          console.log(`✅ Restored image to public folder: ${filename}`);
          restoredCount++;
        } catch (copyError) {
          console.error(`❌ Failed to restore image: ${filename}`, copyError);
          failedCount++;
        }
      }
      
      console.log(`🎉 Image restoration complete! Restored: ${restoredCount}, Already existed: ${alreadyExistCount}, Failed: ${failedCount}`);
      
      // Also check for product images specifically and report any missing ones
      try {
        const products = await storage.getProducts();
        let missingProductImages = 0;
        
        for (const product of products) {
          if (product.imageUrl && product.imageUrl.startsWith('/uploads/')) {
            const filename = product.imageUrl.replace('/uploads/', '');
            const dataFilePath = path.resolve(`./data/uploads/${filename}`);
            
            if (!fs.existsSync(dataFilePath)) {
              console.log(`⚠️  Product image missing from storage: ${filename} (Product: ${product.name}, ID: ${product.id})`);
              missingProductImages++;
            }
          }
        }
        
        if (missingProductImages > 0) {
          console.log(`⚠️  Found ${missingProductImages} product images missing from permanent storage`);
        }
      } catch (productCheckError) {
        console.error('Error checking product images:', productCheckError);
      }
      
      return { 
        success: true, 
        restored: restoredCount, 
        alreadyExisted: alreadyExistCount, 
        failed: failedCount 
      };
    } catch (error) {
      console.error('❌ Error during image restoration:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };
  
  // Add endpoint to restore missing images
  app.post("/api/admin/restore-images", authenticateAdmin, async (req, res) => {
    try {
      const result = await restoreAllImages();
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error restoring images:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error restoring images", 
        error: error.message 
      });
    }
  });
  
  // Non-delivery days API
  app.get("/api/non-delivery-days", async (req, res) => {
    try {
      const days = await storage.getNonDeliveryDays();
      res.json(days);
    } catch (error: any) {
      console.error("Error fetching non-delivery days:", error);
      res.status(500).json({ message: "Error fetching non-delivery days" });
    }
  });
  
  app.post("/api/non-delivery-days", authenticateAdmin, async (req, res) => {
    try {
      const { date, reason, isRecurringYearly } = req.body;
      const day = await storage.createNonDeliveryDay({
        date: new Date(date),
        reason,
        isRecurringYearly: isRecurringYearly || false,
      });
      res.status(201).json(day);
    } catch (error: any) {
      console.error("Error creating non-delivery day:", error);
      res.status(500).json({ message: "Error creating non-delivery day" });
    }
  });
  
  app.delete("/api/non-delivery-days/:id", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteNonDeliveryDay(id);
      if (success) {
        res.status(200).json({ message: "Non-delivery day deleted" });
      } else {
        res.status(404).json({ message: "Non-delivery day not found" });
      }
    } catch (error: any) {
      console.error("Error deleting non-delivery day:", error);
      res.status(500).json({ message: "Error deleting non-delivery day" });
    }
  });
  
  // Delivery settings API
  app.get("/api/delivery-settings", async (req, res) => {
    try {
      let settings = await storage.getDeliverySettings();
      if (!settings) {
        settings = await storage.updateDeliverySettings({
          cutoffHour: 18,
          cutoffMinute: 30,
          processingDays: 1,
        });
      }
      res.json(settings);
    } catch (error: any) {
      console.error("Error fetching delivery settings:", error);
      res.status(500).json({ message: "Error fetching delivery settings" });
    }
  });
  
  app.put("/api/delivery-settings", authenticateAdmin, async (req, res) => {
    try {
      const { cutoffHour, cutoffMinute, processingDays } = req.body;
      const settings = await storage.updateDeliverySettings({
        cutoffHour,
        cutoffMinute,
        processingDays,
      });
      res.json(settings);
    } catch (error: any) {
      console.error("Error updating delivery settings:", error);
      res.status(500).json({ message: "Error updating delivery settings" });
    }
  });

  // -------------------- Reviews routes --------------------
  app.get("/api/reviews", async (req, res) => {
    try {
      const reviews = await storage.getApprovedReviews();
      res.json(reviews);
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Сэтгэгдлүүдийг авахад алдаа гарлаа" });
    }
  });

  app.get("/api/admin/reviews", authenticateAdmin, async (req, res) => {
    try {
      const reviews = await storage.getReviews();
      res.json(reviews);
    } catch (error: any) {
      console.error("Error fetching all reviews:", error);
      res.status(500).json({ message: "Сэтгэгдлүүдийг авахад алдаа гарлаа" });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const { customerName, rating, content } = req.body;
      if (!customerName || !content) {
        return res.status(400).json({ message: "Нэр болон сэтгэгдэл шаардлагатай" });
      }
      const review = await storage.createReview({
        customerName,
        rating: rating || 5,
        content,
      });
      res.status(201).json(review);
    } catch (error: any) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Сэтгэгдэл үүсгэхэд алдаа гарлаа" });
    }
  });

  app.patch("/api/admin/reviews/:id", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const review = await storage.updateReview(id, req.body);
      if (!review) {
        return res.status(404).json({ message: "Сэтгэгдэл олдсонгүй" });
      }
      res.json(review);
    } catch (error: any) {
      console.error("Error updating review:", error);
      res.status(500).json({ message: "Сэтгэгдэл шинэчлэхэд алдаа гарлаа" });
    }
  });

  app.delete("/api/admin/reviews/:id", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteReview(id);
      if (!success) {
        return res.status(404).json({ message: "Сэтгэгдэл олдсонгүй" });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting review:", error);
      res.status(500).json({ message: "Сэтгэгдэл устгахад алдаа гарлаа" });
    }
  });

  // Serve static files from both data and public directories for image uploads
  // First try data directory (permanent storage), then fallback to public directory
  app.use('/uploads', express.static('data/uploads'));
  app.use('/uploads', express.static('public/uploads'));
  
  // Create the HTTP server
  const httpServer = createServer(app);

  return httpServer;
}