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
app.use(bodyParser.json());

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

// // Configure the database.
// var databaseUrl = "newsScraper";
// var collections = ["scrapedData"];

// // Hook mongojs configuration to the db variable
// var db = mongojs(databaseUrl, collections);
// db.on("error", function(error) {
//     console.log("Database Error:", error);
// });

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

// // Retrieve data from the db
// app.get("/all", function(req, res) {
//     // Find all results from the scrapedData collection in the db
//     db.scrapedData.find({}, function(error, found) {
//         // Throw any errors to the console
//         if (error) {
//             console.log(error);
//         }
//         // If there are no errors, send the data to the browser as json
//         else {
//             res.json(found);
//         }
//     });
// });

// // Scrape data from one site and place it into the mongodb db
// app.get("/scrape", function(req, res) {
//   // Make a request for the news section of ycombinator
//   request("https://news.ycombinator.com/", function(error, response, html) {
//     // Load the html body from request into cheerio
//     var $ = cheerio.load(html);
//     // For each element with a "title" class
//     $(".title").each(function(i, element) {
//       // Save the text and href of each link enclosed in the current element
//       var title = $(element).children("a").text();
//       var link = $(element).children("a").attr("href");

//       // If this found element had both a title and a link
//       if (title && link) {
//         // Insert the data in the scrapedData db
//         db.scrapedData.insert({
//           title: title,
//           link: link
//         },
//         function(err, inserted) {
//           if (err) {
//             // Log the error if one is encountered during the query
//             console.log(err);
//           }
//           else {
//             // Otherwise, log the inserted data
//             console.log(inserted);
//           }
//         });
//       }
//     });
//   });



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
                console.log("looping==================", data[i])
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
        }
    });

    // Send a "Scrape Complete" message to the browser
    res.send("Scrape Complete");
});

// Route for finding articles that are saved
app.get("/saved", function(req, res) {
  // Find all docs where isSaved is true in the scrapedData collection
  db.Article.find({ isSaved: true }, function(error, found) {
    // Show any errors
    if (error) {
      console.log(error);
    }
    else {
      // Otherwise, send the found articles to the browser as a json
      res.json(found);
    }
  });
});

// Route for saving an article
app.get("/savearticle/:id", function(req, res) {
  // Update a doc in the scrapedData collection with an ObjectId matching the id parameter in the database
  db.Article.update(
    {
      _id: mongojs.ObjectId(req.params.id)
    },
    {
      // Set "isSaved" to true for the specified article
      $set: {
        isSaved: true
      }
    },
    // Run the following function
    function(error, edited) {
      // show any errors
      if (error) {
        console.log(error);
        res.send(error);
      }
      else {
        // Otherwise, send the result of the update to the browser
        console.log(edited);
        res.send(edited);
      }
    }
  );
});

// Route for saving a new note to the database and associating it with an article
app.post("/newnote", function (req, res) {
  // Create a new note in the database
  db.Note.create(req.body)
    .then(function (dbNote) {
      // If a Note is created successfully, find the article and push the new Note's _id to the article notes array
      // { new: true } indicates the query returns the updated article, and not the default of the original article
      return db.Article.findOneAndUpdate({}, { $push: { notes: dbNote._id } }, { new: true });
    })
    // Because the mongoose query returns a promise, chain another `.then` which receives the result of the query
    .then(function (dbArticle) {
      // If the Article is updated successfully, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurs, send it back to the client
      res.json(err);
    });
    console.log("newnote")
});










// Listen on port 3000
app.listen(PORT, function() {
    console.log("App running on port" + PORT);
});



// 1. Route for content that is displayed when you open the index.html page or click Home in the navigation bar. GET
// 2. Route for content that is displayed when you click Saved Articles in the navigation bar. GET
// 3. Route for content that is displayed when you click Scrape New Acticles in the navigation bar. POST
// 4. Route for the content that is displayed when you click the Save Article button for a scraped article. POST
// 5. Route for the content that is displayed when you click the Delete From Saved button for an article. Is a route needed here?
// 6. Route for the content that is displayed when you click the delete icon for a note. Is a route needed here?
// 7. Route for the content that is displayed when you click the Article Notes button for an article. (The modal is displayed.) Is a route need here?
// 8. Route for the content that is displayed when you click the Save Note button for a note. (The modal is no longer displayed.) Is a route needed here?