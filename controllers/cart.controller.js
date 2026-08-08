const connection = require("../config/db");

exports.addToCart = (req, res) => {

    const userId = req.user.id;
    const { product_id, quantity, price } = req.body;

    const getCart = 'SELECT id FROM cart WHERE user_id = ?';

    connection.query(getCart, [userId], (err, cartResult) => {

        if (err) return res.status(500).json(err);

        if (cartResult.length === 0) {

            connection.query('INSERT INTO cart(user_id) VALUES (?)', [userId], (err, insertCart) => {

                if (err) return res.status(500).json(err);

                const cartId = insertCart.insertId;

                connection.query('INSERT INTO cart_items(cart_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                    [cartId, product_id, quantity, price],
                    (err) => {

                        if (err) return res.status(500).json(err);
                        return res.status(200).json({ message: 'Product added to cart' });
                    }
                );
            }
            );
        }

        else {

            const cartId = cartResult[0].id;

            connection.query(
                'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, product_id],
                (err, itemResult) => {

                    if (err) return res.status(500).json(err);

                    if (itemResult.length > 0) {
                        connection.query('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
                            [quantity, itemResult[0].id],
                            (err) => {

                                if (err) return res.status(500).json(err);
                                return res.status(200).json({ message: 'Cart updated' });
                            }
                        );
                    }
                    else {
                        connection.query('INSERT INTO cart_items(cart_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                            [cartId, product_id, quantity, price],
                            (err) => {

                                if (err) return res.status(500).json(err);
                                return res.status(200).json({ message: 'Product added to cart' });
                            }
                        );
                    }
                }
            );
        }
    });
};

exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const query = "SELECT ci.id,ci.quantity,ci.price,p.product_name,p.image FROM cart c JOIN cart_items ci ON c.id = ci.cart_id JOIN products p ON ci.product_id = p.id WHERE c.user_id = ?";
        connection.query(query, [userId], (err, results) => {

            if (err) return res.status(500).json(err);
            return res.status(200).json(results);
        });
    } catch (error) {
        return res.status(500).json(error);
    }
}

exports.updateCartItem = async (req, res) => {
    try {
        const id = req.params.id;
        const { quantity } = req.body;

        connection.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, id], (err, results) => {

            if (err) return res.status(500).json(err);
            return res.status(200).json({ message: 'Quantity updated' });
        });

    } catch (error) {
        return res.status(500).json(error);
    }
}

exports.removeCartItem = async (req, res) => {
    try {
        const id = req.params.id;
        connection.query('DELETE FROM cart_items WHERE id = ?', [id], (err, results) => {
            if (err) {
                return res.status(500).json(err);
            }

            return res.status(200).json({ message: 'Item removed' });
        });

    } catch (error) {

    }
}