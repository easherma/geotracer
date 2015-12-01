/*
 * Returns an instance of a textarea form and some controls.
 * The instance can be consumed by leaflet as a control extension
 * or inserted into the markup of a leaflet popup.
 *
 * Input:
 *   param options Object: passes stateful information to constructor
 *      property isPopup boolean: indicates if notes are location-specific
 */
var noteForm = function (options){
  //Private variables and methods go here
  var isPopup = options.isPopup; 
  var myMarkup = function(){
    // Define properties differently for location-specific notes
    var promptTxt = isPopup ? "this location." : "your submission.";
    var markup = $('<div/>')
      .addClass('note-form')
      .addClass('hide col-xs-6 col-md-8 form-group')
      .on('click',function(e){
        // Allows markers to stay open and user to interact with both layers.
        L.DomEvent.stopPropagation(e);
       })
    .append($('<label/>').text("This is a space to share a few words about "+promptTxt))
      .append($('<textarea/>').addClass("form-control"))
      .append($('<div/>').addClass('col-xs')
        .append(
          $('<i/>')
            .addClass('fa fa-3x fa-check-circle')
            .on('click',function(e){
              var container = e.target.parentElement.parentElement;
              container.classList.add('hide');
              $(container).prev('hr:not(.hide)').addClass('hide');
            })
         )
        .append(
          $('<i/>')
            .addClass('fa fa-3x fa-times-circle')
            .on('click',function(e){
              var container = e.target.parentElement.parentElement;
              container.classList.add('hide');
              $(container).find('textarea').val("");
              $(container).prev('hr:not(.hide)').addClass('hide');
             })
         )
       )
    return markup;
  }();


  //Add public methods to 'that'
  var that = {};
  that.show = function(){
    myMarkup.removeClass('hide');
    myMarkup.find('textarea').focus();
  };
  that.hide = function(){
    myMarkup.addClass('hide');
  };
  that.clear = function(){
    myMarkup.find('textarea').val("");
  };
  that.getNote = function(){
    return myMarkup.find('textarea').val();
  };
  if(isPopup){
    //Location-specific features
    that.markup = myMarkup.get(0);
  } else {
    //Whole path-specific features
    that.options = {position: 'bottomleft'};
    that.onAdd = function(){
      return myMarkup.get(0);  
    };
  }
  return that;
};
