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

let alertUpdateFlashman = function () {
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
        alertUpdateFlashman();
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

let configFlashman = function() {
  $.ajax({
    type: 'GET',
    url: '/upgrade/config',
    success: function(resp) {
      swal({
        title: 'Configurações',
        input: 'checkbox',
        inputValue: (resp.auto === true) ? true : false,  // needed since can be null
        inputPlaceholder: 'Deixar que o Flashman se atualize automaticamente',
        confirmButtonText: 'Salvar Alterações'
      }).then(function (result) {
        if ('value' in result) {
          $.ajax({
            type: "POST",
            url: '/upgrade/config',
            dataType: 'json',
            data: JSON.stringify({auto: result.value}),
            contentType: 'application/json',
            success: function(resp) {
              swal({
                type: 'success',
                title: 'Alterações feitas com sucesso'
              });
            }
          });
        }
      });
    }
  });
};

$(document).ready(function() {
  $(".update").click(checkUpdateFlashman);
  $(".config").click(configFlashman);
});
