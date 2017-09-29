
var updateDevice = function(event) {
  var row = $(event.target).parents('tr');
  var id = row.prop('id');
  var release = row.find('span.selected').text();
  $(event.target).prop('disabled', true);
  $.ajax({
      url: 'devicelist/update/' + id + '/' + release,
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
  var ids_obj = {};
  rows.each(function(idx) {
    if($(this).prop('id') !== undefined && $(this).prop('id').length > 0) {
      var id = $(this).prop('id');
      var rel = $(this).find('span.selected').text();
      ids_obj[id] = rel;
    }
  });
  $(event.target).prop('disabled', true);
  $.post('devicelist/updateall',
         {content: JSON.stringify({ids: ids_obj, do_update: is_checked})})
    .done(function(res) {
      if(res.success) {
        $('.checkbox').prop('checked', is_checked);
        $(event.target).prop('disabled', false);
      }
    });
};

var refreshRelease = function(event) {
  var selected = $(event.target).parents('.dropdown').find('span.selected');
  selected.text($(this).text() + ' ');
  // Check if firmware update is enabled. If not, enable it.
  var is_checked = $(event.target).parents('tr').find('.checkbox').is(':checked');
  if (is_checked) {
    updateDevice(event);
  } else {
    // Trigger slider animation
    $(event.target).parents('tr').find('.checkbox').trigger('click');
  }
};

$(function() {
  $('.dropdown-menu a').on('click', refreshRelease);
  $('.checkbox').not('#all-devices').change(updateDevice);
  $('#all-devices').change(updateAllDevices);
});
