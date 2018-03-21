// Wait until the DOM is fully loaded to attach the handlers
$(function() {
// Run a function when the Scrape New Articles button is clicked
$(".scrape-btn").on("click", function(event) {
    // PreventDefault on a click event.
    event.preventDefault();
    // Send the GET request.
    $.ajax("/scrape", {
      type: "GET"
    }).then(
      function(data) {
        // Reload the page to get the updated list.
        location.reload();
      }
    );
});

// Run a function when the Save Article button or the Unsave Article button is clicked
$(".change-save, .delete-saved").on("click", function(event) {
    // PreventDefault on a click event.
    event.preventDefault();
    var id = $(this).attr("data-articleID");
    var status = $(this).attr("data-status");
    var noteStatus = {
      isSaved: null 
    }
    if (status === "true"){
      noteStatus.isSaved = false
    } else {
      noteStatus.isSaved = true
    }
    $.post("/savearticle/"+id, noteStatus, function(results){
      // Reload the page
      location.reload();
    })
});

// Run a function when the Delete from Saved button is clicked
$(".delete-article").on("click", function(event) {
    // PreventDefault on a click event.
    event.preventDefault();
    var id = $(this).data("_id");
    // Send the GET request.
    $.ajax("/deletearticle/" + id, {
      type: "GET"
    }).then(
      function() {
        // Reload the page to get the updated list.
        location.reload();
      }
    );
});

// Run a function when the Article Note button is clicked
$(".add-note").on("click", function() {
  var title = $(this).prev(".title").text()
  var articleId = $(this).attr("data-articleId");
  // Update the modal article id
  $("#noteModal").attr("data-articleID", articleId)
  // Empty precaution
  $(".modal-title, .existing-note").empty();
  $.get("/articles/"+articleId+"/notes", function(data){
    // Data is an array
    $(".modal-title").empty().text(title)
    if(data.length > 0){
     createModalHTML(data)
     $("#noteModal").modal("show");
    } else {
     $(".existing-note").empty().append(`
            <div class="panel panel-default" align="center" id="${articleId}-na">
              <div class="panel-body">No notes for this article.</div>
              </div>
      `);
      $("#noteModal").modal("show");
    }
  })
});

// Run a function to create the modal for a note
function createModalHTML(data){ 
    data.forEach(function(note){
      $(".existing-note").append(`
      <div class="panel panel-default" id="${note._id}">
        <div class="panel-body">
          <div class="noteContent">
            <p>${note.body}</p>
            <button class="btn btn-primary edit-note" data-noteId="${note._id}"">Edit</button>
            <button class="btn btn-primary delete-note" data-noteId="${note._id}">Delete</button>
          </div>
         <div class="update-form"></div>
        </div>
      </div>
    `)
    });  
}

// Run a function when the Submit button is clicked for a note
$("#submit-note").on("click", function(event){
  event.preventDefault();
  var articleId = $("#noteModal").attr("data-articleID")
  var text =  $("#note-body").val().trim();
  var newNote = {
    body: text
  }
  if(newNote.body.length > 0){
    $.post("/newnote/"+articleId, newNote, function(response){
      // Response is an object
      $("#"+articleId+"-na").remove();
      var responseArr = [response]
      createModalHTML(responseArr)
      $("#note-body").val("")
    });
  }
});

// Run a function when the Edit button is clicked for a note
$(document).on("click", ".edit-note", function(){
  var noteId = $(this).attr("data-noteId")
  var text = $(this).siblings("p").text()
  $("#"+noteId+ " .noteContent").empty();
  $("#"+noteId+ " .update-form").append(`
    <form align="center">
      <input type="text" class="form-control updateNote-txt" value="${text}">
      <br>
      <button class="btn btn-primary updateNote" data-noteId="${noteId}">Update</button>
    </form>
  `)
});

// Run a function when the Update button is clicked for a note
$(document).on("click", ".updateNote", function(event){
  event.preventDefault()
  var text = $(this).siblings(".updateNote-txt").val();
  var noteId = $(this).attr("data-noteId");
  var note = {
    body: text
  }
  if(note.body.length>0){
    $.post("/note/"+noteId+"/update", note, function(updatedNote){
      var noteObj = {
        _id: updatedNote._id,
        body: text
      }
      $("#"+noteObj._id+ " .noteContent").empty()
      $("#"+noteObj._id+ " .noteContent").append(`
        <p>${noteObj.body}</p>
        <button class="btn btn-primary edit-note" data-noteId="${noteObj._id}"">edit</button>
        <button class="btn btn-primary delete-note" data-noteId="${noteObj._id}">delete</button>
    `)
     $("#"+noteObj._id).find(".update-form").empty();  
    });
  }
});

// Run a function when the Delete button is clicked for a note
$(document).on("click", ".delete-note", function(){
  var noteID = $(this).attr("data-noteId");
  $.get("/deletenote/"+noteID, function(data){
    $("#"+noteID).remove();
  });
});

});

