
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
  let singleReleases = $(event.target).data('singlereleases');
  let selectedRelease = $('#all-releases').text();
  let selectedModels = [];

  // Get models of selected release
  for (let i=0; i < singleReleases.length; i++) {
    if (singleReleases[i].id == selectedRelease) {
      selectedModels = singleReleases[i].model;
      break;
    }
  }

  rows.each(function(idx) {
    if ($(this).prop('id') !== undefined && $(this).prop('id').length > 0 &&
        selectedModels.includes($(this).data('deviceModel'))) {
      let id = $(this).prop('id');
      let rel = selectedRelease;
      idsObj[id] = rel;
    }
  });
  $(event.target).prop('disabled', true);
  $.post('/devicelist/updateall',
         {content: JSON.stringify({ids: idsObj, do_update: isChecked})})
  .done(function(res) {
    if (res.success) {
      res.devices.forEach(function(deviceId) {
        $('#' + $.escapeSelector(deviceId))
          .find('.checkbox').prop('checked', isChecked);
        $('#' + $.escapeSelector(deviceId))
          .find('.btn-group span.selected').text(selectedRelease);
        $('#' + $.escapeSelector(deviceId))
          .find('.btn-group .dropdown-item')
          .removeClass('active teal lighten-2');
        $('#' + $.escapeSelector(deviceId))
          .find('.btn-group .dropdown-item:contains(' + selectedRelease + ')')
          .addClass('active teal lighten-2');
      });
      $(event.target).prop('disabled', false);
    }
  });
};

let refreshRelease = function(event) {
  $(event.target).parents('.btn-group').find('.dropdown-item')
    .removeClass('active teal lighten-2');

  let selected = $(event.target).parents('.btn-group').find('span.selected');
  selected.text($(this).text());
  let dropItem = $(event.target).parents('.btn-group')
    .find('.dropdown-item:contains(' + $(this).text() + ')');
  dropItem.addClass('active teal lighten-2');
};

$(function() {
  $('.dropdown-menu a').on('click', refreshRelease);
  $('.checkbox').not('#all-devices').change(updateDevice);
  $('#all-devices').change(updateAllDevices);
});
