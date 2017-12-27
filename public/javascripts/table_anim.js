
$(document).ready(function() {
    $('.glyphicon-menu-right').click(function() {
        $(this).toggleClass("glyphicon-menu-down");
    });

    $('.glyphicon-menu-down').click(function() {
        $(this).toggleClass("glyphicon-menu-right");
    });

    $('.btn-trash').click(function(event) {
      var row = $(event.target).parents('tr');
      var id = row.data('deviceid');
      $.ajax({
          url: '/devicelist/delete/' + id,
          type: 'post',
          success: function(res) {
            setTimeout(function(){
              window.location.reload();
            },100);
          }
      });
    });
});
