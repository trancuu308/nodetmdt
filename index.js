let express = require('express');
let app = express();

// Set Public Static Folder
app.use(express.static(__dirname + '/public'));

// Use View Engine
let expressHbs = require('express-handlebars');
let hbs = expressHbs.create({
    extname: 'hbs',
    defaultLayout: 'layout',
    layoutsDir: __dirname + '/views/layouts/',
    partialsDir: __dirname + '/views/partials/',
    
});
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');

//app.get('/', (req, res) => {
  //  res.render('index');
 //});

// Somewhere your code, turn off the logging
// Define your router  here


// index.js => routes/..Router.js => controllers/..Controller.js

app.use('/', require('./routes/indexRouter'));
app.use('/products', require('./routes/productRouter'));




app.get('/sync', (req, res) =>{
    let models = require('./models');
    models.sequelize.sync()
    .then(()=>{
        res.send('database sync completed!');
    });
});

app.get('/:page', (req, res) => {
    let banners = {
        blog: 'Our Blog',
        cart:'Shopping Cart',
        category: 'Shop Category',
        checkout:  'Check Out',
        confirmation: 'Confirmation',
        contact: 'Contact',
        login: 'Login',
        register: 'Register',
        single_blog: 'Shop Blog',
        single_product: 'Shop Product',
        tracking_order: 'Order'
 };
    let page = req.params.page;
    res.render(page, { banner: banners[page]});
});
// Set Server Port & Start Server
app.set('port', process.env.PORT || 5000);
app.listen(app.get('port'), () => {
    console.log(`Server is running at port ${app.get('port')}`);
});