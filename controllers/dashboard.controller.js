const connection = require("../config/db");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

exports.dashboardStatus = async (req, res) => {
    try {
        const getCount = (query) => {
            return new Promise((resolve, reject) => {
                connection.query(query, (err, result) => {
                    if (err) reject(err);
                    else resolve(result[0].count);
                });
            });
        };

        const totalUsers = await getCount("SELECT COUNT(*) AS count FROM users WHERE role = 'customer'");
        const totalProducts = await getCount("SELECT COUNT(*) AS count FROM products");
        const totalCategories = await getCount("SELECT COUNT(*) AS count FROM categories");

        let totalOrders = 0;

        const lowStockQuery = "select id, product_name, stock FROM products WHERE stock <= 5 ORDER BY stock ASC";

        connection.query(lowStockQuery, ((err, lowStockProducts) => {
            if (err) {
                return res.status(500).json(err);
            }

            return res.status(200).json({ totalUsers, totalProducts, totalCategories, totalOrders, lowStockProducts });
        }));
    } catch (error) {

    }
}

exports.uploadProductImage = (req, res) => {

    const uploadPath = path.join(__dirname, '../uploads/products');

    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: function (req, file, cb) { cb(null, uploadPath); },
        filename: function (req, file, cb) {
            const uniqueName = Date.now() + '-' + file.originalname;
            cb(null, uniqueName);
        }

    });

    const upload = multer({ storage }).single('image');
    upload(req, res, function (err) {
        if (err) {
            return res.status(500).json({ message: 'Image upload failed', error: err.message  });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded' });
        }

        return res.status(200).json({
            message: 'Image uploaded successfully',
            filename: req.file.filename,
            url: `/uploads/products/${req.file.filename}`
        });

    });

};