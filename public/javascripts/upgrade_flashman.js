let forceUpdateFlashman = function() {
  swal({
    title: 'Atualizando Flashman...',
    onOpen: () => {
      swal.showLoading();
    },
  });

  $.ajax({
    type: 'POST',
    url: '/upgrade/force',
    dataType: 'json',
    data: JSON.stringify({}),
    contentType: 'application/json',
    success: function(resp) {
      swal.close();
      if (resp.updated) {
        swal({
          type: 'success',
          title: 'Atualização feita com sucesso!',
          text: 'Você precisará fazer login novamente',
          confirmButtonColor: '#4db6ac',
        }).then(function() {
          window.location.href = '/logout';
        });
      } else {
        swal({
          type: 'error',
          title: 'Erro ao atualizar',
          confirmButtonColor: '#4db6ac',
        });
      }
    },
  });
};

let alertUpdateFlashman = function() {
  swal({
    type: 'warning',
    title: 'Atualização disponível!',
    text: 'Deseja instalar a nova versão agora?',
    confirmButtonText: 'Atualizar',
    confirmButtonColor: '#4db6ac',
    cancelButtonText: 'Agora não',
    cancelButtonColor: '#f2ab63',
    showCancelButton: true,
  }).then(function(result) {
    if (result.value) {
      forceUpdateFlashman();
    }
  });
};

let checkUpdateFlashman = function() {
  swal({
    title: 'Buscando atualizações...',
    onOpen: () => {
      swal.showLoading();
    },
  });

  $.ajax({
    type: 'POST',
    url: '/upgrade',
    dataType: 'json',
    data: JSON.stringify({}),
    contentType: 'application/json',
    success: function(resp) {
      swal.close();
      if (resp.hasUpdate) {
        alertUpdateFlashman();
      } else {
        swal({
          type: 'error',
          title: 'Nenhuma atualização encontrada',
          confirmButtonColor: '#4db6ac',
        });
      }
    },
  });
};

let configFlashman = function(event) {
  if ($(this)[0].checkValidity()) {
    $.post($(this).attr('action'), $(this).serialize(), 'json')
      .done(function(res) {
        $('#config-flashman-menu').modal('hide').on('hidden.bs.modal',
          function() {
            displayAlertMsg(res);
            $('#config-flashman-menu').off('hidden.bs.modal');
          }
        );
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        $('#config-flashman-menu').modal('hide').on('hidden.bs.modal',
          function() {
            displayAlertMsg(JSON.parse(jqXHR.responseText));
            $('#config-flashman-menu').off('hidden.bs.modal');
          }
        );
      });
  } else {
    event.preventDefault();
    event.stopPropagation();
  }
  $(this).addClass('was-validated');
  return false;
};

$(document).ready(function() {
  $('.update').click(checkUpdateFlashman);
  $('#config-flashman-form').submit(configFlashman);

  // Load configuration options
  $.ajax({
    type: 'GET',
    url: '/upgrade/config',
    success: function(resp) {
      $('#autoupdate').prop('checked', resp.auto).change();
      $('#minlength-pass-pppoe').val(resp.minlengthpasspppoe);
    },
  });
});
