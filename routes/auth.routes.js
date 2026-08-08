const express = require("express");

const router = express.Router();

const authController = require('../controllers/auth.controller');
const auth = require('../middleware/auth');
const categoriesApi = require('../controllers/categories.controller');
const productsApi = require('../controllers/products.controller');
const dashboardApi = require('../controllers/dashboard.controller');
const cartApi = require('../controllers/cart.controller');
const orderApis = require('../controllers/order.controller');


router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/update', auth.verifyToken, auth.checkRole ,authController.update);
router.get('/getUsers',authController.getUsers);

//routes for categories
router.get('/getCategories', categoriesApi.getCategories);
router.post('/addCategories', auth.verifyToken, auth.checkRole, categoriesApi.addCategories);
router.put('/updateCategories/:id',auth.verifyToken, auth.checkRole, categoriesApi.updateCategories);
router.delete('/deleteCategories/:id', auth.verifyToken, auth.checkRole, categoriesApi.deleteCategories);

//routes for products
router.post('/addproducts', auth.verifyToken, auth.checkRole, productsApi.addproducts);
router.get('/getProducts', productsApi.getProducts);
router.get('/getById/:id', auth.verifyToken, productsApi.getById);
router.put('/updateProducts/:id', auth.verifyToken, auth.checkRole ,productsApi.updateProducts);
router.delete('/deleteProducts/:id', auth.verifyToken, auth.checkRole, productsApi.deleteProducts);
router.get('/products-catalog', auth.verifyToken, productsApi.getProductCatalog);

//dashboard apis
router.get('/dashboardStatus', auth.verifyToken, auth.checkRole, dashboardApi.dashboardStatus);


//images route
router.post('/uploadProductImage', auth.verifyToken, auth.checkRole, dashboardApi.uploadProductImage);

//cart apis
router.post('/addToCart', auth.verifyToken, cartApi.addToCart);
router.get('/getCart', auth.verifyToken,cartApi.getCart);
router.put('/updateCartItem/:id', auth.verifyToken, cartApi.updateCartItem);
router.delete('/removeCartItem/:id', auth.verifyToken, cartApi.removeCartItem);

//checkout apis
router.post('/checkout', auth.verifyToken, orderApis.checkout);
router.get('/myOrders', auth.verifyToken, orderApis.getMyOrders);
router.get('/myOrders/:id', auth.verifyToken, orderApis.getOrderDetails);

//admin order apis
router.get('/admin/orders', auth.verifyToken, auth.checkRole, orderApis.getAllOrders);
router.get('/admin/orders/:id', auth.verifyToken, auth.checkRole, orderApis.getAdminOrderDetails);
router.put('/admin/orders/:id/status', auth.verifyToken, auth.checkRole, orderApis.updateOrderStatus);

//purchase history apis
router.post('/orders/:id/buy-again', auth.verifyToken, orderApis.buyAgain);
router.get('/orders/:id/invoice', auth.verifyToken, orderApis.generateInvoice);



module.exports = router;