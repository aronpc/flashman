let loadDeviceInfoOnForm = function(row) {
  let index = row.data('index');
  $('#editDeviceForm-' + index.toString()).find('p').remove();
  $('#edit_pppoe_user-' + index.toString()).removeClass('red lighten-4')
                                           .val(row.data('user')).change();
  $('#edit_pppoe_pass-' + index.toString()).removeClass('red lighten-4')
                                           .val(row.data('pass')).change();
  $('#edit_wifi_ssid-' + index.toString()).removeClass('red lighten-4')
                                          .val(row.data('ssid')).change();
  $('#edit_wifi_pass-' + index.toString()).removeClass('red lighten-4')
                                          .val(row.data('wifi-pass')).change();
  $('#edit_wifi_channel-' + index.toString()).removeClass('red lighten-4')
                                             .val(row.data('channel')).change();
  $('#edit_external_reference-' + index.toString())
    .val(row.data('external-ref')).change();

  let pppoe_user = row.data('user');
  let pppoe_pass = row.data('pass');
  if (pppoe_user === '' && pppoe_pass === '') {
    $('#edit_connect_type-' + index.toString()).val('DHCP');
    $('#edit_pppoe_user-' + index.toString()).parent().hide();
    $('#edit_pppoe_pass-' + index.toString()).parent().hide();
  } else {
    $('#edit_connect_type-' + index.toString()).val('PPPoE');
    $('#edit_pppoe_user-' + index.toString()).parent().show();
    $('#edit_pppoe_pass-' + index.toString()).parent().show();
  }

  $('#edit_connect_type-' + index.toString()).change(function() {
    if ($('#edit_connect_type-' + index.toString()).val() === 'PPPoE') {
      $('#edit_pppoe_user-' + index.toString()).parent().show();
      $('#edit_pppoe_pass-' + index.toString()).parent().show();
    } else {
      $('#edit_pppoe_user-' + index.toString()).parent().hide();
      $('#edit_pppoe_pass-' + index.toString()).parent().hide();
    }
  });
};

let refreshExtRefType = function(event) {
  let selectedSpan = $(event.target).closest('.input-group-btn').find('span.selected');
  let selectedItem = $(event.target).closest('#ext_ref_type').find('.active');
  let inputField = $(event.target).closest('.input-group').find('input');
  selectedSpan.text($(this).text());
  selectedItem.removeClass('active orange darken-2');
  $(event.target).addClass('active orange darken-2');

  if ($(this).text() == 'CPF') {
    inputField.mask('000.000.000-009').keyup();
  } else if ($(this).text() == 'CNPJ') {
    inputField.mask('00.000.000/0000-00').keyup();
  } else {
    inputField.unmask();
  }
};

$(document).ready(function() {
  $('.fa-chevron-right').parents('td').click(function(event) {
    let row = $(event.target).parents('tr');
    let index = row.data('index');
    let hideId = '#hide-' + index.toString();
    let formId = '#form-' + index.toString();
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
    let hideId = '#hide-' + index.toString();
    let formId = '#form-' + index.toString();
    loadDeviceInfoOnForm(row);
    $(hideId).hide();
    $(formId).show();
  });

  $('.btn-cancel').click(function(event) {
    let row = $(event.target).parents('tr');
    let index = row.data('index');
    let hideId = '#hide-' + index.toString();
    let formId = '#form-' + index.toString();
    $(formId).hide();
    $(hideId).show();
  });

  $('#ext_ref_type a').on('click', refreshExtRefType);
  $('.ext-ref-input').mask('000.000.000-009').keyup();
});
