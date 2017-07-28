
var updateDevice = function(event) {
  var row = $(event.target).parents('tr');
  var id = row.attr('id');
  $(event.target).attr("disabled", true);
  $.ajax({
      url: 'devicelist/update/'+ id,
      type: 'post',
      success: function(res) {
        if(res.success) {
          $(event.target).removeAttr("disabled");
        }
      }
  });
};

$(function() {
    $(':checkbox').change(updateDevice);
});
