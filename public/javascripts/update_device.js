
var updateDevice = function(event) {
  let row = $(event.target).parents('tr');
  let id = row.prop('id');
  let release = row.find('span.selected').text();
  $(event.target).prop('disabled', true);
  $.ajax({
      url: 'devicelist/update/' + id + '/' + release,
      type: 'post',
      success: function(res) {
        if (res.success) {
          $(event.target).prop('disabled', false);
        }
      },
  });
};

var updateAllDevices = function(event) {
  let row = $(event.target).parents('tr');
  let is_checked = $(event.target).is(':checked');
  let rows = row.siblings();
  let ids_obj = {};
  rows.each(function(idx) {
    if ($(this).prop('id') !== undefined && $(this).prop('id').length > 0) {
      let id = $(this).prop('id');
      let rel = $(this).find('span.selected').text();
      ids_obj[id] = rel;
    }
  });
  $(event.target).prop('disabled', true);
  $.post('devicelist/updateall',
         {content: JSON.stringify({ids: ids_obj, do_update: is_checked})})
    .done(function(res) {
      if (res.success) {
        $('.checkbox').prop('checked', is_checked);
        $(event.target).prop('disabled', false);
      }
    });
};

var refreshRelease = function(event) {
  let selected = $(event.target).parents('.dropdown').find('span.selected');
  selected.text($(this).text() + ' ');
  // Check if firmware update is enabled. If not, enable it.
  let is_checked = $(event.target).parents('tr').find('.checkbox').is(':checked');
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
