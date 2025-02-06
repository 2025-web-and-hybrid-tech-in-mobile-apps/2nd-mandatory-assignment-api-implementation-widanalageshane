const { use } = require("chai");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // for parsing application/json

// ------ WRITE YOUR SOLUTION HERE BELOW ------//

// Your solution should be written here


// ------------------ Register Endpoint ----------------------------------------------

//Write the signup endpoint
app.post("/signup", (req, res) => {

  const userHandle = req.body.userHandle;
  const password = req.body.password;

  if (!userHandle || !password) {
    res.status(400).send("Invalid request body");
  } 

  //should reject if userHandle is shorter than 6 chars
  //should reject if password is shorter than 6 chars
  if (userHandle.length < 6 || password.length < 6) {
    res.status(400).send("Invalid request body");
  } 


  

  
  res.status(201).send("User registered successfully");  
});



// ------------------ Login Endpoint ----------------------------------------------


const jwt = require("jsonwebtoken");
const JWTSECRET = "123";

// Dummy users for testing
const users = [
  { userHandle: "DukeNukem", password: "123456" },
  { userHandle: "DukeNukem1", password: "correctpassword" }
];

//The login endpoint
app.post("/login", (req, res) => {

  const { userHandle, password, ...extraFields } = req.body;

  // Check if extra fields exist (only allow userHandle and password)
  if (Object.keys(extraFields).length > 0) {
    return res.status(400).send("Invalid request body: contains extra fields");
  }



  if (!userHandle || !password) {
    return res.status(400).send("Invalid request body: Missing username or password");
  } 

  // Ensure userHandle and password are strings
  if (typeof userHandle !== "string" || typeof password !== "string") {
    return res.status(400).send("Invalid request body: Username and password must be strings");
  }


  //should reject if userHandle is shorter than 6 chars
  //should reject if password is shorter than 6 chars
  if (userHandle.length < 6 || password.length < 6) {
    return res.status(400).send("Invalid request body: userHandle and password must be at least 6 characters long");
  } 
  

  // Verify if the provided username and password match any stored user
  const user = users.find(element => element.userHandle === userHandle && element.password === password);

  if (!user) {
    return res.status(401).send("Unauthorized: Incorrect username or password");
  }
  


  try {
    const token = jwt.sign(
      //payload
      { userHandle: userHandle }, 
      //secret
      JWTSECRET
    );
    res.status(200).send({ jsonWebToken: token });
  } 
  catch (error) {
    res.status(500).send("Internal server error");
  }  
  
});




// ------------------ Post a high score for a specific level (Protected with JWT authentication) ----------------------------------------------

const highScores = []; // In-memory storage for high scores

// Middleware to authenticate JWT
function authenticateJWT(req, res, next) {

  // Check for Authorization header
  const authHeader = req.headers.authorization;

  // If Authorization header is missing or token is missing
  if (!authHeader || !authHeader.split(" ")[1]) {
    return res.status(401).send("Unauthorized: JWT token is missing");
  }

  // Extract token from Authorization header
  const token = authHeader.split(" ")[1];

  // Verify token
  try 
  {
    const decoded = jwt.verify(token, JWTSECRET);

    // Attach userHandle to request for later use
    req.userHandle = decoded.userHandle;
    next();
  } 
  
  catch (error) 
  {
    return res.status(401).send("Unauthorized: Invalid token");
  }
}

// POST /high-scores - Submit a high score
app.post("/high-scores", authenticateJWT, (req, res) => {
  const { level, userHandle, score, timestamp, ...extraFields } = req.body;

  // Check for extra fields
  if (Object.keys(extraFields).length > 0) {
    return res.status(400).send("Invalid request body: contains extra fields");
  }

  // Validate required fields
  if (!level || !userHandle || !score || !timestamp) {
    return res.status(400).send("Invalid request body: Missing required fields");
  }

  // Validate data types
  if (
    typeof level !== "string" ||
    typeof userHandle !== "string" ||
    typeof score !== "number" ||
    typeof timestamp !== "string"
  ) {
    return res.status(400).send("Invalid request body: Incorrect data types");
  }

  // Validate timestamp format (ISO 8601 format)
  if (isNaN(Date.parse(timestamp))) {
    return res.status(400).send("Invalid request body: Incorrect timestamp format");
  }

  // Ensure userHandle in request matches the JWT userHandle (Prevents posting scores for others)
  if (userHandle !== req.userHandle) {
    return res.status(401).send("Unauthorized: You can only submit scores for yourself");
  }

  // Store the high score
  highScores.push({ level, userHandle, score, timestamp });

  return res.status(201).send("High score submitted successfully");
});



// ------------------ Get high scores ----------------------------------------------
// GET /high-scores - Fetch high scores for a level (with pagination)
app.get("/high-scores", (req, res) => {

  // Extract query parameters
  const level = req.query.level;
  const page = req.query.page;
  

  // Validate required `level` parameter
  if (!level) {
    return res.status(400).send("Invalid request: 'level' is required");
  }

  // Validate `page` parameter
  let pageNumber;
  if (page) {
    pageNumber = parseInt(page); // Convert the page number from text to a number
  } else {
    pageNumber = 1; // If no page is provided, default to page 1
  }

  // Ensure page number is a positive integer
  if (page && (isNaN(pageNumber) || pageNumber < 1)) {
    return res.status(400).send("Invalid request: 'page' must be a positive integer");
  }

  // Filter high scores by level
  const scoresForLevel = highScores.filter(element => element.level === level);

  // Sort scores in descending order (highest score first)
  scoresForLevel.sort((firstScore, secondScore) => {
    return secondScore.score - firstScore.score; // Sort in descending order (highest score first)
  });
  

  // Implement pagination (20 scores per page)
  const pageSize = 20;
  const startIndex = (pageNumber - 1) * pageSize;
  const paginatedScores = scoresForLevel.slice(startIndex, startIndex + pageSize);

  return res.status(200).json(paginatedScores);
});


//------ WRITE YOUR SOLUTION ABOVE THIS LINE ------//

let serverInstance = null;
module.exports = {
  start: function () {
    serverInstance = app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  },
  close: function () {
    serverInstance.close();
  },
};
