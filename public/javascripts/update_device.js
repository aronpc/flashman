
let updateDevice = function(event) {
  let row = $(event.target).parents('tr');
  let id = row.prop('id');
  let release = row.find('span.selected').text();
  let isChecked = $(event.target).parents('tr').find('.checkbox').is(':checked');
  $(event.target).prop('disabled', true);
  $.ajax({
    url: '/devicelist/update/' + id + '/' + release,
    type: 'post',
    traditional: true,
    data: {do_update: isChecked},
    success: function(res) {
      if (res.success) {
        $(event.target).prop('disabled', false);
      }
    },
  });
};

let updateAllDevices = function(event) {
  let row = $(event.target).parents('tr');
  let isChecked = $(event.target).is(':checked');
  let rows = row.siblings();
  let idsObj = {};
  rows.each(function(idx) {
    if ($(this).prop('id') !== undefined && $(this).prop('id').length > 0) {
      let id = $(this).prop('id');
      let rel = $(this).find('span.selected').text();
      idsObj[id] = rel;
    }
  });
  $(event.target).prop('disabled', true);
  $.post('/devicelist/updateall',
         {content: JSON.stringify({ids: idsObj, do_update: isChecked})})
    .done(function(res) {
      if (res.success) {
        $('.checkbox').prop('checked', isChecked);
        $(event.target).prop('disabled', false);
      }
    });
};

let refreshRelease = function(event) {
  let selected = $(event.target).parents('.btn-group').find('span.selected');
  selected.text($(this).text());
  // Check if firmware update is enabled. If not, enable it.
  let isChecked = $(event.target).parents('tr').find('.checkbox').is(':checked');
  if (isChecked) {
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
