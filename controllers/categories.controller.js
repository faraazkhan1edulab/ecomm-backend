const connection = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.getCategories = async (req, res) => {
    try {
        const checkQuery = 'SELECT * FROM categories ORDER BY created_at DESC';
        connection.query(checkQuery, async (err, results) => {
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

exports.addCategories = async (req, res) => {
    try {
        const { category_name, description, image, status } = req.body;

        const checkQuery = 'INSERT INTO categories (category_name, description, image, status) VALUES (?, ?, ?, ?)'
        connection.query(checkQuery, [category_name, description, image, status], async (err, results) => {
            if (err) {
                return res.status(500).json(err);
            }
            else 
            {
                return res.status(200).json({ message: "Category added successfully..." });
            }
        });
    } catch (error) {
        return res.status(500).json(error);
    }
}

exports.updateCategories = async (req, res) => {
    try {
        const { category_name, description, image, status } = req.body;
        const id = req.params.id;

        const checkQuery = ' UPDATE categories SET category_name = ?,description = ?,image = ?,status = ?WHERE id = ?';
        connection.query(checkQuery, [category_name, description, image, status, id], async (err,results) =>{
            if (err) {
                return res.status(500).json(err);
            }
            else 
            {
                return res.status(200).json({ message: "Category updated successfully..." });
            }
        });
    } catch (error) {
        
    }
}

exports.deleteCategories = async (req,res) => {
    try {
        const id = req.params.id;
        const checkQuery = 'DELETE FROM categories WHERE id = ?';
        connection.query(checkQuery,[id], async(err,results) =>{
            if(err){
                return res.status(500).json(err);
            }
            else
            {
                return res.status(200).json({ message: "Category deleted successfully..." });
            }
        });
    } catch (error) {
        
    }
}