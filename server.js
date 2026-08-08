const app = require("./app");
const express = require('express');
const path = require('path');

const PORT = process.env.PORT || 5000;

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(PORT, () => {

    console.log(`Server Running on ${PORT}`);

});