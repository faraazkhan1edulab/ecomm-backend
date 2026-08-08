const connection = require("../config/db");

exports.addproducts = async (req, res) => {
    try {
        const { product_name,description,price,stock,category_id,brand,sku,main_image,status } = req.body;
        const checkQuery = "INSERT into products(product_name,description,price,stock,category_id,brand,sku,image,status)VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        connection.query(checkQuery, [product_name,description,price,stock,category_id,brand,sku,main_image,status|| 'active'], (err,results) => {
            if(err){
                return res.status(500).json(err);
            }
            else
            {
                return res.status(200).json({  message: 'Product Added Successfully...' });
            }
        });

    } catch (error) {
        return res.status(500).json(error);
    }
}

exports.getProducts = async (req,res) => {
    try 
    {
        const checkQuery = "SELECT p.id,p.product_name,p.description,p.price,p.stock,p.brand,p.sku,p.image,p.status,p.created_at,p.updated_at,c.id AS category_id,c.category_name FROM products p INNER JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC;"
        connection.query(checkQuery, (err,results) => {
            if(err){
                return res.status(500).json(err);
            }
            else
            {
                return res.status(200).json(results);
            }
        });        
    } catch (error) {
        return res.status(500).json(error);
    }
}

exports.getById = async (req,res) => {
    try 
    {
        const id = req.params.id;
        const checkQuery = "SELECT p.id,p.product_name,p.description,p.price,p.stock,p.brand,p.sku,p.image,p.status,p.created_at,p.updated_at,c.id AS category_id,c.category_name FROM products p INNER JOIN categories c ON p.category_id = c.id WHERE p.id = ?"
        connection.query(checkQuery, [id], (err,results) => {
            if(err){
                return res.status(500).json(err);
            }
            else
            {
                return res.status(200).json(results);
            }
        });
    } catch (error) {
        return res.status(500).json(error);
    }
}

exports.updateProducts = async (req,res) => {
    try 
    {
        const id = req.params.id;
        const { product_name,description,price,stock,category_id,brand,sku,image,status } = req.body;
        const checkQuery = "UPDATE products SET product_name = ?,description = ?,price = ?,stock = ?,category_id = ?,brand = ?,sku = ?,image = ?,status = ? WHERE id = ?;"
        connection.query(checkQuery, [product_name,description,price,stock,category_id,brand,sku,image,status,id], (err,results) => {
            if(err){
                return res.status(500).json(err);
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ message: 'Product not found' });
            }

            return res.status(200).json({ message: 'Product Updated Successfully...' });
        });
    } catch (error) {
        return res.status(500).json(error);
    }
}

exports.deleteProducts = async (req,res) => {
    try 
    {
        const id = req.params.id;
        const checkQuery = "DELETE FROM products WHERE id = ?";
        connection.query(checkQuery, [id], (err,results) => {
            if(err)
            {
                return res.status(500).json(err);
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ message: 'Product not found' });
            }

            return res.status(200).json({ message: 'Product Deleted Successfully...' });
        });        
    } catch (error) {
        return res.status(500).json(error);
    }
}

exports.getProductCatalog = (req, res) => {

    const { search = '',category = '',minPrice = '',maxPrice = '',sort = 'newest',page = 1,limit = 12 } = req.query;

    let sql = `
        SELECT
            p.id,p.product_name,
            p.description,p.price,
            p.stock,p.image,
            p.brand,p.category_id,
            c.category_name FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.status = 'active'`;

    const params = [];

    if (search) {
        sql += `AND (p.product_name LIKE ? OR p.brand LIKE ? OR c.category_name LIKE ?)`;
        params.push(`%${search}%`,`%${search}%`,`%${search}%`);
    }

    if (category) {
        sql += ` AND p.category_id = ?`;
        params.push(category);
    }

    if (minPrice) {
        sql += ` AND p.price >= ?`;
        params.push(minPrice);
    }

    if (maxPrice) {
        sql += ` AND p.price <= ?`;
        params.push(maxPrice);
    }

    switch (sort) {
        case 'price_asc':
            sql += ` ORDER BY p.price ASC`;
            break;

        case 'price_desc':
            sql += ` ORDER BY p.price DESC`;
            break;

        case 'name':
            sql += ` ORDER BY p.product_name ASC`;
            break;

        default:
            sql += ` ORDER BY p.created_at DESC`;
    }

    const pageNumber = Number(page);
    const pageSize = Number(limit);
    const offset = (pageNumber - 1) * pageSize;

    sql += ` LIMIT ? OFFSET ?`;

    params.push(pageSize, offset);

    connection.query(sql, params, (err, results) => {
        if (err) 
        {
            return res.status(500).json(err);
        }
        res.status(200).json(results);
    });

};