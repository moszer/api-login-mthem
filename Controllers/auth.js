const bcrypt = require('bcryptjs');
const User = require('../Models/User.js');
const jwt = require('jsonwebtoken');
const Product = require('../Models/Products.js')
const stripe = require('stripe')('sk_test_51OG3ONAEKN9WuSMCKd6q4JznCKuooUlbzuJ2dbbz1PvGZxdXGpIJz1FKFkcQgILQhSjANkvHCPZXte3m26LnhzY300BXKrQt3v');

//register
exports.register = async (req, res) => {
    try{
        //restructure var
        const {username, passwords} = req.body;
        //user checker
        var user = await User.findOne({ username })

        if(user){
            console.log("have a user!!")
            return res.send("You registed!!")
        } else {
            console.log("not have a user!!")
        }

        //encrypt
        const salt = await bcrypt.genSalt(10);

        user = new User({
            username: username,
            passwords: passwords
        })

        user.passwords = await bcrypt.hash(passwords, salt)
        await user.save()

        res.send("Register Success");

    }catch(err){
        console.log(err)
    }
}

//login
exports.login = async (req, res) => {
    try{
        const {username, passwords} = req.body;
        var user = await User.findOneAndUpdate({ username }, {new: true})
        if(user){
            console.log('have a user!!!')
            const isMatch = await bcrypt.compare(passwords, user.passwords)
            if(!isMatch){
                return res.send("pass is not correct!!!")
            } else {
                var payload = {
                    user: {
                        name: user.username
                    }
                }
                //generate token
                const expiresInInSeconds = 15 * 24 * 60 * 60;
                jwt.sign(payload, "mosnajaaa", {expiresIn: expiresInInSeconds}, (err, token) => {
                    if(err) throw err;
                    res.json({token,payload})
                })
            }


        } else {
            console.log('not have a user')
            return res.send("Not have a user!!!")
        }

    }catch(err){
        console.log(err)
    }
}

//add product
exports.products = async (req, res) => {
    try {
        //check user in db
        const user = await User.findOne({username: req.body.username});
        if(user === null){
            return res.status(500).json({ message: 'dont have user in database' });
        }

        //if user in db // push product to db

        const { productId, productName, quantity, price } = req.body;

        const product = new Product({
            productId,
            productName,
            quantity,
            price,
            username: user._id, // Use the _id of the user as a reference
        });

        product.save();


        console.log(user)
        res.send(product)

      } catch (error) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลสินค้า' });
      }
};


//get product
exports.getproducts = async (req, res) => {
    try {
        // Check if the user exists in the database
        const user = await User.findOne({ username: req.body.username });
        if (user === null) {
          return res.status(404).json({ message: 'User not found in the database' });
        }
    
        // Retrieve all products for the user
        const products = await Product.find({ username: user._id });
    
        if (products.length === 0) {
          return res.status(404).json({ message: 'No products found for the user' });
        }
    
        res.status(200).json({ products });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting products' });
      }
};

//check token 

exports.checkToken = async (req, res) => {
  return res.send("Have a token")
}

exports.purchase = async (req, res) => {
    try {
      // Extract quantity from the request bodys
      const { quantity, domain } = req.body;
  
      // Create a Stripe Checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['promptpay'],
        line_items: [
          {
            price: 'price_1OPmV1AEKN9WuSMCUH1lxate',
            quantity: parseInt(quantity, 10),
          },
        ],
        mode: 'payment',
        success_url: `${domain}?success=true`,
        cancel_url: `${domain}?canceled=true`,
      });
  
      // Respond with the Stripe Checkout session URL
      res.json({ url: session.url });
    } catch (error) {
      console.error('Error creating checkout session:', error);
  
      // Respond with an error message
      res.status(500).json({ error: 'Internal server error' });
    }
  };

exports.tryproducts = async (req, res) => {
    try {
        // Your secret key to sign the token
        const secretKey = 'mosnajaaa';
        const validate = req.body.day
        const username = req.body.username

        // Define the payload (claims) for the token
        const payload = {
            sub: username,  // Subject (user ID)
            exp: Math.floor(Date.now() / 1000) + (validate * 24 * 60 * 60)  // Expiration time (2 days from now)
        };

        // Generate the JWT token
        const token = jwt.sign(payload, secretKey, { algorithm: 'HS256' });

        res.json({token});
    } catch (err) {
        res.status(500).send(err.message);
    }
}