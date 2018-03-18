// Wait until the DOM is fully loaded to attach the handlers.
$(function() {
  // Run a function when the user clicks the Save Article button.
  $(".change-save").on("click", function(event) {
    var id = $(this).data("_id");
    var newSave = $(this).data("newsave");
    var newSaveState = {
       isSaved: newSave
     };
    // Send the GET request.
    $.ajax("/savearticle/" + id, {
      type: "get",
      data: newSaveState
    }).then(
      function() {
        // Reload the page to get the updated list.
        location.reload();
      }
    );
  });
});















//   // Run a function when the user clicks the Devour It! button.
//   $(".change-devour").on("click", function(event) {
//     var id = $(this).data("id");
//     var newDevour = $(this).data("newdevour");
//     var newDevourState = {
//       devoured: newDevour
//     };
//     // Send the PUT request.
//     $.ajax("/api/burgers/" + id, {
//       type: "PUT",
//       data: newDevourState
//     }).then(
//       function() {
//         console.log("changed devoured to", newDevour);
//         // Reload the page to get the updated list.
//         location.reload();
//       }
//     );
//   });
//   // Run a function when the user clicks the Submit button.
//   $(".create-form").on("submit", function(event) {
//     // PreventDefault on a submit event.
//     event.preventDefault();
//     var newBurger = {
//       burger_name: $("#burg").val().trim(),
//       devoured: 0
//     };
//     // Send the POST request.
//     $.ajax("/api/burgers", {
//       type: "POST",
//       data: newBurger
//     }).then(
//       function() {
//         console.log("created new burger");
//         // Reload the page to get the updated list.
//         location.reload();
//       }
//     );
// });