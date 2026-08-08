const connection = require("../config/db");


exports.checkout = (req, res) => {
    try {
        const userId = req.user.id;
        const { shipping_address, payment_method } = req.body;

        const cartQuery = "SELECT ci.id, ci.quantity, ci.price, p.id AS product_id, p.product_name FROM cart_items ci JOIN cart c ON ci.cart_id = c.id JOIN products p ON ci.product_id = p.id WHERE c.user_id = ?";
        connection.query(cartQuery, [userId], (err, cartItems) => {
            if (err) {
                return res.status(500).json(err);
            }
            else {
                if (cartItems.length === 0) {
                    return res.status(400).json({ message: 'Cart is empty' });
                }

                const totalAmount = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
                const orderQuery = "INSERT INTO orders(user_id, total_amount, payment_method, payment_status, order_status, shipping_address) VALUES (?, ?, ?, ?, ?, ?)";
                const paymentStatus = payment_method === 'COD' ? 'Pending' : 'Paid';
                connection.query(orderQuery, [userId, totalAmount, payment_method, paymentStatus, 'Pending', shipping_address], (err, orderResult) => {
                    if (err) {
                        return res.status(500).json(err);
                    }
                    else {
                        const orderId = orderResult.insertId;
                        const values = cartItems.map(item => [orderId, item.product_id, item.product_name, item.price, item.quantity]);
                        connection.query("INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES ?",
                            [values], (err) => {
                                if (err) {
                                    return res.status(500).json(err);
                                }
                                else {
                                    connection.query(`INSERT INTO payments
                                        (order_id, transaction_id, payment_gateway, amount, payment_status, paid_at)
                                        VALUES (?, ?, ?, ?, ?, ?)`,
                                        [
                                            orderId,
                                            payment_method === 'COD' ? null : 'TXN' + Date.now(),
                                            payment_method,
                                            totalAmount,
                                            payment_method === 'COD' ? 'Pending' : 'Success',
                                            payment_method === 'COD' ? null : new Date()
                                        ],
                                        (err) => {
                                            if (err) {
                                                return res.status(500).json(err);
                                            }
                                            else {
                                                connection.query(
                                                    `DELETE ci
                                                FROM cart_items ci
                                                JOIN cart c ON ci.cart_id = c.id
                                                WHERE c.user_id = ?`,
                                                    [userId],
                                                    (err) => {
                                                        if (err) {
                                                            return res.status(500).json(err);
                                                        }
                                                        else {
                                                            res.status(200).json({ message: 'Order placed successfully', orderId: orderId });
                                                        }
                                                    }
                                                )
                                            }
                                        })
                                }
                            }
                        )
                    }
                });
            }
        });

    } catch (error) {
        return res.status(500).json(err);
    }
}

exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const query = `
        SELECT
            o.id,
            o.total_amount,
            o.payment_method,
            o.payment_status,
            o.order_status,
            o.shipping_address,
            o.created_at,
            COUNT(oi.id) AS total_items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = ?
        GROUP BY o.id
        ORDER BY o.created_at DESC`;

        connection.query(query, [userId], (err, results) => {
            if (err) {
                return res.status(500).json(err);
            }
            else {
                res.status(200).json(results);
            }
        });

    } catch (error) {
        return res.status(500).json(err);
    }
}

exports.getOrderDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const orderId = req.params.id;

        const orderQuery = "select * from orders where id = ? AND user_id = ?";
        connection.query(orderQuery, [orderId, userId], (err, results) => {
            if (err) {
                return res.status(500).json(err);
            }
            else {
                return res.status(200).json(results);
            }
        });

    } catch (error) {
        return res.status(500).json(error);
    }
}

exports.getAllOrders = async (req, res) => {
    try {
        const query = `
        SELECT
            o.id,o.total_amount,
            o.payment_method,o.payment_status,
            o.order_status,o.shipping_address,
            o.created_at,u.first_name,
            u.last_name,u.email,
            COUNT(oi.id) AS total_items
            FROM orders o
            JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            GROUP BY o.id
            ORDER BY o.created_at DESC`;

        connection.query(query, (err, results) => {
            if (err) {
                return res.status(500).json(err);
            }
            else {
                res.status(200).json(results);
            }
        });

    } catch (error) {
        return res.status(500).json(error);
    }
}

exports.getAdminOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.id;
        const orderQuery = `SELECT * FROM orders WHERE id = ?`;
        connection.query(orderQuery, [orderId], (err, orderResult) => {
            if (err) {
                return res.status(500).json(err);
            }
            else {
                if (orderResult.length === 0) {
                    return res.status(404).json({ message: 'Order not found' });
                }

                const itemsQuery = `SELECT oi.product_name,oi.price,oi.quantity,p.image FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?`;
                connection.query(itemsQuery, [orderId], (err, results) => {
                    if (err) {
                        return res.status(500).json(err);
                    }
                    else {
                        return res.status(200).json({ order: orderResult[0], items: results });
                    }
                });
            }
        });

    } catch (error) {
        return res.status(500).json(error);
    }
}

exports.updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { order_status, payment_status } = req.body;
        const query = "update orders set order_status = ?, payment_status = ? where id = ?";

        connection.query(query, [order_status, payment_status, orderId], (err, results) => {
            if (err) {
                return res.status(500).json(err);
            }

            return res.status(200).json({ message: 'Order updated successfully' });
        });

    } catch (error) {
        return res.status(500).json(error);
    }
}

exports.buyAgain = async (req, res) => {
    try {
        const userId = req.user.id;
        const orderId = req.params.id;

        const orderItemsQuery = `SELECT product_id, quantity, price FROM order_items  WHERE order_id = ?`;
        connection.query(orderItemsQuery, [orderId], (err, items) => {

            if (err)
            {
                return res.status(500).json(err);
            } 

            if (items.length === 0) 
            {
                return res.status(404).json({ message: 'Order has no products' });                
            }

            connection.query(`SELECT id FROM cart WHERE user_id = ?`,[userId],(err, cartResult) => { 
                    if (err)
                    {
                        return res.status(500).json(err);
                    }
                    const useCart = (cartId) => {

                        let completed = 0;
                        items.forEach(item => {
                            connection.query(`SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?`,
                                [cartId, item.product_id],(err, existing) => {
                                    if (err)
                                    {
                                        return res.status(500).json(err);
                                    } 
                                    if (existing.length > 0) 
                                    {
                                        connection.query(`UPDATE cart_items SET quantity = quantity + ? WHERE id = ?`,
                                            [item.quantity, existing[0].id],(err) => {
                                                if(err)
                                                {
                                                    return res.status(500).json(err);
                                                } 
                                                completed++;
                                                if (completed === items.length) 
                                                {
                                                    return res.status(200).json({ message: 'Products added to cart' });                                                       
                                                    
                                                }
                                            });
                                    } 
                                    else 
                                    {
                                        connection.query(`INSERT INTO cart_items (cart_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
                                            [cartId, item.product_id, item.quantity, item.price],(err) => {
                                                if(err)
                                                {
                                                    return res.status(500).json(err);
                                                } 
                                                completed++;
                                                if (completed === items.length) 
                                                {
                                                    return res.status(200).json({ message: 'Products added to cart' });   
                                                }

                                            });
                                    }

                                }
                            );

                        });

                    };

                    if (cartResult.length > 0) 
                    {
                        useCart(cartResult[0].id);
                    } 
                    else 
                    {
                        connection.query(`INSERT INTO cart (user_id) VALUES (?)`,[userId],(err, newCart) => {
                            if (err)
                            {
                                return res.status(500).json(err);
                            } 
                            useCart(newCart.insertId);
                        });
                    }
                });
        });
    } catch (error) {
        return res.status(500).json(error);
    }
}

exports.getInvoice = async (req, res) => {
    try {
        const userId = req.user.id;
        const orderId = req.params.id;

        const query = `
            SELECT o.id,o.total_amount,
                o.payment_method,o.payment_status,
                o.order_status,o.shipping_address,
                o.created_at,u.first_name,
                u.last_name,u.email
                FROM orders o JOIN users u ON o.user_id = u.id
                WHERE o.id = ? AND o.user_id = ?`;

        connection.query(query, [orderId, userId], (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            if (result.length === 0) {
                return res.status(404).json({ message: 'Order not found' });
            }

            res.status(200).json(result[0]);
        });
    } catch (error) {
        return res.status(500).json(error);
    }
}

exports.generateInvoice = async (req, res) => {
    try 
    {
        const userId = req.user.id;
        const orderId = req.params.id;

        const orderQuery = `
            SELECT
            o.id,o.total_amount,
            o.payment_method,o.payment_status,
            o.order_status,o.shipping_address,
            o.created_at,u.first_name,
            u.last_name,u.email,u.phone
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.id = ? AND o.user_id = ?`;

        connection.query(orderQuery, [orderId, userId], (err, orderResult) => {

            if (err) 
            {
                return res.status(500).json(err);
            }

            if (orderResult.length === 0) 
            {
                return res.status(404).json({ message: 'Order not found' });                   
            }

            const itemsQuery = `
                SELECT
                oi.product_id,oi.product_name,
                oi.quantity,oi.price,
                p.image FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?`;

            connection.query(itemsQuery, [orderId], (err, itemsResult) => {

                if (err) 
                {
                    return res.status(500).json(err);
                }

                res.status(200).json({ order: orderResult[0],items: itemsResult });
            });

        });        
    } catch (error) {
        return res.status(500).json(err);        
    }
}