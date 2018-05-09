let forceUpdateFlashman = function () {
  swal({
    title: 'Atualizando Flashman...',
    onOpen: () => {
      swal.showLoading();
    }
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
          text: 'Você precisará fazer login novamente'
        }).then(function () {
          location.reload();
        });
      }
      else {
        swal({
          type: 'error',
          title: 'Erro ao atualizar'
        });
      }
    }
  });
};

let checkUpdateFlashman = function () {
  swal({
    title: 'Buscando atualizações...',
    onOpen: () => {
      swal.showLoading();
    }
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
        swal({
          type: 'warning',
          title: 'Atualização disponível!',
          text: 'Deseja instalar a nova versão agora?',
          confirmButtonText: 'Atualizar',
          cancelButtonText: 'Agora não',
          showCancelButton: true
        }).then(function (result) {
          if (result.value) {
            forceUpdateFlashman();
          }
        });
      }
      else {
        swal({
          type: 'error',
          title: 'Nenhuma atualização encontrada'
        });
      }
    }
  });
};

$(document).ready(function() {
  $(".update").click(checkUpdateFlashman);
});
