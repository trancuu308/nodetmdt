let express = require('express');
let app = express();

// Set Public Static Folder
app.use(express.static(__dirname + '/public'));

// Use View Engine
let expressHbs = require('express-handlebars');
let helper = require('./controllers/helper');
let paginateHelper = require('express-handlebars-paginate');
let hbs = expressHbs.create({
    extname: 'hbs',
    defaultLayout: 'layout',
    layoutsDir: __dirname + '/views/layouts/',
    partialsDir: __dirname + '/views/partials/',
    helpers: {
        createStarList: helper.createStarList,
        createStars: helper.createStars,
        createPagination: paginateHelper.createPagination
    }
});
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');

// Use Body Parser
let bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//Use Cookie-parser
let cookieParser = require('cookie-parser');
app.use(cookieParser());

//Use Session
let session = require('express-session');
app.use(session({
    //cookie: {httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 },
    cookie: {httpOnly: true, maxAge: null },
    secret: 'S3cret',
    resave: false,
    saveUninitialized: false
}));

// Use Cart Controller
let Cart = require('./controllers/cartController');
app.use((req, res, next) => {
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    req.session.cart = cart;
    res.locals.totalQuantity = cart.totalQuantity; 

    res.locals.fullname = req.session.user ? req.session.user.fullname : '';
    res.locals.isLoggedIn = req.session.user ? true : false;
    next();
});

app.get('/', (req, res) => {
    res.render('index');
 });

// Somewhere your code, turn off the logging
// Define your router  here


// index.js => routes/..Router.js => controllers/..Controller.js

app.use('/', require('./routes/indexRouter'));
app.use('/products', require('./routes/productRouter'));
app.use('/cart', require('./routes/cartRouter'));
app.use('/comments', require('./routes/commentRouter'));
app.use('/reviews', require('./routes/reviewRouter'));
app.use('/users', require('./routes/userRouter'));

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
//Thanh toan
const paypal = require('paypal-rest-sdk');
const fs = require('fs');
const exphdbs = require('express-handlebars');
var path = require('path');
const { parse } = require('path');


app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphdbs({ defaultLayout: 'main' }));


var items=[
    {
        "name": "Apple-Northern Spy",
        "sku": "30",
        "price": "48.54",
        "currency": "USD",
        "quantity": 2
    },
    {
        "name": "Beans-French",
        "sku": "21",
        "price": "89.23",
        "currency": "USD",
        "quantity": 1
    },
   ];


var total=0;
for(let i=0;i<items.length;i++)
{
    total+=parseFloat(items[i].price)*items[i].quantity;
}

paypal.configure({
    'mode': 'sandbox', 
    'client_id': 'ARJ8ho9Ri7v7mVXMnRhs-XspesymIFWZSMDvFLUvBIWcWs78HupPmfR-gRWhEoeGcFEQoyNCzX4vGwmc',
    'client_secret': 'EGcMaxZIGBjPv5WaPEzHrg2K9s6drauP1KEEot-Ex2V-S45bGCXa1m-a9yys3hdGMyfxcZfeFzh5mgV1'
});

app.get('/', function (req, res) {
    res.render('index.hbs',{"items": items});
})

app.post('/pay', function (req,res) {
    var create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:5000/success",
            "cancel_url": "http://localhost:5000/cancel"
        },
        "transactions": [{
            "item_list": {
                "items": items
            },
            "amount": {
                "currency": "USD",
                "total": total.toString()
            },
            "description": "This is the payment description."
        }]
    };
    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            for (let i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === 'approval_url') {
                    res.redirect(payment.links[i].href);
                }
            }
        }
    });

})
app.get('/success', function (req, res) {
    payerID = req.query.PayerID
    var execute_payment_json = {
        "payer_id": payerID,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": total.toString()
            }
        }]
    };
    var paymentId = req.query.paymentId;

    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
            console.log(error.response);
            throw error;
        } else {
            res.render('success.handlebars');
        }
    });

})

// Set Server Port & Start Server
app.set('port', process.env.PORT || 5000);
app.listen(app.get('port'), () => {
    console.log(`Server is running at port ${app.get('port')}`);
});