
var updateDevice = function(event) {
  var row = $(event.target).parents('tr');
  var id = row.prop('id');
  $(event.target).prop('disabled', true);
  $.ajax({
      url: 'devicelist/update/' + id,
      type: 'post',
      success: function(res) {
        if(res.success) {
          $(event.target).prop('disabled', false);
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
    if($(this).has('id')) {
      ids_list.push($(this).prop('id'));
    }
  });
  $(event.target).prop('disabled', true);
  $.ajax({
      url: 'devicelist/updateall',
      type: 'post',
      data: {'ids': ids_list, 'do_update': is_checked},
      traditional: true,
      success: function(res) {
        if(res.success) {
          $('.checkbox').prop('checked', is_checked);
          $(event.target).prop('disabled', false);
        }
      }
  });
};

$(function() {
    $('.checkbox').not('#all-devices').change(updateDevice);
    $('#all-devices').change(updateAllDevices);
});
