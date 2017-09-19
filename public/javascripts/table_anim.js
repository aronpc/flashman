$(document).ready(function() {
    $('.glyphicon-menu-right').click(function() {
        $(this).toggleClass("glyphicon-menu-down");
    });
    $('.glyphicon-menu-down').click(function() {
        $(this).toggleClass("glyphicon-menu-right");
    });
});
