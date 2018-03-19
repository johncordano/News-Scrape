// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
// var mongojs = require("mongojs");
var logger = require("morgan");
var mongoose = require("mongoose");
// Require request and cheerio to enable scraping.
var request = require("request");
var cheerio = require("cheerio");

var PORT = process.env.PORT || 3000;

// Require all models
var db = require("./models");

// Initialize Express.
var app = express();

// Use morgan logger for logging requests
app.use(logger("dev"));

// Serve static content for the app from the public directory in the application directory.
app.use(express.static("public"));

// Set up the express app to handle data parsing.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({type: "application/json"}));

// Set Handlebars.
var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// By default mongoose uses callbacks for async queries. Set mongoose to use promises (.then syntax) instead
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect("mongodb://localhost/populatedb3");


// Import the routes and give the server access to them.
// var routes = require("./controllers/scraper_controller.js");
// app.use(routes);


// Route for the home page
app.get("/", function(req, res) {
    // Retrieve all data in the articles collection
    db.Article.find({}, function(error, data) {
        // If an error occurs, log the error
        if (error) {
            console.log(error);
        }
        // If no errors occur, send the data to the browser as a json object
        else {
            var hbsArticleObject = {
                articles: data
            };
            res.render("index", hbsArticleObject);
        }
    });
});

// Route for scraping data from a site and placing it into the database
app.get("/scrape", function(req, res) {
    // Make a request for sf.streetsblog
    request("https://sf.streetsblog.org/", function(error, response, html) {
        // Load the html body from the request into cheerio
        var $ = cheerio.load(html);
        // Create an empty array for the scraped data
        var data = []
        // For each element with a entry-title class
        $(".entry-title").each(function(i, element) {
            // Save the text and href of each link enclosed in the current element
            var title = $(element).children("a").text();
            var link = $(element).children("a").attr("href");
            // Push the title and link to the data array
            data.push({ title: title, link: link })
        });

        // For each element with a entry-excerpt class
        $(".entry-excerpt").each(function(i, element) {
            // Save the text enclosed in the current element
            var summary = $(element).text();
            // Add the summary to the data array
            data[i].summary = summary
        });


        // Use a loop to insert the data into the scrapedData database
        if (data.length > 1) {
            for (var i = 0; i < data.length; i++) {
                db.Article.create({
                        title: data[i].title,
                        link: data[i].link,
                        summary: data[i].summary
                    },
                    function(err, inserted) {
                        if (err) {
                            // Log the error if one is encountered during the query
                            console.log(err);
                        } else {
                            // Otherwise, log the inserted data
                            console.log(inserted);
                        }
                    });
            }
            res.json(data);
        } else {
            res.json([]);
        }

    });
});

// Route for finding articles that are saved
app.get("/saved", function(req, res) {
    // Retrieve data for saved articles in the articles collection
    db.Article.find({isSaved: true}, function(error, data) {
        // If an error occurs, log the error
        if (error) {
            console.log(error);
        }
        // If no errors occur, send the data to the browser as a json object
        else {
            var hbsArticleObject = {
                articles: data
            };
            res.render("saved", hbsArticleObject);
        }
    });
});

// // Route for saving an article
// app.get("/savearticle/:id", function(req, res) {
//   // Update an article in the articles collection with an ObjectId matching the id parameter in the database
//   db.Article.update(
//     {
//       _id: mongojs.ObjectId(req.params.id)
//     },
//     {
//       // Set "isSaved" to true for the specified article
//       $set: {
//         isSaved: true
//       }
//     },
//     // Run the following function
//     function(error, edited) {
//       // Show any errors
//       if (error) {
//         console.log(error);
//         res.send(error);
//       }
//       else {
//         // Otherwise, send the result of the update to the browser
//         console.log(edited);
//         res.send(edited);
//       }
//     }
//   );
// });

// Route for saving an article
app.get("/savearticle/:_id", function(req, res) {
    // Update an article in the articles collection with an ObjectId matching the id parameter in the database
    db.Article.update({isSaved: true}, function(error, data) {
        // If an error occurs, log the error
        if (error) {
            console.log(error);
        }
        // If no errors occur, send the data to the browser as a json object
        else {
            var hbsArticleObject = {
                articles: data
            };
            res.render("saved", hbsArticleObject);
        }
    });
});





// Route for saving a new note to the database and associating it with an article
app.post("/newnote", function(req, res) {
    // Create a new note in the database
    db.Note.create(req.body)
        .then(function(dbNote) {
            // If a Note is created successfully, find the article and push the new Note's _id to the article notes array
            // {new: true} indicates the query returns the updated article, and not the default of the original article
            return db.Article.findOneAndUpdate({}, { $push: { notes: dbNote._id } }, {new: true});
        })
        // Because the mongoose query returns a promise, chain another `.then` which receives the result of the query
        .then(function(dbArticle) {
            // If the Article is updated successfully, send it back to the client
            res.json(dbArticle);
        })
        .catch(function(err) {
            // If an error occurs, send it back to the client
            res.json(err);
        });
    console.log("newnote")
});

// Route for retrieving the notes for an article
app.get("/articles/:id", function(req,res) {
    db.Article.findOne({"_id":req.params.id})
    .populate("notes");
    .exec (function (err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log(data);
            res.json;
        }
    });        
});


// Route for deleting an article from the database
app.get ("/deletearticle/:id", function(req, res) {
    db.Article.findOneandRemove({_id:req.params.id}, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log("Deleted article");
        }
        res.redirect("/saved");
    });
});

// Route for deleting a note from the database
app.get ("/deletenote/:id", function(req, res) {
    db.Note.findOneandRemove({_id:req.params.id}, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log("Deleted note");
        }
        res.send(data);
    });
});

// Listen on port 3000
app.listen(PORT, function() {
    console.log("App running on port" + PORT);
});