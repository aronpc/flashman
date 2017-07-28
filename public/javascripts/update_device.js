
var updateDevice = function(event) {
  var row = $(event.target).parents('tr');
  var id = row.attr('id');
  $.ajax({
      url: 'devices/'+ id,
      type: 'update',
      success: function() {
          row.hide('fast', function() {
              $(event.target).remove();
          });
      }
  });
};

$(function() {
    $(':checkbox').change(updateDevice);
});
