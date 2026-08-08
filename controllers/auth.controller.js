const connection = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
    try {
        const { first_name, last_name, email, phone, password } = req.body;

        if (!first_name || !email || !password) {
            return res.status(400).json({ message: "Required fields are missing" });
        }

        const checkQuery = "SELECT * FROM users WHERE email=?";

        connection.query(checkQuery, [email], async (err, results) => {
            if (err) {
                return res.status(500).json(err);
            }
            else {
                if (results.length > 0) {
                    return res.status(409).json({ message: "Email already exists" });
                }
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const insertQuery = `INSERT INTO users (first_name,last_name,email,phone,password) values(?,?,?,?,?)`;

            connection.query(insertQuery, [first_name, last_name, email, phone, hashedPassword], (err, results) => {
                if (err) {
                    return res.status(500).json(err);
                }
                else {
                    return res.status(201).json({ message: "User Registered Successfully" });
                }
            });
        });
    } catch (error) {
        return res.status(500).json(error);
    }
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Required fields are missing" });
        }
        else {
            const checkQuery = "SELECT * FROM users WHERE email=?";
            connection.query(checkQuery, [email], async (err, results) => {
                if (err) {
                    return res.status(500).json(err);
                }
                else {
                    if (results.length === 0) {
                        return res.status(401).json({ message: "Invalid Email or Password..." });
                    }

                    const user = results[0];
                    const isMatch = await bcrypt.compare(password, user.password);
                    if (!isMatch) {
                        return res.status(401).json({ message: "Wrong Password..." });
                    }
                    else {
                        const response = { id: user.id, email: user.email, role: user.role };
                        const token = jwt.sign(response, process.env.JWT_SECRET, { expiresIn: "1d" });
                        return res.status(200).json({ token, user: {id: user.id,first_name: user.first_name,last_name: user.last_name ,email: user.email,role: user.role,status: user.status }});
                    }
                }
            });
        }

    } catch (error) {
        return res.status(500).json(error);
    }
}

exports.update = async (req, res) => {
    try {
        const { id, status } = req.body;
        const checkQuery = "update users set status=? where id=?";
        connection.query(checkQuery, [status, id], (err, results) => {
            if (err) {
                return res.status(500).json(err);
            }
            else {
                if (results.affectedRows == 0) {
                    return res.status(404).json({ message: "User Id Does Not Exsist..." });
                }
                else {
                    return res.status(200).json({ message: "User Details Updated Sucessfully..." });
                }
            }
        });

    } catch (error) {
        return res.status(500).json(error);
    }
}

exports.getUsers = async (req, res) => {
    try {
        const checkQuery = "select id,first_name,last_name,email,phone,role,status,created_at from users";
        connection.query(checkQuery, (err, results) => {
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