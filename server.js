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
// mongoose.connect("mongodb://localhost/populatedb2", {
//   useMongoClient: true
// });

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

// Main route (simple Hello World Message)
app.get("/", function(req, res) {
    res.send("Hello world");
});

// Retrieve data from the db
app.get("/all", function(req, res) {
    // Find all results from the scrapedData collection in the db
    db.scrapedData.find({}, function(error, found) {
        // Throw any errors to the console
        if (error) {
            console.log(error);
        }
        // If there are no errors, send the data to the browser as json
        else {
            res.json(found);
        }
    });
});

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



// Scrape data from one site and place it into the mongodb db
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

        console.log("============", data);

        // Use a loop to insert the data into the scrapedData database
        // if (data.length > 1) {
        //     for (var i = 0; i < data.length; i++) {
        //         console.log("looping==================", data[i])
        //         db.scrapedData.insert({
        //           title: data[i].title,
        //           link: data[i].link,
        //           summary: data[i].summary
        //         },
        //         function(err, inserted) {
        //             if (err) {
        //                 // Log the error if one is encountered during the query
        //                 console.log(err);
        //             } else {
        //                 // Otherwise, log the inserted data
        //                 console.log(inserted);
        //             }
        //         });
        //     }
        // }
    });

    // Send a "Scrape Complete" message to the browser
    res.send("Scrape Complete");
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