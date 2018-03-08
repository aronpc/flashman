
$(document).on('change', ':file', function() {
  var input = $(this);
  var numFiles = input.get(0).files ? input.get(0).files.length : 1;
  var label = input.val().replace(/\\/g, '/').replace(/.*\//, '');

  input.trigger('fileselect', [numFiles, label]);
});

$(document).ready(function() {

  var selectedItens = [];

  $(':file').on('fileselect', function(event, numFiles, label) {
    var input = $(this).parents('.input-group').find(':text');

    if(input.length) {
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
          setTimeout(function(){
            window.location.reload();
          }, 100);
        } else {
          $('#flash-banner div').addClass('alert-' + res.type)
          $('#flash-banner div').html(res.message)
          $('#flash-banner').show();
        }
      }
    });
  });

  $('.checkbox').change(function(event) {
    var itemId = $(this).prop('id');

    if (itemId == 'checkall') {
      $('.checkbox').not(this).prop('checked', this.checked).change();
    } else {
      var row = $(event.target).parents('tr');

      var itemIdx = selectedItens.indexOf(itemId);
      if ($(this).is(':checked')) {
        if(itemIdx == -1) {
          selectedItens.push(itemId);
        }
      } else {
        if(itemIdx != -1) {
          selectedItens.splice(itemIdx, 1);
        }
      }
    }
  });

  $('form[name=firmwareform]').submit(function() {
    if ($('input[name=firmwarefile]').val().trim()) {
      $.ajax({
        type: "POST",
        enctype: "multipart/form-data",
        url: $(this).attr('action'),
        data: new FormData($(this)[0]),
        processData: false,
        contentType: false,
        cache: false,
        timeout: 600000,
        success: function(res) {
          $("#flash-banner div").removeClass (function (index, className) {
              return (className.match (/(^|\s)alert-\S+/g) || []).join(' ');
          });
          $('#flash-banner div').addClass('alert-' + res.type)
          $('#flash-banner div').html(res.message)
          $('#flash-banner').show();
          if (res.type == 'success') {
            setTimeout(function(){
              window.location.reload();
            }, 2000);
          }
        },
      });
    } else {
      $('#flash-banner div').addClass('alert-danger')
      $('#flash-banner div').html('Nenhum arquivo foi selecionado')
      $('#flash-banner').show();
    }

    return false;
  });

});