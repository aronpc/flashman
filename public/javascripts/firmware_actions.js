
$(document).on('change', ':file', function() {
  let input = $(this);
  let numFiles = input.get(0).files ? input.get(0).files.length : 1;
  let label = input.val().replace(/\\/g, '/').replace(/.*\//, '');

  input.trigger('fileselect', [numFiles, label]);
});

$(document).ready(function() {
  let selectedItens = [];

  $('#firmware-table').DataTable({
    'paging': false,
    'info': false,
    'language': {
      'zeroRecords': 'Nenhum registro encontrado',
      'infoEmpty': 'Nenhum firmware disponível',
      'search': 'Buscar',
    },
    'order': [[1, 'asc'], [2, 'asc'], [3, 'asc'], [4, 'asc']],
  });

  $(':file').on('fileselect', function(event, numFiles, label) {
    let input = $(this).parents('.input-group').find(':text');

    if (input.length) {
      input.val(label);
    }
  });

  $('#btn-firmware-trash').click(function(event) {
    $.ajax({
      type: 'POST',
      url: '/firmware/del',
      traditional: true,
      data: {ids: selectedItens},
      success: function(res) {
        if (res.type == 'success') {
          displayAlertMsg(res);
          setTimeout(function() {
            window.location.reload();
          }, 1000);
        } else {
          displayAlertMsg(res);
        }
      },
    });
  });

  // Use this format when adding button with AJAX
  $(document).on('click', '.btn-firmware-add', function(event) {
    let encoded = $('#avail-firmware-table').data('encoded');
    let company = $(this).data('company');
    let firmwarefile = $(this).data('firmwarefile');
    let currBtn = $(this);

    currBtn.prop('disabled', true);
    currBtn.find('.btn-fw-add-icon')
      .removeClass('fa-check')
      .addClass('fa-spinner fa-pulse');
    $.ajax({
      type: 'POST',
      url: '/firmware/add',
      traditional: true,
      data: {encoded: encoded, company: company, firmwarefile: firmwarefile},
      success: function(res) {
        currBtn.prop('disabled', false);
        currBtn.find('.btn-fw-add-icon')
          .removeClass('fa-spinner fa-pulse')
          .addClass('fa-check');
        displayAlertMsg(res);
      },
    });
  });

  $('.checkbox').change(function(event) {
    let itemId = $(this).prop('id');

    if (itemId == 'checkall') {
      $('.checkbox').not(this).prop('checked', this.checked).change();
    } else {
      let row = $(event.target).parents('tr');

      let itemIdx = selectedItens.indexOf(itemId);
      if ($(this).is(':checked')) {
        if (itemIdx == -1) {
          selectedItens.push(itemId);
        }
      } else {
        if (itemIdx != -1) {
          selectedItens.splice(itemIdx, 1);
        }
      }
    }
  });

  $('form[name=firmwareform]').submit(function() {
    if ($('input[name=firmwarefile]').val().trim()) {
      $('#btn-submit-upload').prop('disabled', true);
      $('#btn-submit-icon')
        .removeClass('fa-upload')
        .addClass('fa-spinner fa-pulse');
      $.ajax({
        type: 'POST',
        enctype: 'multipart/form-data',
        url: $(this).attr('action'),
        data: new FormData($(this)[0]),
        processData: false,
        contentType: false,
        cache: false,
        timeout: 600000,
        success: function(res) {
          $('#btn-submit-upload').prop('disabled', false);
          $('#btn-submit-icon')
            .addClass('fa-upload')
            .removeClass('fa-spinner fa-pulse');
          displayAlertMsg(res);
          if (res.type == 'success') {
            setTimeout(function() {
              window.location.reload();
            }, 2000);
          }
        },
      });
    } else {
      displayAlertMsg({
        type: 'danger',
        message: 'Nenhum arquivo foi selecionado',
      });
    }

    return false;
  });

  $('form[name=firmwaresync]').submit(function() {
    $('#btn-firmware-sync').prop('disabled', true);
    $('#btn-firmware-sync-icon')
      .removeClass('fa-sync-alt')
      .addClass('fa-spinner fa-pulse');
    $('#avail-firmware-list').empty();
    $('#avail-firmware-tableres').hide();
    $('#avail-firmware-placeholder').show();
    $.post($(this).attr('action'), $(this).serialize(), function(res) {
      $('#btn-firmware-sync').prop('disabled', false);
      $('#btn-firmware-sync-icon')
        .addClass('fa-sync-alt')
        .removeClass('fa-spinner fa-pulse');
      if (res.type == 'success') {
        $('#avail-firmware-placeholder').hide();
        $('#avail-firmware-tableres').show();
        res.firmwarelist.forEach(function(firmwareInfoObj) {
          $('#avail-firmware-list').append(
            $('<tr></tr>').append(
              $('<td></td>').addClass('text-center').html(firmwareInfoObj.vendor),
              $('<td></td>').addClass('text-center').html(firmwareInfoObj.model),
              $('<td></td>').addClass('text-center').html(firmwareInfoObj.version),
              $('<td></td>').addClass('text-center').html(firmwareInfoObj.release),
              $('<td></td>').addClass('text-center').append(
                $('<button></button>').append(
                  $('<div></div>').addClass('fas fa-check btn-fw-add-icon'),
                  $('<span></span>').html('&nbsp Adicionar')
                ).addClass('btn btn-sm my-0 teal lighten-2 btn-firmware-add')
                .attr('data-firmwarefile', firmwareInfoObj.uri)
                .attr('data-company', firmwareInfoObj.company)
                .attr('type', 'button')
              )
            )
          );
        });
        $('#avail-firmware-table').attr('data-encoded', res.encoded);

        $('#avail-firmware-table').DataTable({
          'destroy': true,
          'paging': true,
          'info': false,
          'pagingType': 'numbers',
          'language': {
            'zeroRecords': 'Nenhum registro encontrado',
            'infoEmpty': 'Nenhum firmware disponível',
            'search': 'Buscar',
            'lengthMenu': 'Exibir _MENU_ firmwares',
          },
          'order': [[0, 'asc'], [1, 'asc'], [2, 'asc'], [3, 'desc']],
        });
      } else {
        displayAlertMsg({
          type: res.type,
          message: res.message,
        });
      }
    }, 'json');

    return false;
  });
});
