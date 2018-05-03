let loadDeviceInfoOnForm = function(row) {
  let index = row.data('index');
  $("#editDeviceForm-" + index.toString()).find("p").remove();
  $("#edit_pppoe_user-" + index.toString()).removeClass("red lighten-4")
                                           .val(row.data('user')).change();
  $("#edit_pppoe_pass-" + index.toString()).removeClass("red lighten-4")
                                           .val(row.data('pass')).change();
  $("#edit_wifi_ssid-" + index.toString()).removeClass("red lighten-4")
                                          .val(row.data('ssid')).change();
  $("#edit_wifi_pass-" + index.toString()).removeClass("red lighten-4")
                                          .val(row.data('wifi-pass')).change();
  $("#edit_wifi_channel-" + index.toString()).removeClass("red lighten-4")
                                             .val(row.data('channel')).change();
}

$(document).ready(function() {
  $('.fa-chevron-right').parents('td').click(function(event) {
    let row = $(event.target).parents('tr');
    let index = row.data('index');
    let hideId = "#hide-" + index.toString();
    let formId = "#form-" + index.toString();
    if ($(this).children().hasClass('fa-chevron-right')) {
      $(hideId).show();
      $(this).find('.fa-chevron-right')
        .removeClass('fa-chevron-right')
        .addClass('fa-chevron-down');
    } else if ($(this).children().hasClass('fa-chevron-down')) {
      $(hideId).hide();
      $(formId).hide();
      $(this).find('.fa-chevron-down')
        .removeClass('fa-chevron-down')
        .addClass('fa-chevron-right');
    }
  });

  $('#card-header').click(function() {
    let plus = $(this).find('.fa-plus');
    let cross = $(this).find('.fa-times');
    plus.removeClass('fa-plus').addClass('fa-times');
    cross.removeClass('fa-times').addClass('fa-plus');
  });

  $('.btn-trash').click(function(event) {
    let row = $(event.target).parents('tr');
    let id = row.data('deviceid');
    $.ajax({
      url: '/devicelist/delete/' + id,
      type: 'post',
      success: function(res) {
        setTimeout(function() {
          window.location.reload();
        }, 100);
      },
    });
  });

  $('.btn-edit').click(function(event) {
    let row = $(event.target).parents('tr');
    let index = row.data('index');
    let hideId = "#hide-" + index.toString();
    let formId = "#form-" + index.toString();
    loadDeviceInfoOnForm(row);
    $(hideId).hide();
    $(formId).show();
  });
});
