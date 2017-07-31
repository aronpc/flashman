
var updateDevice = function(event) {
  var row = $(event.target).parents('tr');
  var id = row.attr('id');
  $(event.target).attr('disabled', true);
  $.ajax({
      url: 'devicelist/update/'+ id,
      type: 'post',
      success: function(res) {
        if(res.success) {
          $(event.target).removeAttr('disabled');
        }
      }
  });
};

var updateAllDevices = function(event) {
  var row = $(event.target).parents('tr');
  var is_checked = $(event.target).is(':checked');
  var rows = row.siblings();
  var ids_list = [];
  rows.each(function(idx) {
    if($(this).attr('id') !== undefined) {
      ids_list.push($(this).attr('id'));
    }
  });
  $(event.target).attr('disabled', true);
  $.ajax({
      url: 'devicelist/updateall',
      type: 'post',
      data: {'ids': ids_list, 'do_update': is_checked},
      traditional: true,
      success: function(res) {
        if(res.success) {
          if(is_checked) {
            $(':checkbox').attr('checked', is_checked);
          } else {
            $(':checkbox').removeAttr('checked');
          }
          $(event.target).removeAttr('disabled');
        }
      }
  });
};

$(function() {
    $(':checkbox').not('#all-devices').change(updateDevice);
    $('#all-devices:checkbox').change(updateAllDevices);
});
