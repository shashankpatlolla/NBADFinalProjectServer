// server.js
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors'); // Import the cors middleware
const jwt = require('jsonwebtoken'); // Import JWT library
const compression = require('compression');


const app = express();
const port = 5000;
app.use(compression());

app.use(cors());
app.use(bodyParser.json());

//const url ='mongodb+srv://spatloll:Nbadproject11@nbadfinalproject.mc4y2zh.mongodb.net/'
//mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });

// Define a User schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});
// Create a User model
const User = mongoose.model('User', userSchema);

//Budget Schema
const budgetSchema = new mongoose.Schema({
  //userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',required: true}, // Reference to the User model
  user: String,
  category: String,
  budget: Number,
});

//Budget Model
const Budget = mongoose.model('Budget', budgetSchema);

//Expense Schema
const expenseSchema = new mongoose.Schema({
  user: String,
  month: String,
  category: String,
  expense: Number,
});

//Budget Model
const Expense = mongoose.model('Expense', expenseSchema);



app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });

    if (user) {

      const expirationTime = 60;
      const token = jwt.sign({ userId: user._id }, 'your_secret_key', { expiresIn: expirationTime });
      // const token = jwt.sign({ userId: user._id }, 'your_secret_key', { expiresIn: '1h' });
      //const token = jwt.sign({ userId: user._id }, 'your_secret_key');
      //console.log('Generated Token:', token);

      //res.status(200).json({ message: 'Login successful', token: 'yourAuthToken' });
      res.status(200).json({ message: 'Login successful', token, expiresIn: expirationTime });
     // res.status(200).json({token});
    } 
    if(!user) {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  //userid=username;
  //console.log("Shashank is here");
  //console.log(req.body);
  try {
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const newUser = new User({ username, password });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Signup failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/savedBudget', async (req, res) => {
  const username = req.headers['x-username'];
    
  console.log("username from the budget get API is",username);
  try {
    const user = await User.findOne({ username });
    console.log("user from savedBudget get API is ",user);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Find all budget entries associated with the user
    const budgets = await Budget.find({ user: user._id });
    //console.log("Budgets for user are:", budgets);
    res.status(200).json({ message: 'Budget data retrieved successfully', budgets });
  } catch (error) {
    console.error('Budget data retrieval failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/api/savedExpense', async (req, res) => {
  const username = req.headers['x-username'];
  const month = req.headers['x-month'];
    
  console.log("username from the budget get API is",username);
  console.log("month from the budget get API is",month);
  try {
    const user = await User.findOne({ username });
    console.log("user from savedExpense get API is ",user);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let query = { user: user._id };
    console.log("Query is ",query);
    if (month) {
      // If month is provided, add it to the query
      query.month = month;
      console.log("Query month is ",query.month);
    }
    // Find all budget entries associated with the user
    const expenses = await Expense.find(query);
    //console.log("Budgets for user are:", budgets);
    res.status(200).json({ message: 'Budget data retrieved successfully', expenses });
  } catch (error) {
    console.error('Budget data retrieval failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/saveBudget',async (req, res) => {

  const {username,category, budget } = req.body;
  console.log('at savebudget POST API',req.body);
  try {

    const user = await User.findOne({ username });
    const hascategory = await Budget.findOne({category});
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if(hascategory){
      return res.json({ msg:"CategoryExists",error: 'Category is configured' });
    }

    // Save the budget entry with the user reference
    const newBudget = new Budget({
      user: user._id, // This links the budget entry to the user
      category,
      budget,
    });
    // Save the budget entry to the MongoDB collection
    //const newBudget = new Budget({user: userId, category, budget, expense });
    await newBudget.save();

    res.status(201).json({ message: 'Budget entry created successfully' });
  } 
  catch (error) {
    // console.error('Save failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/api/saveExpenseMonth',async (req, res) => {

  const {username,month,category,expense } = req.body;
  //console.log(req.body);
  try {

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Save the budget entry with the user reference
    const newExpense = new Expense({
      user: user._id, // This links the budget entry to the user
      month,
      category,
      expense
    });
    // Save the budget entry to the MongoDB collection
    //const newBudget = new Budget({user: userId, category, budget, expense });
    await newExpense.save();

    res.status(201).json({ message: 'Budget entry created successfully' });
  } catch (error) {
    console.error('Save failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



app.get('/api/home', async (req, res) => {
  const { username } = req.body;

  try {
    // Find the user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find all budget entries associated with the user
    const budgets = await Budget.find({ user: user._id });
    //console.log("Budgets added are: ",budgets);
    res.status(200).json({ message: 'Homepage data retrieved successfully', budgets });
  } catch (error) {
    console.error('Homepage data retrieval failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});





app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


  /* const authenticate = async (req, res, next) => {
    console.log(req.headers);
    const token = req.headers.authorization;
  
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    try {
      const decoded = jwt.verify(token, 'your_secret_key');
      req.userId = decoded.userId;
      console.log('Decoded User ID:', req.userId);
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }; */



  // Endpoint to handle user signup
/* app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Save the user to the MongoDB collection
    const newUser = new User({ username, password });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Signup failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}); */
